
import pg from 'pg';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
