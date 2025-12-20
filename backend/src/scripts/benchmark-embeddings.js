import { spawnSync } from 'child_process';
import os from 'os';
import { fileURLToPath } from 'url';
import path from 'path';

const scriptPath = fileURLToPath(new URL('./generate-embeddings.js', import.meta.url));
const cpus = os.cpus().length || 4;
const maxTry = Math.min(cpus * 2, 16);
// allow optional numeric positional arg for max concurrency
const numericArg = process.argv.find(arg => /^\d+$/.test(arg));
const maxConcurrency = numericArg ? Math.min(Number(numericArg), maxTry) : Math.min(cpus, maxTry);
const dryRun = process.argv.includes('--real') ? '0' : '1';
const batchSizeArgIndex = process.argv.indexOf('--batch-size');
let batchSizeArg = null;
if (batchSizeArgIndex !== -1) batchSizeArg = process.argv[batchSizeArgIndex + 1];

console.log(`Benchmarking generate-embeddings.js (dryRun=${dryRun === '1'}). CPUs=${cpus}. Testing concurrencies 1..${maxConcurrency}`);

const results = [];
for (let c = 1; c <= maxConcurrency; c++) {
  console.log(`\nRunning with EMBED_CONCURRENCY=${c} ...`);
  const env = { ...process.env, DRY_RUN: dryRun, EMBED_CONCURRENCY: String(c) };
  if (batchSizeArg) env.BATCH_SIZE = String(batchSizeArg);
  const t0 = Date.now();
  const res = spawnSync(process.execPath, [scriptPath], { env, encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 });
  const t1 = Date.now();
  const dur = (t1 - t0) / 1000;

  if (res.error) {
    console.error(`  Error running concurrency ${c}:`, res.error);
    results.push({ concurrency: c, success: false, error: String(res.error) });
    continue;
  }

  // try to extract summary line
  let processedFiles = null;
  const out = String(res.stdout || '') + '\n' + String(res.stderr || '');
  const m = out.match(/Summary: processedFiles=(\d+), totalFaces=(\d+), totalInserted=(\d+), totalErrors=(\d+)/);
  if (m) {
    processedFiles = Number(m[1]);
    const totalInserted = Number(m[3] || 0);
    const insertsPerSec = totalInserted / dur;
    console.log(`  inserts=${totalInserted} inserts/sec=${insertsPerSec.toFixed(2)}`);
  }

  console.log(`  duration=${dur}s`);
  if (!processedFiles) console.log('  (processedFiles not found in output; check logs)');

  results.push({ concurrency: c, success: res.status === 0, duration: dur, processedFiles });
}

// pick best successful run with smallest duration
const successful = results.filter(r => r.success && typeof r.duration === 'number');
if (successful.length) {
  successful.sort((a, b) => a.duration - b.duration);
  const best = successful[0];
  console.log(`\nBest concurrency: ${best.concurrency} (duration=${best.duration}s)`);
} else {
  console.log('\nNo successful runs recorded.');
}

console.log('\nAll results:');
for (const r of results) console.log(r);
