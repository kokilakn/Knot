
import util from 'util';
if (!util.isNullOrUndefined) {
    util.isNullOrUndefined = (t) => t === null || t === undefined;
}
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Monkey patch for Node.js
const IMAGES_DIR = path.join(__dirname, '../../test-images');

async function start() {
    // main coordinates workers; workers load models themselves to isolate TF memory
    const files = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    console.log(`Found ${files.length} images.`);

    const CONCURRENCY = parseInt(process.env.EMBED_CONCURRENCY, 10) || 4;
    const eventId = process.env.EVENT_ID || '2a68814e-61b9-4ad7-8137-e468e49596f6';
    const maxDim = parseInt(process.env.MAX_IMG_DIM, 10) || 800;
    const batchSize = parseInt(process.env.BATCH_SIZE, 10) || 5;

    const workersCount = Math.min(CONCURRENCY, files.length || 1);
    // distribute files round-robin
    const buckets = Array.from({ length: workersCount }, () => []);
    files.forEach((f, i) => { buckets[i % workersCount].push(f); });

    const { spawn } = await import('child_process');
    const workerScriptPath = fileURLToPath(new URL('./generate-embeddings-worker.js', import.meta.url));

    let totalProcessedFiles = 0;
    let totalFaces = 0;
    let totalInserted = 0;
    let totalErrors = 0;

    const workerPromises = buckets.map((bucketFiles, idx) => new Promise((resolve, reject) => {
        const env = {
            ...process.env,
            WORKER_FILES: JSON.stringify(bucketFiles),
            EVENT_ID: eventId,
            MAX_IMG_DIM: String(maxDim),
            BATCH_SIZE: String(batchSize),
        };

        const child = spawn(process.execPath, [workerScriptPath], { env });

        child.stdout.on('data', (data) => {
            const str = String(data).trim();
            // try parse JSON messages from worker
            try {
                const msg = JSON.parse(str);
                if (msg && msg.type === 'done') {
                    console.log(`[child ${idx}] done - processed ${msg.processedFiles} files, faces=${msg.totalFaces}, inserted=${msg.totalInserted}, errors=${msg.errors.length}`);
                    totalProcessedFiles += msg.processedFiles || 0;
                    totalFaces += msg.totalFaces || 0;
                    totalInserted += msg.totalInserted || 0;
                    totalErrors += (msg.errors && msg.errors.length) || 0;
                }
            } catch (e) {
                console.log(`[child ${idx}] ${str}`);
            }
        });

        child.stderr.on('data', (data) => {
            const str = String(data).trim();
            try {
                const msg = JSON.parse(str);
                if (msg && msg.type === 'error') {
                    console.error(`[child ${idx}] error: ${msg.error}`);
                    totalErrors += 1;
                }
            } catch (e) {
                console.error(`[child ${idx}] ${str}`);
            }
        });

        child.on('error', (err) => reject(err));
        child.on('close', (code) => {
            if (code !== 0) return reject(new Error(`Child ${idx} exited with code ${code}`));
            resolve();
        });
    }));

    await Promise.all(workerPromises);
    console.log('All child processes finished.');
    console.log(`Summary: processedFiles=${totalProcessedFiles}, totalFaces=${totalFaces}, totalInserted=${totalInserted}, totalErrors=${totalErrors}`);
    process.exit(0);
}

start();
