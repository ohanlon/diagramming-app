import express from 'express';
import type { Request, Response } from 'express';
import { getUserSettings, upsertUserSettings } from '../userSettingsStore';

const router = express.Router();

function getRequestUser(req: Request) {
  return (req as any).user as { id: string; username?: string; roles?: string[] } | undefined;
}

async function isAdminForUser(user: { id?: string; roles?: string[] } | undefined) {
  if (!user) return false;
  if (Array.isArray(user.roles)) return user.roles.includes('admin');
  if (user.id) {
    try {
      const { getUserRoles } = require('../usersStore');
      const roles = await getUserRoles(user.id);
      (user as any).roles = roles;
      return roles.includes('admin');
    } catch (e) {}
  }
  return false;
}

router.get('/me/settings', async (req: Request, res: Response) => {
  const user = getRequestUser(req);
  if (!user) {
    // debug: log cookie and auth header presence when unauthenticated
    console.warn('/me/settings called without authenticated user. Cookies:', (req as any).cookies, 'Authorization:', req.headers.authorization);
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const settings = await getUserSettings(user.id);
    res.json({ settings: settings || {} });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/me/settings', async (req: Request, res: Response) => {
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  const { settings } = req.body;
  if (settings === undefined) return res.status(400).json({ error: 'Missing settings' });
  try {
    const result = await upsertUserSettings(user.id, settings);
    res.json({ settings: result.settings });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// GET /users/:id/shared-by - returns which users shared diagrams with the specified user
router.get('/:id/shared-by', async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  // Only allow the user themselves or an admin
  if (user.id !== id && !(await isAdminForUser(user))) return res.status(403).json({ error: 'Forbidden' });
  try {
    const { listSharedByForUserId } = await import('../diagramsStore');
    const list = await listSharedByForUserId(id);
    res.json({ sharedBy: list });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch shared-by audit' });
  }
});

// GET /users/search - search for users by username or email (admin/sales only)
router.get('/search', async (req: Request, res: Response) => {
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  
  // Require admin or sales role
  const roles: string[] = Array.isArray(user.roles) ? user.roles : [];
  if (!user.id) return res.status(403).json({ error: 'Forbidden' });
  
  if (!roles.length) {
    try {
      const { getUserRoles } = require('../usersStore');
      const loadedRoles = await getUserRoles(user.id);
      (user as any).roles = loadedRoles;
      roles.push(...loadedRoles);
    } catch (e) {
      console.warn('Failed to load user roles', e);
    }
  }
  
  if (!(roles.includes('admin') || roles.includes('sales'))) {
    return res.status(403).json({ error: 'Admin or Sales role required' });
  }

  const query = (req.query.q || '').toString().trim();
  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }

  try {
    const { searchUsers } = require('../usersStore');
    const users = await searchUsers(query);
    // Return minimal user info for autocomplete
    const results = users.map((u: any) => ({
      id: u.id,
      username: u.username,
      firstName: u.first_name || '',
      lastName: u.last_name || '',
    }));
    res.json({ users: results });
  } catch (e) {
    console.error('User search failed', e);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

export default router;
