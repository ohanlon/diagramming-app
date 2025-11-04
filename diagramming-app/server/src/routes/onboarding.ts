import express from 'express';
import type { Request, Response } from 'express';
import validator from 'validator';
import type { CreateOrganisationParams } from '../organisationsStore';

const router = express.Router();

// POST /onboarding/organisations
router.post('/organisations', async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  // require 'sales' role or 'admin'
  const roles: string[] = Array.isArray(user.roles) ? user.roles : [];
  if (!(roles.includes('sales') || roles.includes('admin'))) return res.status(403).json({ error: 'Sales or Admin role required' });

  const { 
    name, 
    primaryContactEmail, 
    primaryContactName, 
    billingAddress, 
    localAdminEmail,
    companyAdminUserIds,
  } = req.body || {};
  
  if (!name || String(name).trim().length === 0) {
    return res.status(400).json({ error: 'Missing organisation name' });
  }
  if (!primaryContactEmail || !validator.isEmail(String(primaryContactEmail))) {
    return res.status(400).json({ error: 'Invalid primaryContactEmail' });
  }
  if (!primaryContactName || String(primaryContactName).trim().length === 0) {
    return res.status(400).json({ error: 'Missing primary contact name' });
  }
  if (!billingAddress || String(billingAddress).trim().length === 0) {
    return res.status(400).json({ error: 'Missing billing address' });
  }
  if (!localAdminEmail || !validator.isEmail(String(localAdminEmail))) {
    return res.status(400).json({ error: 'Invalid localAdminEmail' });
  }

  try {
    const { createOrganisation, getOrganisationByNameCI, addCompanyAdmin } = require('../organisationsStore');
    
    // Ensure unique name ignoring case
    const existing = await getOrganisationByNameCI(name);
    if (existing) {
      return res.status(409).json({ error: 'Organisation name already exists (case-insensitive)' });
    }

    const params: CreateOrganisationParams = {
      name: String(name).trim(),
      primaryContactEmail: String(primaryContactEmail).toLowerCase(),
      primaryContactName: String(primaryContactName).trim(),
      billingAddress: String(billingAddress).trim(),
      localAdminEmail: String(localAdminEmail).toLowerCase(),
      createdBy: user.id || null,
    };

    const created = await createOrganisation(params);

    // Add company admins if provided
    if (Array.isArray(companyAdminUserIds) && companyAdminUserIds.length > 0) {
      const adminUserIds = companyAdminUserIds.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0);
      
      for (const adminUserId of adminUserIds) {
        try {
          await addCompanyAdmin(created.id, adminUserId, user.id || null);
        } catch (e) {
          console.warn(`Failed to add company admin ${adminUserId} to organisation ${created.id}`, e);
        }
      }
    }

    res.status(201).json({ organisation: created });
  } catch (e) {
    console.error('Failed to create organisation', e);
    res.status(500).json({ error: 'Failed to create organisation' });
  }
});

export default router;
