import fs from 'fs';
import path from 'path';
import { pool } from './db';

async function main() {
  const sqlPath = path.resolve(__dirname, '../sql/create_tables.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  try {
    console.log('Applying migrations...');
    await pool.query(sql);
    console.log('Migrations applied successfully');
    process.exit(0);
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
}

main();
