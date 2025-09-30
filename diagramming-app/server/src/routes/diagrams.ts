import express from 'express';
import type { Request, Response } from 'express';
import { createDiagram, getDiagram, replaceDiagram, patchDiagram } from '../diagramsStore';

const router = express.Router();

function getRequestUser(req: Request) {
  return (req as any).user as { id: string; username?: string; isAdmin?: boolean } | undefined;
}

router.post('/', async (req: Request, res: Response) => {
  const { state } = req.body;
  if (!state) return res.status(400).json({ error: 'Missing state' });
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const created = await createDiagram(state, user.id === 'admin' ? null : user.id);
    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create diagram' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const found = await getDiagram(id);
    if (!found) return res.status(404).json({ error: 'Not found' });
    // Enforce ownership unless admin
    if (found.owner_user_id && found.owner_user_id !== user.id && !user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(found);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch diagram' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const { state } = req.body;
  if (!state) return res.status(400).json({ error: 'Missing state' });
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const existing = await getDiagram(id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.owner_user_id && existing.owner_user_id !== user.id && !user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const updated = await replaceDiagram(id, state);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update diagram' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const patch = req.body;
  if (!patch || !patch.state) return res.status(400).json({ error: 'Missing patch' });
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const existing = await getDiagram(id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.owner_user_id && existing.owner_user_id !== user.id && !user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const updated = await patchDiagram(id, patch);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to patch diagram' });
  }
});

export default router;
