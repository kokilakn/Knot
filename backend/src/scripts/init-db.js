
import { query } from '../db/client.js';

async function initDb() {
    try {
        console.log('Creating photos table...');
        await query(`
      CREATE TABLE IF NOT EXISTS photos (
        id SERIAL PRIMARY KEY,
        link TEXT NOT NULL,
        event_id TEXT,
        vector TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('Photos table created successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error initializing DB:', err);
        process.exit(1);
    }
}

initDb();
