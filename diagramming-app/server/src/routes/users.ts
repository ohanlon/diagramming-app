import express from 'express';
import type { Request, Response } from 'express';
import { getUserSettings, upsertUserSettings } from '../userSettingsStore';

const router = express.Router();

function getRequestUser(req: Request) {
  return (req as any).user as { id: string; username?: string; isAdmin?: boolean } | undefined;
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

export default router;
