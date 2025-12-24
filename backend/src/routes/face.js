
import express from 'express';
import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData, loadImage } from 'canvas';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { query, getClient } from '../db/client.js';
// import fs from 'fs/promises'; // No longer needed for photos
import { convertHeicToJpeg } from '../utils/image.js';
import storage from '../services/storage/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Monkey patch for Node.js
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const MODELS_DIR = path.join(__dirname, '../../models');
let modelsLoaded = false;

// Optimization: Use higher confidence and pre-define options
const SSD_OPTIONS = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.6 });
const MIN_FACE_SIZE = 80; // Minimum face dimension in pixels to reduce background noise

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
    return faceapi.euclideanDistance(descriptor1, descriptor2);
}

// Helper to check if buffer is HEIC (simple signature check)
function isHeicBuffer(buffer) {
    if (!buffer || buffer.length < 12) return false;
    // HEIC signature often at offset 4 or 8: 'ftypheic', 'ftypheix', 'ftypmif1', 'ftypmsf1'
    // Simplified check for 'ftyp' at index 4
    if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
        const sub = buffer.subarray(8, 12).toString('ascii');
        return ['heic', 'heix', 'mif1', 'msf1'].some(s => sub.indexOf(s) === 0); // very rough check
    }
    return false;
}

// Helper to check by extension
function isHeicExt(urlOrPath) {
    return /\.(heic|heif)$/i.test(urlOrPath);
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
        let detections = await faceapi.detectAllFaces(img, SSD_OPTIONS).withFaceLandmarks().withFaceDescriptors();

        // Optimization: Filter out small background faces
        detections = detections.filter(d => d.detection.box.width >= MIN_FACE_SIZE && d.detection.box.height >= MIN_FACE_SIZE);

        if (!detections || !detections.length) {
            return res.status(400).json({ error: 'No face detected in image. Ensure face is clear and close to camera.' });
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
                // Removed limit to allow all matches
            }

            return {
                faceIndex: idx,
                box: detections[idx].detection && detections[idx].detection.box ? detections[idx].detection.box : null,
                rawMatches: matches
                    .filter(m => m.distance < 0.55)
                    .map(m => ({
                        id: m.id,
                        link: m.link,
                        distance: m.distance,
                        uploaderId: m.uploaderId || m.uploader_id || m.uploaderid,
                        eventCreatorId: m.eventCreatorId || m.event_creator_id || m.eventcreatorid
                    })),
                uniqueImageMatches: unique
                    .filter(m => m.distance < 0.48)
                    .map(m => ({
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
// Body: { link: "https://r2-url/...", eventId: "..." }
router.post('/process', async (req, res) => {
    try {
        const { link, eventId } = req.body;
        console.log(`[FaceProcess] Processing request for link: ${link}, eventId: ${eventId}`);
        if (!link) {
            return res.status(400).json({ error: 'Link is required' });
        }

        // Optimization: Skip if we already have a vector for this exact link
        const existing = await query('SELECT id FROM photos WHERE link = $1 AND vector IS NOT NULL LIMIT 1', [link.trim()]);
        if (existing && existing.rowCount > 0) {
            console.log(`[FaceProcess] Skipping as embedding already exists for: ${link}`);
            return res.json({ success: true, faceDetected: true, skipped: true });
        }

        await loadModels();

        const cleanLink = link.trim();
        console.log(`[FaceProcess] Processing embedding for: "${cleanLink}"`);

        let img;
        let buffer;

        try {
            // Retrieve file buffer via storage service
            buffer = await storage.getFile(cleanLink);

            // Check HEIC
            if (isHeicExt(cleanLink) || isHeicBuffer(buffer)) {
                console.log(`[FaceProcess] HEIC/HEIF detected. Converting to JPEG: ${cleanLink}`);
                const outputBuffer = await convertHeicToJpeg(buffer, 1);
                console.log(`[FaceProcess] Conversion successful. Output size: ${outputBuffer.length} bytes`);
                img = await loadImage(outputBuffer);
            } else {
                console.log(`[FaceProcess] Standard image detected: ${cleanLink}`);
                img = await loadImage(buffer);
            }

        } catch (fetchError) {
            console.error(`[FaceProcess] Failed to load image for ${cleanLink}:`, fetchError);
            return res.status(500).json({ error: 'Failed to load image', details: fetchError.message });
        }


        let detections = await faceapi.detectAllFaces(img, SSD_OPTIONS).withFaceLandmarks().withFaceDescriptors();

        // Filter small faces
        detections = detections.filter(d => d.detection.box.width >= MIN_FACE_SIZE && d.detection.box.height >= MIN_FACE_SIZE);

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

