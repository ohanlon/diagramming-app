import { pool } from './db';

export async function getAppSetting(key: string) {
  const { rows } = await pool.query('SELECT value FROM app_settings WHERE key=$1', [key]);
  if (!rows || rows.length === 0) return null;
  return rows[0].value;
}

export async function upsertAppSetting(key: string, value: any) {
  const now = new Date().toISOString();
  const query = `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2::jsonb, $3)
    ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = $3 RETURNING *`;
  const { rows } = await pool.query(query, [key, value, now]);
  return rows[0];
}
