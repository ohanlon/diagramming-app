import express from 'express';
import type { Request, Response } from 'express';
import { createDiagram, getDiagram, replaceDiagram, patchDiagram } from '../diagramsStore';
import { createDiagramHistory, listDiagramHistory, getDiagramHistoryEntry } from '../historyStore';

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
    // Record initial history entry
    await createDiagramHistory(created.id, created.state, user.id === 'admin' ? null : user.id, 'create');
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
    await createDiagramHistory(id, updated.state, user.id === 'admin' ? null : user.id, 'replace');
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
    await createDiagramHistory(id, updated.state, user.id === 'admin' ? null : user.id, 'patch');
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to patch diagram' });
  }
});

// History endpoints
router.get('/:id/history', async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const found = await getDiagram(id);
    if (!found) return res.status(404).json({ error: 'Not found' });
    if (found.owner_user_id && found.owner_user_id !== user.id && !user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const list = await listDiagramHistory(id);
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list history' });
  }
});

router.get('/:id/history/:historyId', async (req: Request, res: Response) => {
  const { id, historyId } = req.params as { id: string; historyId: string };
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const found = await getDiagram(id);
    if (!found) return res.status(404).json({ error: 'Not found' });
    if (found.owner_user_id && found.owner_user_id !== user.id && !user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const entry = await getDiagramHistoryEntry(historyId);
    if (!entry) return res.status(404).json({ error: 'History entry not found' });
    res.json(entry);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch history entry' });
  }
});

router.post('/:id/history/:historyId/restore', async (req: Request, res: Response) => {
  const { id, historyId } = req.params as { id: string; historyId: string };
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const found = await getDiagram(id);
    if (!found) return res.status(404).json({ error: 'Not found' });
    if (found.owner_user_id && found.owner_user_id !== user.id && !user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const entry = await getDiagramHistoryEntry(historyId);
    if (!entry) return res.status(404).json({ error: 'History entry not found' });
    // Replace diagram with history state (this will also create a new history entry recording the restore)
    const replaced = await replaceDiagram(id, entry.state);
    if (!replaced) return res.status(500).json({ error: 'Failed to restore history' });
    await createDiagramHistory(id, entry.state, user.id === 'admin' ? null : user.id, 'restore');
    res.json(replaced);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to restore history entry' });
  }
});

export default router;
