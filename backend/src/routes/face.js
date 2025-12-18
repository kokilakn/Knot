
import express from 'express';
import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData, loadImage } from 'canvas';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { query } from '../db/client.js';

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

        // Load image from base64
        // Base64 format: data:image/jpeg;base64,...
        const img = await loadImage(image);
        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

        if (!detection) {
            return res.status(400).json({ error: 'No face detected in image' });
        }

        const queryDescriptor = detection.descriptor;

        // Fetch stored embeddings for this event
        console.log(`Fetching stored embeddings for event: ${eventId}`);
        let dbQuery = 'SELECT id, link, vector FROM photos WHERE vector IS NOT NULL';
        let params = [];

        if (eventId) {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
            if (isUuid) {
                dbQuery += ' AND event_id = $1';
                params.push(eventId);
            } else {
                // If not a UUID, treat as a code and join with events table
                dbQuery = `
                    SELECT p.id, p.link, p.vector 
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
                distance: m.distance
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

        // Construct absolute path
        // For POC, we assume the frontend is in the same parent dir as Knot
        const absolutePath = path.join(__dirname, '../../../frontend/public', link);
        console.log(`Processing embedding for: ${absolutePath}`);

        const img = await loadImage(absolutePath);
        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

        if (detection) {
            const descriptor = Array.from(detection.descriptor);
            const vectorStr = JSON.stringify(descriptor);

            await query('UPDATE photos SET vector = $1 WHERE link = $2', [vectorStr, link]);
            console.log(`  Embedding saved for ${link}`);
            res.json({ success: true, faceDetected: true });
        } else {
            console.log(`  No face detected in ${link}`);
            res.json({ success: true, faceDetected: false });
        }

    } catch (error) {
        console.error('Face process error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

export default router;
