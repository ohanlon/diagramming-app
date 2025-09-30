import express from 'express';
import type { Request, Response } from 'express';
import { createDiagram, getDiagram, replaceDiagram, patchDiagram } from '../diagramsStore';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const { state } = req.body;
  if (!state) return res.status(400).json({ error: 'Missing state' });
  try {
    const created = await createDiagram(state);
    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create diagram' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const found = await getDiagram(id);
    if (!found) return res.status(404).json({ error: 'Not found' });
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
  try {
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
  try {
    const updated = await patchDiagram(id, patch);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to patch diagram' });
  }
});

export default router;
