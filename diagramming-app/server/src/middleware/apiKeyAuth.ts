import { Request, Response, NextFunction } from 'express';
import { getOrganisationByApiKey } from '../organisationsStore';

// Extend Express Request to include organisation data
declare global {
  namespace Express {
    interface Request {
      organisation?: {
        id: string;
        name: string;
        api_key: string;
        primary_contact_email: string;
        primary_contact_name: string;
        billing_address: string;
        localadmin_email: string;
        created_by: string | null;
        created_at: string;
      };
    }
  }
}

/**
 * Middleware to validate API key from request headers.
 * Expects the API key in the 'X-API-Key' header.
 * If valid, attaches organisation data to req.organisation.
 */
export async function validateApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (!apiKey) {
    res.status(401).json({ error: 'API key required' });
    return;
  }

  try {
    const organisation = await getOrganisationByApiKey(apiKey);

    if (!organisation) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    // Attach organisation to request for downstream handlers
    req.organisation = organisation;
    next();
  } catch (err) {
    console.error('API key validation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Optional middleware that validates API key if present, but doesn't require it.
 * Useful for endpoints that can work with or without organisation context.
 */
export async function optionalApiKey(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (!apiKey) {
    next();
    return;
  }

  try {
    const organisation = await getOrganisationByApiKey(apiKey);
    if (organisation) {
      req.organisation = organisation;
    }
    next();
  } catch (err) {
    console.error('Optional API key validation error:', err);
    next();
  }
}
