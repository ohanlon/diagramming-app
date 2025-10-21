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
    const fallback = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '365');
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
    let isAdmin = Array.isArray((req as any).user?.roles) ? (req as any).user.roles.includes('admin') : false;
    if (!isAdmin && reqUser?.id) {
      const { getUserRoles } = require('../usersStore');
      const roles = await getUserRoles(reqUser.id);
      isAdmin = roles.includes('admin');
      if (isAdmin) (req as any).user.roles = roles;
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
    let isAdmin = Array.isArray((req as any).user?.roles) ? (req as any).user.roles.includes('admin') : false;
    if (!isAdmin && reqUser?.id) {
      const { getUserRoles } = require('../usersStore');
      const roles = await getUserRoles(reqUser.id);
      isAdmin = roles.includes('admin');
      if (isAdmin) (req as any).user.roles = roles;
    }
    if (!isAdmin) return res.status(403).json({ error: 'Admin required' });

  const { username, id, role } = req.body || {};
  const desiredRole = role && typeof role === 'string' ? String(role) : 'admin';
  if (!username && !id) return res.status(400).json({ error: 'Provide username or id' });
  const targetUser = username ? await (require('../usersStore').getUserByUsername)(username) : await (require('../usersStore').getUserById)(id);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });
  // Promote to desired role
  await (require('../usersStore').addUserRole)(targetUser.id, desiredRole);
  const roles = await (require('../usersStore').getUserRoles)(targetUser.id);
  res.json({ ok: true, user: { id: targetUser.id, username: targetUser.username, roles } });
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
    let isAdmin = Array.isArray((req as any).user?.roles) ? (req as any).user.roles.includes('admin') : false;
    if (!isAdmin && reqUser?.id) {
      const { getUserRoles } = require('../usersStore');
      const roles = await getUserRoles(reqUser.id);
      isAdmin = roles.includes('admin');
      if (isAdmin) (req as any).user.roles = roles;
    }
    if (!isAdmin) return res.status(403).json({ error: 'Admin required' });

    const rows = await (require('../usersStore').getUsersWithRole)('admin');
    res.json({ admins: rows || [] });
  } catch (e) {
    console.error('Failed to list admins', e);
    res.status(500).json({ error: 'Failed to list admins' });
  }
});

export default router;
