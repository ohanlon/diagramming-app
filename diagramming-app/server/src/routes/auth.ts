import express from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, getUserByUsername } from '../usersStore';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || '10');

const router = express.Router();

router.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });
  try {
    const existing = await getUserByUsername(username);
    if (existing) return res.status(409).json({ error: 'Username already exists' });
    const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
    const created = await createUser(username, passwordHash);
    // Issue token immediately so UI can sign in after registering
    const token = (jwt as any).sign({ id: created.id, username: created.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.status(201).json({ user: { id: created.id, username: created.username }, token });
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
    const token = (jwt as any).sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ user: { id: user.id, username: user.username }, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to login' });
  }
});

export default router;
