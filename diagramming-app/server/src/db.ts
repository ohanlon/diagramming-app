import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment');
}

export const pool = new Pool({ connectionString: DATABASE_URL });

// Optional helper to test connectivity
export async function testConnection() {
  const res = await pool.query('SELECT 1');
  return res;
}
