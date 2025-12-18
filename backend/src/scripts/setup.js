
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MODELS_DIR = path.join(__dirname, '../../models');
const IMAGES_DIR = path.join(__dirname, '../../test-images');

const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master';

const files = [
    // Models
    { type: 'model', name: 'ssd_mobilenetv1_model-weights_manifest.json' },
    { type: 'model', name: 'ssd_mobilenetv1_model-shard1' },
    { type: 'model', name: 'ssd_mobilenetv1_model-shard2' },
    { type: 'model', name: 'face_landmark_68_model-weights_manifest.json' },
    { type: 'model', name: 'face_landmark_68_model-shard1' },
    { type: 'model', name: 'face_recognition_model-weights_manifest.json' },
    { type: 'model', name: 'face_recognition_model-shard1' },
    { type: 'model', name: 'face_recognition_model-shard2' },

    // Images
    { type: 'image', name: 'bbt1.jpg' },
    { type: 'image', name: 'bbt2.jpg' },
    { type: 'image', name: 'bbt3.jpg' },
    { type: 'image', name: 'bbt4.jpg' },
    { type: 'image', name: 'bbt5.jpg' },
];

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(dest)) {
            console.log(`Skipping ${path.basename(dest)} (already exists)`);
            return resolve();
        }

        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                return reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded ${path.basename(dest)}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
};

const main = async () => {
    console.log('Starting download setup...');

    for (const item of files) {
        let url, dest;
        if (item.type === 'model') {
            url = `${BASE_URL}/weights/${item.name}`;
            dest = path.join(MODELS_DIR, item.name);
        } else {
            url = `${BASE_URL}/examples/examples-nodejs/images/${item.name}`;
            dest = path.join(IMAGES_DIR, item.name);
        }

        try {
            await downloadFile(url, dest);
        } catch (err) {
            console.error(`Error downloading ${item.name}:`, err.message);
        }
    }

    console.log('Setup complete.');
};

main();
