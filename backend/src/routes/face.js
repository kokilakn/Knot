
import express from 'express';
import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData, loadImage } from 'canvas';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { query, getClient } from '../db/client.js';
import fs from 'fs/promises';
import { convertHeicToJpeg, isHeic } from '../utils/image.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Monkey patch for Node.js
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const MODELS_DIR = path.join(__dirname, '../../models');
let modelsLoaded = false;

async function loadModels() {
    if (modelsLoaded) return;
    console.log('Loading face-api models...');
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_DIR);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_DIR);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_DIR);
    modelsLoaded = true;
    console.log('Face-api models loaded.');
}

function euclideanDistance(descriptor1, descriptor2) {
    const d1 = Array.isArray(descriptor1) ? descriptor1.slice() : Array.from(descriptor1);
    const d2 = Array.isArray(descriptor2) ? descriptor2.slice() : Array.from(descriptor2);
    if (d1.length !== d2.length) return Infinity;
    const norm1 = Math.sqrt(d1.reduce((s, v) => s + v * v, 0)) || 1;
    const norm2 = Math.sqrt(d2.reduce((s, v) => s + v * v, 0)) || 1;
    let sum = 0;
    for (let i = 0; i < d1.length; i++) {
        const diff = d1[i] / norm1 - d2[i] / norm2;
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

// POST /api/faces/match
// Body: { image: "base64...", eventId: "..." }
router.post('/match', async (req, res) => {
    try {
        const { image, eventId } = req.body;
        console.log(`[FaceMatch] Received match request for event: ${eventId}`);
        if (!image) {
            return res.status(400).json({ error: 'Image is required' });
        }

        await loadModels();

        // Detect HEIC base64
        let finalImage = image;
        if (typeof image === 'string' && (image.startsWith('data:image/heic') || image.startsWith('data:image/heif'))) {
            console.log('[FaceMatch] HEIC base64 detected, converting...');
            const base64Data = image.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            finalImage = await convertHeicToJpeg(buffer, 1);
        }

        const img = await loadImage(finalImage);
        const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();

        if (!detections || !detections.length) {
            return res.status(400).json({ error: 'No face detected in image' });
        }

        // normalize query descriptors
        const queryDescriptors = detections.map(d => {
            const arr = Array.from(d.descriptor);
            const norm = Math.sqrt(arr.reduce((s, v) => s + v * v, 0)) || 1;
            return arr.map(v => v / norm);
        });

        // Fetch stored embeddings for this event
        console.log(`Fetching stored embeddings for event: ${eventId}`);
        // Use double quotes to preserve camelCase aliases in PostgreSQL results
        let dbQuery = `
            SELECT p.id, p.link, p.vector, p.uploader_id as "uploaderId", e.user_id as "eventCreatorId" 
            FROM photos p 
            JOIN events e ON p.event_id = e.event_id 
            WHERE p.vector IS NOT NULL
        `;
        let params = [];

        if (eventId) {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
            if (isUuid) {
                dbQuery += ' AND p.event_id = $1';
                params.push(eventId);
            } else {
                // If not a UUID, treat as a code and join with events table
                // Note: since we already join events as 'e', we can use e.code
                dbQuery += ' AND e.code = $1';
                params.push(eventId.toUpperCase());
            }
        }

        const result = await query(dbQuery, params);
        const storedFaces = result.rows.map(r => ({ ...r, vector: (() => { try { return JSON.parse(r.vector); } catch (e) { return null; } })() }));
        console.log(`[FaceMatch] Found ${storedFaces.length} photos with embeddings for event ${eventId}`);
        if (storedFaces.length > 0) {
            console.log('[FaceMatch] Sample stored face keys:', Object.keys(storedFaces[0]));
        }

        // For each query face, compute top matches and return combined result
        const topPerFace = queryDescriptors.map((qDesc, idx) => {
            const matches = storedFaces.map(face => {
                if (!face.vector) return { ...face, distance: Infinity };
                const distance = euclideanDistance(qDesc, face.vector);
                return { ...face, distance };
            }).sort((a, b) => a.distance - b.distance);

            // collapse to unique links (best per image)
            const seen = new Set();
            const unique = [];
            for (const m of matches) {
                if (!seen.has(m.link)) {
                    seen.add(m.link);
                    unique.push(m);
                }
                if (unique.length >= 10) break; // limit
            }

            return {
                faceIndex: idx,
                box: detections[idx].detection && detections[idx].detection.box ? detections[idx].detection.box : null,
                rawMatches: matches.slice(0, 10).map(m => ({
                    id: m.id,
                    link: m.link,
                    distance: m.distance,
                    uploaderId: m.uploaderId || m.uploader_id || m.uploaderid,
                    eventCreatorId: m.eventCreatorId || m.event_creator_id || m.eventcreatorid
                })),
                uniqueImageMatches: unique.map(m => ({
                    id: m.id,
                    link: m.link,
                    distance: m.distance,
                    uploaderId: m.uploaderId || m.uploader_id || m.uploaderid,
                    eventCreatorId: m.eventCreatorId || m.event_creator_id || m.eventcreatorid
                }))
            };
        });

        // For backward compatibility, also return the 'matches' array from the first face detected
        const legacyMatches = topPerFace.length > 0 ? topPerFace[0].uniqueImageMatches : [];

        res.json({
            marker: 'MULTI_FACE_MATCH',
            faces: topPerFace,
            matches: legacyMatches,
            debug: { totalStoredEmbeddings: storedFaces.length }
        });

    } catch (error) {
        console.error('Face match error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// POST /api/faces/process
// Body: { link: "/uploads/...", eventId: "..." }
router.post('/process', async (req, res) => {
    try {
        const { link, eventId } = req.body;
        console.log(`[FaceProcess] Processing request for link: ${link}, eventId: ${eventId}`);
        if (!link) {
            return res.status(400).json({ error: 'Link is required' });
        }

        await loadModels();

        const cleanLink = link.trim();
        const absolutePath = path.join(__dirname, '../../../frontend/public', cleanLink);
        console.log(`[FaceProcess] Processing embedding for: "${absolutePath}"`);

        let img;
        const lowerPath = absolutePath.toLowerCase();

        if (isHeic(lowerPath)) {
            console.log(`[FaceProcess] HEIC/HEIF detected. Converting to JPEG: ${cleanLink}`);
            try {
                const inputBuffer = await fs.readFile(absolutePath);
                const outputBuffer = await convertHeicToJpeg(inputBuffer, 1);
                console.log(`[FaceProcess] Conversion successful. Output size: ${outputBuffer.length} bytes`);
                img = await loadImage(outputBuffer);
            } catch (convError) {
                console.error(`[FaceProcess] HEIC conversion failed for ${cleanLink}:`, convError);
                throw new Error(`Failed to convert HEIC image: ${convError.message}`);
            }
        } else {
            console.log(`[FaceProcess] Standard image detected: ${cleanLink}`);
            img = await loadImage(absolutePath);
        }
        const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();

        if (!detections || !detections.length) {
            console.log(`  No face detected in ${cleanLink}`);
            return res.json({ success: true, faceDetected: false });
        }

        // normalize descriptors
        const descriptors = detections.map(d => {
            const arr = Array.from(d.descriptor);
            const norm = Math.sqrt(arr.reduce((s, v) => s + v * v, 0)) || 1;
            return arr.map(v => v / norm);
        });

        // If only one face detected, try to update existing photo row; otherwise insert rows for each face
        if (descriptors.length === 1) {
            const vectorStr = JSON.stringify(descriptors[0]);
            // attempt to update a single existing row for this link
            const updateSql = `WITH one AS (SELECT id FROM photos WHERE link = $2 LIMIT 1) UPDATE photos SET vector = $1 FROM one WHERE photos.id = one.id RETURNING photos.id`;
            const updated = await query(updateSql, [vectorStr, cleanLink]);
            if (updated && updated.rowCount && updated.rowCount > 0) {
                console.log(`  Embedding updated for existing photo row for ${cleanLink}`);
            } else {
                // insert new row
                await query('INSERT INTO photos (link, vector, event_id) VALUES ($1, $2, $3)', [cleanLink, vectorStr, eventId]);
                console.log(`  Embedding inserted for ${cleanLink}`);
            }
            return res.json({ success: true, faceDetected: true, faces: 1 });
        }

        // multiple faces: insert one row per face
        const client = await getClient();
        try {
            await client.query('BEGIN');
            const values = [];
            const params = [];
            let idx = 1;
            for (const desc of descriptors) {
                values.push(`($${idx++}, $${idx++}, $${idx++})`);
                params.push(cleanLink, JSON.stringify(desc), eventId);
            }
            const insertSql = `INSERT INTO photos (link, vector, event_id) VALUES ${values.join(',')}`;
            await client.query(insertSql, params);
            await client.query('COMMIT');
            console.log(`  Inserted ${descriptors.length} embeddings for ${cleanLink}`);
            res.json({ success: true, faceDetected: true, faces: descriptors.length });
        } catch (err) {
            try { await client.query('ROLLBACK'); } catch (e) { }
            console.error('Failed to insert embeddings for multiple faces:', err);
            res.status(500).json({ error: 'Failed to save embeddings', message: err.message });
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Face process error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

export default router;
