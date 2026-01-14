import * as express from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { createUser, getUserByUsername, getUserById } from '../usersStore';
import { getUserSettings } from '../userSettingsStore';
import * as dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || '15m';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || ACCESS_TOKEN_EXPIRES;
const REFRESH_EXPIRES_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '365');
const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET || (process.env.JWT_SECRET ? process.env.JWT_SECRET + '_refresh' : 'dev_refresh_secret');
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || '10');
const COOKIE_MAX_AGE_MS = Number(process.env.COOKIE_MAX_AGE_MS || String(30 * 24 * 60 * 60 * 1000));

const router = express.Router();
const DEFAULT_SAMESITE = (process.env.COOKIE_SAMESITE || (process.env.NODE_ENV === 'production' ? 'strict' : 'lax')) as 'lax' | 'strict' | 'none';

function setAuthCookie(res: Response, token: string, maxAgeMs?: number) {
  const secure = process.env.NODE_ENV === 'production';
  const sameSite = DEFAULT_SAMESITE;
  res.cookie('authToken', token, {
    httpOnly: true,
    secure,
    // Use 'lax' so cross-site GET navigations and top-level GET requests (like credentialed fetch GETs)
    // from the frontend at a different port can include the cookie in development.
    sameSite,
    maxAge: maxAgeMs || 1000 * 60 * 15, // default 15 minutes
    path: '/',
  });
}

function setRefreshCookie(res: Response, refreshToken: string) {
  const secure = process.env.NODE_ENV === 'production';
  const maxAgeMs = REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000;
  const sameSite = DEFAULT_SAMESITE;
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: maxAgeMs,
    path: '/',
  });
}

function createRefreshJwt(userId: string) {
  // Allow runtime override of refresh expiry via app setting if available
  const days = REFRESH_EXPIRES_DAYS;
  const expiresIn = `${days}d`;
  return (jwt as any).sign({ sub: userId, typ: 'refresh' }, REFRESH_JWT_SECRET, { expiresIn });
}

function issueAccessToken(res: Response, userId: string, username: string) {
  const accessToken = (jwt as any).sign({ id: userId, username }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
  setAuthCookie(res, accessToken);
  return accessToken;
}

router.post('/register', async (req: Request, res: Response) => {
  const { username, password, firstName, lastName } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });
  if (!firstName || !String(firstName).trim()) return res.status(400).json({ error: 'Missing firstName' });
  if (!lastName || !String(lastName).trim()) return res.status(400).json({ error: 'Missing lastName' });

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
    if (existing) return res.status(409).json({ error: 'Email address already in use' });
    // Generate a unique salt per user and store the salt in the DB.
    const salt = bcrypt.genSaltSync(BCRYPT_ROUNDS);
    const passwordHash = bcrypt.hashSync(password, salt);
    const created = await createUser(username, passwordHash, salt, String(firstName).trim(), String(lastName).trim());
    const refreshToken = createRefreshJwt(created.id);
    // Set cookies for access and refresh tokens
    issueAccessToken(res, created.id, created.username);
    setRefreshCookie(res, refreshToken);
    const settings = await getUserSettings(created.id);
    try {
      const { getUserRoles } = require('../usersStore');
      const roles = await getUserRoles(created.id);
      res.status(201).json({ user: { id: created.id, username: created.username, firstName: created.first_name || created.firstName || '', lastName: created.last_name || created.lastName || '', roles }, settings });
    } catch (e) {
      res.status(201).json({ user: { id: created.id, username: created.username, firstName: created.first_name || created.firstName || '', lastName: created.last_name || created.lastName || '', roles: [] }, settings });
    }
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
    const refreshToken = createRefreshJwt(user.id);
    issueAccessToken(res, user.id, user.username);
    setRefreshCookie(res, refreshToken);
    const settings = await getUserSettings(user.id);
    try {
      const { getUserRoles } = require('../usersStore');
      const roles = await getUserRoles(user.id);
      res.json({ user: { id: user.id, username: user.username, roles }, settings });
    } catch (e) {
      res.json({ user: { id: user.id, username: user.username, roles: [] }, settings });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to login' });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  // Expect refresh token in httpOnly cookie
  const token = (req as any).cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ error: 'Missing refresh token' });
  }
  try {
    const payload: any = (jwt as any).verify(token, REFRESH_JWT_SECRET);
    if (!payload || payload.typ !== 'refresh' || !payload.sub) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    const userId = payload.sub as string;
    // Fetch username
    let username = '';
    try {
      const user = await getUserById(userId);
      username = user?.username || '';
    } catch (e) {
      // non-fatal
    }
    // Re-issue access token; optionally re-issue refresh to extend sliding session
    issueAccessToken(res, userId, username);
    // Optional: renew refresh cookie to implement sliding expiration
    try {
      const renewed = createRefreshJwt(userId);
      setRefreshCookie(res, renewed);
    } catch (_) { }
    return res.json({ ok: true });
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

router.post('/logout', async (_req: Request, res: Response) => {
  // Clear both access and refresh cookies
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
    // Include authoritative user details (names) and roles in /me
    try {
      const { getUserRoles, getUserById } = require('../usersStore');
      const roles = await getUserRoles(payload.id);
      const userRow = await getUserById(payload.id);
      const firstName = userRow ? (userRow.first_name || userRow.firstName || '') : '';
      const lastName = userRow ? (userRow.last_name || userRow.lastName || '') : '';

      // Fetch avatar from user settings
      let avatarUrl: string | undefined;
      try {
        const settings = await getUserSettings(payload.id);
        if (settings && settings.avatarDataUrl) {
          avatarUrl = settings.avatarDataUrl;
        }
      } catch (e) {
        console.warn('Failed to fetch user settings for avatar', e);
      }

      res.json({ user: { id: payload.id, username: payload.username, firstName, lastName, avatarUrl, roles } });
    } catch (e) {
      console.warn('Failed to fetch user roles or details for /me', e);
      res.json({ user: { id: payload.id, username: payload.username, firstName: '', lastName: '', roles: [] } });
    }
  } catch (e) {
    console.error('Failed to verify token in /me', e);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
