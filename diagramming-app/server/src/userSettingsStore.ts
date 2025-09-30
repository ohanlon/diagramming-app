import { pool } from './db';

export async function getUserSettings(userId: string) {
  const { rows } = await pool.query('SELECT settings FROM user_settings WHERE user_id=$1', [userId]);
  if (!rows || rows.length === 0) return null;
  return rows[0].settings;
}

export async function upsertUserSettings(userId: string, settings: any) {
  const now = new Date().toISOString();
  const query = `INSERT INTO user_settings (user_id, settings, updated_at) VALUES ($1, $2::jsonb, $3)
  ON CONFLICT (user_id) DO UPDATE SET settings = $2::jsonb, updated_at = $3 RETURNING *`;
  const { rows } = await pool.query(query, [userId, settings, now]);
  return rows[0];
}
