import express from 'express';
import type { Request, Response } from 'express';
import { getAppSetting, upsertAppSetting } from '../appSettingsStore';

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
    // Only allow admin users to change global settings. combinedAuth must have attached user
    const user = (req as any).user;
    if (!user || !user.isAdmin) return res.status(403).json({ error: 'Admin required' });
    await upsertAppSetting('refresh_expires_days', days);
    res.json({ ok: true, days });
  } catch (e) {
    console.error('Failed to set app setting', e);
    res.status(500).json({ error: 'Failed to set setting' });
  }
});

export default router;
