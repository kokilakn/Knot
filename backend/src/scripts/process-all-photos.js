
import { query } from '../db/client.js';
import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData, loadImage } from 'canvas';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const MODELS_DIR = path.join(__dirname, '../../models');

async function main() {
    console.log('Loading models...');
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_DIR);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_DIR);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_DIR);

    const res = await query('SELECT link FROM photos WHERE vector IS NOT NULL');
    const existing = new Set(res.rows.map(r => r.link));

    const photos = await query('SELECT link FROM photos WHERE vector IS NULL');
    console.log(`Processing ${photos.rows.length} photos...`);

    for (const row of photos.rows) {
        try {
            const absolutePath = path.join(__dirname, '../../../frontend/public', row.link);
            const img = await loadImage(absolutePath);
            const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

            if (detection) {
                const vectorStr = JSON.stringify(Array.from(detection.descriptor));
                await query('UPDATE photos SET vector = $1 WHERE link = $2', [vectorStr, row.link]);
                console.log(`Success: ${row.link}`);
            } else {
                console.log(`No face: ${row.link}`);
            }
        } catch (e) {
            console.error(`Error ${row.link}: ${e.message}`);
        }
    }
    console.log('Done.');
    process.exit(0);
}

main();
