import pg from 'pg';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const { Pool } = pg;

// Helper to determine SSL requirements based on provider
const getSSLConfig = (connString) => {
    if (!connString) return false;

    // Explicitly enable for Neon/cloud providers or if ?sslmode=require is present
    if (connString.includes('neon.tech') ||
        connString.includes('supabase.co') ||
        connString.includes('sslmode=require')) {
        return { rejectUnauthorized: false };
    }
    return false;
};

const poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: getSSLConfig(process.env.DATABASE_URL),
    // Standard pool settings for reliability
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
};

const pool = new Pool(poolConfig);

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
