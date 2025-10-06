import express from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, getUserByUsername } from '../usersStore';
import { createRefreshToken, getRefreshTokenRowById, revokeRefreshTokenById } from '../refreshTokensStore';
import { getAppSetting } from '../appSettingsStore';
import { getUserSettings } from '../userSettingsStore';
import dotenv from 'dotenv';
import { pool } from '../db';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || '15m';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || ACCESS_TOKEN_EXPIRES;
const REFRESH_EXPIRES_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7');
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || '10');
const COOKIE_MAX_AGE_MS = Number(process.env.COOKIE_MAX_AGE_MS || String(24 * 60 * 60 * 1000));

const router = express.Router();

function setAuthCookie(res: Response, token: string, maxAgeMs?: number) {
  const secure = process.env.NODE_ENV === 'production';
  res.cookie('authToken', token, {
    httpOnly: true,
    secure,
    // Use 'lax' so cross-site GET navigations and top-level GET requests (like credentialed fetch GETs)
    // from the frontend at a different port can include the cookie in development.
    sameSite: 'lax',
    maxAge: maxAgeMs || 1000 * 60 * 15, // default 15 minutes
    path: '/',
  });
}

async function setRefreshCookie(res: Response, refreshToken: string, maxAgeMs?: number) {
  const secure = process.env.NODE_ENV === 'production';
  let finalMax = maxAgeMs;
  if (!finalMax) {
    // consult runtime app setting if present
    try {
      const configured = await getAppSetting('refresh_expires_days');
      const days = configured && typeof configured === 'number' ? configured as number : Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30');
      finalMax = 1000 * 60 * 60 * 24 * days;
    } catch (e) {
      finalMax = 1000 * 60 * 60 * 24 * Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30');
    }
  }
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: finalMax,
    path: '/',
  });
}

async function issueTokensAndSetCookies(res: Response, userId: string, username: string) {
  // Create access token
  const accessToken = (jwt as any).sign({ id: userId, username }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
  // Create refresh token stored in DB and return token string (createRefreshToken will consult app settings if needed)
  const refreshToken = await createRefreshToken(userId);
  setAuthCookie(res, accessToken);
  await setRefreshCookie(res, refreshToken);
}

router.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

  // Enforce email format for username on signup using validator
  try {
    const validator = require('validator');
    if (!validator.isEmail(String(username))) {
      console.warn('Registration attempted with invalid email:', username);
      return res.status(400).json({ error: 'Username must be a valid email address' });
    }
  } catch (e) {
    // If validator is missing or fails, fall back to previous regex as a last resort
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(username).toLowerCase())) {
      console.warn('Registration attempted with invalid email (fallback):', username);
      return res.status(400).json({ error: 'Username must be a valid email address' });
    }
  }

  try {
    const existing = await getUserByUsername(username);
    if (existing) return res.status(409).json({ error: 'Username already exists' });
    // Generate a unique salt per user and store the salt in the DB.
    const salt = bcrypt.genSaltSync(BCRYPT_ROUNDS);
    const passwordHash = bcrypt.hashSync(password, salt);
    const created = await createUser(username, passwordHash, salt);
  await issueTokensAndSetCookies(res, created.id, created.username);
  const settings = await getUserSettings(created.id);
  res.status(201).json({ user: { id: created.id, username: created.username, isAdmin: !!created.is_admin }, settings });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });
  try {
    const user = await getUserByUsername(username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  await issueTokensAndSetCookies(res, user.id, user.username);
  const settings = await getUserSettings(user.id);
  res.json({ user: { id: user.id, username: user.username, isAdmin: !!user.is_admin }, settings });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to login' });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  const cookieToken = (req as any).cookies?.refreshToken;
  if (!cookieToken) return res.status(401).json({ error: 'Missing refresh token' });
  try {
    // cookieToken is in form id.secret
    const parts = cookieToken.split('.');
    if (parts.length < 2) return res.status(401).json({ error: 'Invalid refresh token format' });
    const id = parts[0];
    const secret = parts.slice(1).join('.');
    const row = await getRefreshTokenRowById(id);
    if (!row) return res.status(401).json({ error: 'Refresh token not found' });
    if (row.revoked) return res.status(401).json({ error: 'Refresh token revoked' });
    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return res.status(401).json({ error: 'Refresh token expired' });
    // verify secret: compare provided secret with stored bcrypt hash
    const ok = bcrypt.compareSync(secret, row.token_hash);
    if (!ok) {
      await revokeRefreshTokenById(id); // suspect token theft
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // rotate: revoke old token and issue new tokens
    await revokeRefreshTokenById(id);
    const userId = row.user_id;
    // Create new tokens and set cookies
    await issueTokensAndSetCookies(res, userId, (req as any).user?.username || '');
    res.json({ ok: true });
  } catch (e) {
    console.error('Refresh failed', e);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  const cookieToken = (req as any).cookies?.refreshToken;
  if (cookieToken) {
    try {
      const parts = cookieToken.split('.');
      const id = parts[0];
      await revokeRefreshTokenById(id);
    } catch (e) {
      console.warn('Failed to revoke refresh token on logout', e);
    }
  }
  res.clearCookie('authToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
  res.json({ ok: true });
});

router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const cookieToken = (req as any).cookies?.authToken;
  if (!authHeader && !cookieToken) return res.status(401).json({ error: 'Not authenticated' });
  try {
    let payload: any = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      payload = (jwt as any).verify(authHeader.slice('Bearer '.length), JWT_SECRET);
    } else if (cookieToken) {
      payload = (jwt as any).verify(cookieToken, JWT_SECRET);
    }
    if (!payload) return res.status(401).json({ error: 'Not authenticated' });
    // Include isAdmin in /me by reading authoritative user row
    try {
      const { rows } = await pool.query('SELECT is_admin FROM users WHERE id=$1', [payload.id]);
      const isAdmin = rows && rows[0] ? !!rows[0].is_admin : false;
      res.json({ user: { id: payload.id, username: payload.username, isAdmin } });
    } catch (e) {
      console.warn('Failed to fetch user is_admin flag for /me', e);
      res.json({ user: { id: payload.id, username: payload.username, isAdmin: false } });
    }
  } catch (e) {
    console.error('Failed to verify token in /me', e);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
