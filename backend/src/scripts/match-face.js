
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

    const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

    if (!detection) {
        console.error('No face detected in query image.');
        process.exit(1);
    }

    const queryDescriptor = detection.descriptor;

    console.log('Fetching stored embeddings...');
    const res = await query('SELECT id, link, vector FROM photos WHERE vector IS NOT NULL');
    const storedFaces = res.rows;
    console.log(`Found ${storedFaces.length} stored faces.`);

    const matches = storedFaces.map(face => {
        const vector = JSON.parse(face.vector);
        const distance = euclideanDistance(queryDescriptor, vector);
        return { ...face, distance };
    });

    matches.sort((a, b) => a.distance - b.distance);

    console.log('\nTop 3 Matches:');
    matches.slice(0, 3).forEach((match, i) => {
        console.log(`${i + 1}. ${path.basename(match.link)} (Distance: ${match.distance.toFixed(4)})`);
    });

    process.exit(0);
}

start();
