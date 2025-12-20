
import util from 'util';
if (!util.isNullOrUndefined) {
    util.isNullOrUndefined = (t) => t === null || t === undefined;
}
import * as tf from '@tensorflow/tfjs-node';
import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData, loadImage } from 'canvas';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { query } from '../db/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const MODELS_DIR = path.join(__dirname, '../../models');

async function loadModels() {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_DIR);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_DIR);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_DIR);
}

function euclideanDistance(descriptor1, descriptor2) {
    const d1 = Array.isArray(descriptor1) ? descriptor1.slice() : Array.from(descriptor1);
    const d2 = Array.isArray(descriptor2) ? descriptor2.slice() : Array.from(descriptor2);

    if (d1.length !== d2.length) return Infinity;

    // L2-normalize both descriptors to make distances comparable even if stored vectors are unnormalized
    const norm1 = Math.sqrt(d1.reduce((s, v) => s + v * v, 0)) || 1;
    const norm2 = Math.sqrt(d2.reduce((s, v) => s + v * v, 0)) || 1;

    let sum = 0;
    for (let i = 0; i < d1.length; i++) {
        const diff = d1[i] / norm1 - d2[i] / norm2;
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

async function start() {
    const imagePath = process.argv[2];
    if (!imagePath) {
        console.error('Please provide an image path as argument.');
        process.exit(1);
    }

    console.log('Loading models...');
    await loadModels();
    console.log('Models loaded.');

    console.log(`Processing query image: ${imagePath}...`);
    let img;
    try {
        img = await loadImage(imagePath);
    } catch (e) {
        console.error(`Could not load image: ${e.message}`);
        process.exit(1);
    }

    const topNArgIndex = process.argv.indexOf('--top');
    const topN = topNArgIndex !== -1 ? parseInt(process.argv[topNArgIndex + 1], 10) || 3 : 3;

    const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();

    if (!detections || !detections.length) {
        console.error('No faces detected in query image.');
        process.exit(1);
    }

    console.log(`Detected ${detections.length} face(s) in query image.`);

    console.log('Fetching stored embeddings...');
    const res = await query('SELECT id, link, vector FROM photos WHERE vector IS NOT NULL');
    const storedFaces = res.rows.map(f => ({ ...f, vector: JSON.parse(f.vector) }));
    console.log(`Found ${storedFaces.length} stored faces.`);

    // For each detected face, compute distances to all stored faces and print top matches
    for (let i = 0; i < detections.length; i++) {
        const det = detections[i];
        const qDesc = det.descriptor;
        const bbox = det.detection && det.detection.box ? det.detection.box : null;

        const matches = storedFaces.map(face => ({
            id: face.id,
            link: face.link,
            distance: euclideanDistance(qDesc, face.vector),
        }));

        matches.sort((a, b) => a.distance - b.distance);

        console.log(`\nFace #${i + 1}${bbox ? ` (box: x=${bbox.x.toFixed(0)} y=${bbox.y.toFixed(0)} w=${bbox.width.toFixed(0)} h=${bbox.height.toFixed(0)})` : ''}`);
        console.log(`Top ${topN} raw matches:`);
        matches.slice(0, topN).forEach((m, idx) => {
            console.log(`${idx + 1}. ${path.basename(m.link)} (Distance: ${m.distance.toFixed(4)})`);
        });

        // Also collapse matches by `link` (best match per image) to prefer image-level hits
        const seenLinks = new Set();
        const uniqueByLink = [];
        for (const m of matches) {
            if (!seenLinks.has(m.link)) {
                seenLinks.add(m.link);
                uniqueByLink.push(m);
            }
            if (uniqueByLink.length >= topN) break;
        }

        console.log(`Top ${topN} unique-image matches:`);
        uniqueByLink.forEach((m, idx) => {
            console.log(`${idx + 1}. ${path.basename(m.link)} (Distance: ${m.distance.toFixed(4)})`);
        });
    }

    process.exit(0);
}

start();
