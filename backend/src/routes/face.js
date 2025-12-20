
import express from 'express';
import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData, loadImage } from 'canvas';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { query } from '../db/client.js';
import fs from 'fs/promises';
import heicConvert from 'heic-convert';

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
    const d1 = Array.isArray(descriptor1) ? descriptor1 : Array.from(descriptor1);
    const d2 = Array.isArray(descriptor2) ? descriptor2 : Array.from(descriptor2);
    if (d1.length !== d2.length) return Infinity;
    let sum = 0;
    for (let i = 0; i < d1.length; i++) {
        const diff = d1[i] - d2[i];
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
            const jpegBuffer = await heicConvert({
                buffer: buffer,
                format: 'JPEG',
                quality: 1
            });
            finalImage = jpegBuffer;
        }

        const img = await loadImage(finalImage);
        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

        if (!detection) {
            return res.status(400).json({ error: 'No face detected in image' });
        }

        const queryDescriptor = detection.descriptor;

        // Fetch stored embeddings for this event
        console.log(`Fetching stored embeddings for event: ${eventId}`);
        let dbQuery = 'SELECT p.id, p.link, p.vector, p.uploader_id, e.user_id as event_creator_id FROM photos p JOIN events e ON p.event_id = e.event_id WHERE p.vector IS NOT NULL';
        let params = [];

        if (eventId) {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
            if (isUuid) {
                dbQuery += ' AND event_id = $1';
                params.push(eventId);
            } else {
                // If not a UUID, treat as a code and join with events table
                dbQuery = `
                    SELECT p.id, p.link, p.vector, p.uploader_id, e.user_id as event_creator_id 
                    FROM photos p
                    JOIN events e ON p.event_id = e.event_id
                    WHERE p.vector IS NOT NULL AND e.code = $1
                `;
                params.push(eventId.toUpperCase());
            }
        }

        const result = await query(dbQuery, params);
        const storedFaces = result.rows;
        console.log(`[FaceMatch] Found ${storedFaces.length} photos with embeddings for event ${eventId}`);

        const matches = storedFaces.map(face => {
            try {
                const vector = JSON.parse(face.vector);
                const distance = euclideanDistance(queryDescriptor, vector);
                return { ...face, distance };
            } catch (e) {
                return { ...face, distance: Infinity };
            }
        });

        // TEMPORARY: Broadened to 1.0 to ensure everything is returned
        const THRESHOLD = 1.0;
        const filteredMatches = matches
            .filter(m => m.distance < THRESHOLD)
            .sort((a, b) => a.distance - b.distance);

        console.log(`[FaceMatch DEBUG] Total embeddings available: ${matches.length}`);
        console.log(`[FaceMatch DEBUG] Count after threshold ${THRESHOLD}: ${filteredMatches.length}`);
        console.log(`[FaceMatch DEBUG] Top 5 distances:`, filteredMatches.slice(0, 5).map(m => m.distance));

        res.json({
            marker: "REMOVED_LIMIT_V2",
            matches: filteredMatches.map(m => ({
                id: m.id,
                link: m.link,
                distance: m.distance,
                uploaderId: m.uploader_id,
                eventCreatorId: m.event_creator_id
            })),
            debug: {
                totalembeddingsMatched: matches.length,
                closestDistance: matches.length > 0 ? Math.min(...matches.map(m => m.distance)) : null
            }
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
        const isHeic = lowerPath.endsWith('.heic') || lowerPath.endsWith('.heif');

        if (isHeic) {
            console.log(`[FaceProcess] HEIC/HEIF detected. Converting to JPEG: ${cleanLink}`);
            try {
                const inputBuffer = await fs.readFile(absolutePath);
                const outputBuffer = await heicConvert({
                    buffer: inputBuffer,
                    format: 'JPEG',
                    quality: 1
                });
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
        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

        if (detection) {
            const descriptor = Array.from(detection.descriptor);
            const vectorStr = JSON.stringify(descriptor);

            await query('UPDATE photos SET vector = $1 WHERE link = $2', [vectorStr, cleanLink]);
            console.log(`  Embedding saved for ${cleanLink}`);
            res.json({ success: true, faceDetected: true });
        } else {
            console.log(`  No face detected in ${cleanLink}`);
            res.json({ success: true, faceDetected: false });
        }

    } catch (error) {
        console.error('Face process error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

export default router;
