import express from 'express';
import type { Request, Response } from 'express';
import { getAppSetting, upsertAppSetting } from '../appSettingsStore';
import { getUserById } from '../usersStore';

const router = express.Router();

// Get the configured refresh token expiry (days)
router.get('/refresh-token-days', async (_req: Request, res: Response) => {
  try {
    const configured = await getAppSetting('refresh_expires_days');
    if (configured && typeof configured === 'number') return res.json({ days: configured });
    // fallback to server env default
    const fallback = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30');
    res.json({ days: fallback });
  } catch (e) {
    console.error('Failed to read app setting', e);
    res.status(500).json({ error: 'Failed to read setting' });
  }
});

// Update the configured refresh token expiry (days). Requires admin privileges
router.post('/refresh-token-days', async (req: Request, res: Response) => {
  try {
    // Expect { days: number }
    const days = Number(req.body?.days);
    if (!Number.isFinite(days) || days < 1 || days > 3650) return res.status(400).json({ error: 'Invalid days' });
    // Ensure the requester is an admin. combinedAuth sets req.user but may not include isAdmin
    const reqUser = (req as any).user;
    let isAdmin = !!reqUser?.isAdmin;
    if (!isAdmin && reqUser?.id) {
      const userRow = await getUserById(reqUser.id);
      isAdmin = !!userRow?.is_admin;
      if (isAdmin) (req as any).user.isAdmin = true;
    }
    if (!isAdmin) return res.status(403).json({ error: 'Admin required' });
    await upsertAppSetting('refresh_expires_days', days);
    res.json({ ok: true, days });
  } catch (e) {
    console.error('Failed to set app setting', e);
    res.status(500).json({ error: 'Failed to set setting' });
  }
});

// Promote a user to admin (by username or id). Requires admin privileges.
router.post('/promote', async (req: Request, res: Response) => {
  try {
    // Ensure requester is admin
    const reqUser = (req as any).user;
    let isAdmin = !!reqUser?.isAdmin;
    if (!isAdmin && reqUser?.id) {
      const userRow = await getUserById(reqUser.id);
      isAdmin = !!userRow?.is_admin;
      if (isAdmin) (req as any).user.isAdmin = true;
    }
    if (!isAdmin) return res.status(403).json({ error: 'Admin required' });

    const { username, id } = req.body || {};
    if (!username && !id) return res.status(400).json({ error: 'Provide username or id' });
    const where = username ? { field: 'username', value: String(username) } : { field: 'id', value: String(id) };
    const query = `UPDATE users SET is_admin=true WHERE ${where.field} = $1 RETURNING id, username, is_admin`;
    const { rows } = await (require('../db').pool.query)(query, [where.value]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true, user: rows[0] });
  } catch (e) {
    console.error('Failed to promote user', e);
    res.status(500).json({ error: 'Failed to promote user' });
  }
});

// List admin users
router.get('/admins', async (req: Request, res: Response) => {
  try {
    // Ensure requester is admin
    const reqUser = (req as any).user;
    let isAdmin = !!reqUser?.isAdmin;
    if (!isAdmin && reqUser?.id) {
      const userRow = await getUserById(reqUser.id);
      isAdmin = !!userRow?.is_admin;
      if (isAdmin) (req as any).user.isAdmin = true;
    }
    if (!isAdmin) return res.status(403).json({ error: 'Admin required' });

    const { rows } = await (require('../db').pool.query)('SELECT id, username FROM users WHERE is_admin = true');
    res.json({ admins: rows || [] });
  } catch (e) {
    console.error('Failed to list admins', e);
    res.status(500).json({ error: 'Failed to list admins' });
  }
});

export default router;
