import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;
console.log("Database connection string:", connectionString);

// Disable prefetch as it is not supported for "transaction" pool mode
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
