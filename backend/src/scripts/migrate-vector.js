import { getClient } from '../db/client.js';

async function main() {
  const client = await getClient();
  try {
    // ensure photos table exists
    const tRes = await client.query("SELECT to_regclass('public.photos') as tbl");
    if (!tRes.rows[0] || !tRes.rows[0].tbl) {
      console.log('Table photos does not exist. Run init-db.js first.');
      client.release();
      process.exit(1);
    }

    const vRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='photos' AND column_name='vector'");
    const fRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='photos' AND column_name='face_embedding'");

    const hasVector = vRes.rows.length > 0;
    const hasFaceEmbedding = fRes.rows.length > 0;

    if (hasVector) console.log('Column `vector` already exists.');

    if (!hasVector && hasFaceEmbedding) {
      console.log('Renaming `face_embedding` -> `vector`...');
      await client.query('BEGIN');
      await client.query("ALTER TABLE photos RENAME COLUMN face_embedding TO vector");
      await client.query('COMMIT');
      console.log('Rename completed.');
    } else if (!hasVector && !hasFaceEmbedding) {
      console.log('Adding `vector` column...');
      await client.query("ALTER TABLE photos ADD COLUMN vector TEXT");
      console.log('Column `vector` added.');
    } else if (hasVector && hasFaceEmbedding) {
      console.log('Both `vector` and `face_embedding` exist. Copying non-null values from `face_embedding` to `vector` where needed...');
      const r = await client.query("UPDATE photos SET vector = face_embedding WHERE (vector IS NULL OR vector = '') AND (face_embedding IS NOT NULL AND face_embedding <> '') RETURNING id");
      console.log(`Copied values for ${r.rowCount} rows.`);
    }

    // simple sanity: count vectors
    const cnt = await client.query("SELECT COUNT(*)::int AS c, COUNT(vector) FILTER (WHERE vector IS NOT NULL AND vector <> '')::int AS vectors FROM photos");
    console.log('Photos total:', cnt.rows[0].c, 'with vector:', cnt.rows[0].vectors);
    client.release();
    process.exit(0);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (e) {}
    client.release();
    console.error('Migration error:', err.message || String(err));
    process.exit(1);
  }
}

main();
