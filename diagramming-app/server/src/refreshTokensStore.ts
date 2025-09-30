import { v4 as uuidv4 } from 'uuid';
import { pool } from './db';
import bcrypt from 'bcryptjs';

const DEFAULT_REFRESH_EXPIRE_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7');
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || '10');

export async function createRefreshToken(userId: string, expiresInDays?: number) {
  const id = uuidv4();
  const secret = Buffer.from(uuidv4() + uuidv4()).toString('hex');
  const tokenHash = bcrypt.hashSync(secret, BCRYPT_ROUNDS);
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + (1000 * 60 * 60 * 24 * (expiresInDays || DEFAULT_REFRESH_EXPIRE_DAYS))).toISOString();

  const query = `INSERT INTO refresh_tokens (id, user_id, token_hash, created_at, expires_at, revoked) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
  const values = [id, userId, tokenHash, createdAt, expiresAt, false];
  await pool.query(query, values);
  // Return the token in the form {id}.{secret} which will be set in cookie
  return `${id}.${secret}`;
}

export async function getRefreshTokenRowById(id: string) {
  const { rows } = await pool.query('SELECT * FROM refresh_tokens WHERE id=$1', [id]);
  return rows[0] || null;
}

export async function revokeRefreshTokenById(id: string) {
  await pool.query('UPDATE refresh_tokens SET revoked=true WHERE id=$1', [id]);
}

export async function revokeAllRefreshTokensForUser(userId: string) {
  await pool.query('UPDATE refresh_tokens SET revoked=true WHERE user_id=$1', [userId]);
}
