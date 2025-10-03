import { v4 as uuidv4 } from 'uuid';
import { pool } from './db';

export async function createUser(username: string, passwordHash: string, passwordSalt: string) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const query = `INSERT INTO users(id, username, password_hash, password_salt, created_at) VALUES($1, $2, $3, $4, $5) RETURNING *`;
  const values = [id, username, passwordHash, passwordSalt, now];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function getUserByUsername(username: string) {
  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return rows[0] || null;
}

export async function getUserById(id: string) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

// New: fetch multiple users by an array of usernames (case-insensitive matching)
export async function getUsersByUsernames(usernames: string[]) {
  if (!usernames || usernames.length === 0) return [];
  // Use lower(username) matching to be case-insensitive
  const placeholders = usernames.map((_, i) => `$${i + 1}`).join(',');
  const query = `SELECT * FROM users WHERE lower(username) IN (${placeholders})`;
  const values = usernames.map(u => String(u).toLowerCase());
  const { rows } = await pool.query(query, values as any[]);
  return rows;
}
