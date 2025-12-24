import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Cloud-friendly config (prepare: false for transaction mode, etc.)
export const client = postgres(connectionString, {
    prepare: false,
    ssl: connectionString.includes('neon.tech') || connectionString.includes('sslmode=require') ? 'require' : false
});
export const db = drizzle(client, { schema });
