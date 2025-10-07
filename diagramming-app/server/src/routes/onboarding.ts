import express from 'express';
import type { Request, Response } from 'express';
import validator from 'validator';

const router = express.Router();

// POST /onboarding/organisations
router.post('/organisations', async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  // require 'sales' role or 'admin'
  const roles: string[] = Array.isArray(user.roles) ? user.roles : [];
  if (!(roles.includes('sales') || roles.includes('admin'))) return res.status(403).json({ error: 'Sales or Admin role required' });

  const { name, primaryContactEmail, localAdminEmail } = req.body || {};
  if (!name || String(name).trim().length === 0) return res.status(400).json({ error: 'Missing organisation name' });
  if (!primaryContactEmail || !validator.isEmail(String(primaryContactEmail))) return res.status(400).json({ error: 'Invalid primaryContactEmail' });
  if (!localAdminEmail || !validator.isEmail(String(localAdminEmail))) return res.status(400).json({ error: 'Invalid localAdminEmail' });

  try {
    const { createOrganisation, getOrganisationByNameCI } = require('../organisationsStore');
    // Ensure unique name ignoring case
    const existing = await getOrganisationByNameCI(name);
    if (existing) return res.status(409).json({ error: 'Organisation name already exists (case-insensitive)' });
    const created = await createOrganisation(String(name).trim(), String(primaryContactEmail).toLowerCase(), String(localAdminEmail).toLowerCase(), user.id || null);
    res.status(201).json({ organisation: created });
  } catch (e) {
    console.error('Failed to create organisation', e);
    res.status(500).json({ error: 'Failed to create organisation' });
  }
});

export default router;
