
import util from 'util';
if (!util.isNullOrUndefined) {
    util.isNullOrUndefined = (t) => t === null || t === undefined;
}
import * as tf from '@tensorflow/tfjs-node';
import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData, loadImage } from 'canvas';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { query, getClient } from '../db/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Monkey patch for Node.js
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const MODELS_DIR = path.join(__dirname, '../../models');
const IMAGES_DIR = path.join(__dirname, '../../test-images');

async function loadModels() {
    console.log('Loading models...');
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_DIR);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_DIR);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_DIR);
    console.log('Models loaded.');
}

async function start() {
    await loadModels();

    const files = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    console.log(`Found ${files.length} images.`);

    // Use a real event ID from the database for the POC
    const eventId = '2a68814e-61b9-4ad7-8137-e468e49596f6';
    console.log(`Using Event ID: ${eventId}`);

    for (const file of files) {
        const filePath = path.join(IMAGES_DIR, file);
        console.log(`Processing ${file}...`);

        try {
            const img = await loadImage(filePath);
            const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();

            console.log(`  Found ${detections.length} faces.`);

            for (const detection of detections) {
                const descriptor = Array.from(detection.descriptor); // Convert Float32Array to regular array
                const vectorStr = JSON.stringify(descriptor);

                await query(`
                INSERT INTO photos (link, vector, event_id)
                VALUES ($1, $2, $3)
            `, [`/test-images/${file}`, vectorStr, eventId]);
            }
        } catch (err) {
            console.error(`  Error processing ${file}:`, err);
        }
    }

    console.log('Done.');
    process.exit(0);
}

start();
