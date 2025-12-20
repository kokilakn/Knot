import util from 'util';
if (!util.isNullOrUndefined) {
    util.isNullOrUndefined = (t) => t === null || t === undefined;
}
import * as tf from '@tensorflow/tfjs-node';
import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, getClient } from '../db/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Monkey patch for Node.js
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const MODELS_DIR = path.join(__dirname, '../../models');
const IMAGES_DIR = path.join(__dirname, '../../test-images');

async function loadModels() {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_DIR);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_DIR);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_DIR);
}

function maybeResizeImage(img, maxDim = 800) {
    const w = img.width || img.naturalWidth || 0;
    const h = img.height || img.naturalHeight || 0;
    if (!w || !h) return img;
    if (Math.max(w, h) <= maxDim) return img;
    const scale = maxDim / Math.max(w, h);
    const canvas = Canvas.createCanvas(Math.round(w * scale), Math.round(h * scale));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
}

async function processFile(file, eventId, maxDim) {
    const filePath = path.join(IMAGES_DIR, file);
    try {
        const img = await loadImage(filePath);
        const input = maybeResizeImage(img, maxDim);

        const detections = await faceapi.detectAllFaces(input).withFaceLandmarks().withFaceDescriptors();

        if (!detections || !detections.length) return { file, faces: 0, descriptors: [] };

        // normalize descriptors to unit length to make distances/cosine comparable
        const descriptors = detections.map(d => {
            const arr = Array.from(d.descriptor);
            const norm = Math.sqrt(arr.reduce((s, v) => s + v * v, 0)) || 1;
            return arr.map(v => v / norm);
        });

        // best-effort dispose
        try { tf.engine().disposeVariables && tf.engine().disposeVariables(); } catch (e) {}

        return { file, faces: detections.length, descriptors };
    } catch (err) {
        return { file, error: err.message || String(err) };
    }
}

async function start() {
    const files = JSON.parse(process.env.WORKER_FILES || '[]');
    const eventId = process.env.EVENT_ID || '2a68814e-61b9-4ad7-8137-e468e49596f6';
    const maxDim = parseInt(process.env.MAX_IMG_DIM, 10) || 800;

    await loadModels();

        const results = [];
        const batchSize = parseInt(process.env.BATCH_SIZE, 10) || 5;
        let totalFaces = 0;
        let totalInserted = 0;
        const errors = [];

        for (let i = 0; i < files.length; i += batchSize) {
            const batchFiles = files.slice(i, i + batchSize);
            // detect first, accumulate descriptors
            const batchEntries = [];
            for (const f of batchFiles) {
                console.log(JSON.stringify({ type: 'progress', file: f }));
                // eslint-disable-next-line no-await-in-loop
                const r = await processFile(f, eventId, maxDim);
                results.push(r);
                if (r && r.faces) totalFaces += r.faces;
                if (r && r.error) errors.push({ file: r.file, error: r.error });
                if (r && r.descriptors && r.descriptors.length) {
                    batchEntries.push({ file: r.file, descriptors: r.descriptors });
                }
            }

            // perform single transaction for this batch if there are any descriptors
            if (batchEntries.length && !(process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true')) {
                const values = [];
                const params = [];
                let paramIndex = 1;
                for (const be of batchEntries) {
                    for (const descriptor of be.descriptors) {
                        values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
                        params.push(`/test-images/${be.file}`, JSON.stringify(descriptor), eventId);
                    }
                }

                const insertQuery = `INSERT INTO photos (link, vector, event_id) VALUES ${values.join(',')}`;

                const maxRetries = 3;
                let attempt = 0;
                let insertedThisBatch = 0;
                while (attempt < maxRetries) {
                    attempt += 1;
                    const client = await getClient();
                    try {
                        await client.query('BEGIN');
                        await client.query(insertQuery, params);
                        await client.query('COMMIT');
                        insertedThisBatch = params.length / 3;
                        client.release();
                        break;
                    } catch (err) {
                        try { await client.query('ROLLBACK'); } catch (e) {}
                        client.release();
                        if (attempt >= maxRetries) {
                            errors.push({ batchFiles, error: err.message || String(err) });
                        } else {
                            await new Promise(r => setTimeout(r, 200 * attempt));
                        }
                    }
                }
                totalInserted += insertedThisBatch;
            }
        }

    console.log(JSON.stringify({ type: 'done', processedFiles: results.length, totalFaces, totalInserted, errors }));
}
start().catch(err => {
    console.error(JSON.stringify({ type: 'error', error: err.message || String(err) }));
    process.exit(1);
});
