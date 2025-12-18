
import { query } from '../db/client.js';

async function checkSchema() {
    try {
        const tables = await query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        );
        console.log('Tables in public schema:');
        tables.rows.forEach(row => console.log(`- ${row.table_name}`));

        const columns = await query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'photos'"
        );
        console.log('\nColumns in photos table:');
        columns.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));

        process.exit(0);
    } catch (err) {
        console.error('Error checking schema:', err);
        process.exit(1);
    }
}

checkSchema();
