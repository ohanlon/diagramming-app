import express from 'express';
import type { Request, Response } from 'express';
import { createDiagram, getDiagram, replaceDiagram, patchDiagram, listDiagramsByUser, deleteDiagram, listDiagramsSharedWithUserId, shareDiagramWithUserIds, isDiagramSharedWithUser, listUsersSharedForDiagram, unshareDiagramWithUser } from '../diagramsStore';
import { createDiagramHistory, listDiagramHistory, getDiagramHistoryEntry } from '../historyStore';
import { getUsersByUsernames } from '../usersStore';
import validator from 'validator';

const router = express.Router();

function getRequestUser(req: Request) {
  return (req as any).user as { id: string; username?: string; isAdmin?: boolean } | undefined;
}

router.post('/', async (req: Request, res: Response) => {
  const { state } = req.body;
  if (!state) return res.status(400).json({ error: 'Missing state' });
  if (!state.diagramName || String(state.diagramName).trim().length === 0) return res.status(400).json({ error: 'Missing diagramName' });
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  try {
    // Debug: log incoming state summary
    try {
      const sheetCount = state.sheets ? Object.keys(state.sheets).length : 0;
      let totalShapes = 0;
      if (state.sheets) {
        for (const s of Object.values(state.sheets)) {
          totalShapes += Object.keys((s as any).shapesById || {}).length;
        }
      }
      console.debug(`[diagrams.post] Creating diagram for user ${user.id}: sheets=${sheetCount}, totalShapes=${totalShapes}`);
    } catch (e) { /* ignore logging issues */ }
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
    try {
      const state = found.state || {};
      const sheetCount = state.sheets ? Object.keys(state.sheets).length : 0;
      let totalShapes = 0;
      if (state.sheets) {
        for (const s of Object.values(state.sheets)) {
          totalShapes += Object.keys((s as any).shapesById || {}).length;
        }
      }
      console.debug(`[diagrams.get] Returning diagram ${id} for user ${user.id}: sheets=${sheetCount}, totalShapes=${totalShapes}`);
    } catch (e) {}
    // Allow owner, admin, or users the diagram has been shared with
    if (found.owner_user_id && found.owner_user_id !== user.id && !user.isAdmin) {
      const shared = await isDiagramSharedWithUser(id, user.id);
      if (!shared) return res.status(403).json({ error: 'Forbidden' });
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
  if (!state.diagramName || String(state.diagramName).trim().length === 0) return res.status(400).json({ error: 'Missing diagramName' });
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  try {
    try {
      const sheetCount = state.sheets ? Object.keys(state.sheets).length : 0;
      let totalShapes = 0;
      if (state.sheets) {
        for (const s of Object.values(state.sheets)) {
          totalShapes += Object.keys((s as any).shapesById || {}).length;
        }
      }
      console.debug(`[diagrams.put] Replacing diagram ${id} by user ${user.id}: sheets=${sheetCount}, totalShapes=${totalShapes}`);
    } catch (e) {}
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
  if (!patch.state.diagramName || String(patch.state.diagramName).trim().length === 0) return res.status(400).json({ error: 'Missing diagramName' });
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  try {
    try {
      const sheetCount = patch.state.sheets ? Object.keys(patch.state.sheets).length : 0;
      let totalShapes = 0;
      if (patch.state.sheets) {
        for (const s of Object.values(patch.state.sheets)) {
          totalShapes += Object.keys((s as any).shapesById || {}).length;
        }
      }
      console.debug(`[diagrams.patch] Patching diagram ${id} by user ${user.id}: sheetsInPatch=${sheetCount}, totalShapesInPatch=${totalShapes}`);
    } catch (e) {}
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

// List diagrams for the current authenticated user
router.get('/', async (req: Request, res: Response) => {
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const list = await listDiagramsByUser(user.id === 'admin' ? null : user.id);
    res.json({ diagrams: list });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list diagrams' });
  }
});

// NOTE: specific routes like '/shared' must be registered before the generic '/:id' route
// List diagrams shared with current user (by user id via shared_documents)
router.get('/shared', async (req: Request, res: Response) => {
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const list = await listDiagramsSharedWithUserId(user.id);
    res.json({ diagrams: list });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list shared diagrams' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const found = await getDiagram(id);
    if (!found) return res.status(404).json({ error: 'Not found' });
    try {
      const state = found.state || {};
      const sheetCount = state.sheets ? Object.keys(state.sheets).length : 0;
      let totalShapes = 0;
      if (state.sheets) {
        for (const s of Object.values(state.sheets)) {
          totalShapes += Object.keys((s as any).shapesById || {}).length;
        }
      }
      console.debug(`[diagrams.get] Returning diagram ${id} for user ${user.id}: sheets=${sheetCount}, totalShapes=${totalShapes}`);
    } catch (e) {}
    // Allow owner, admin, or users the diagram has been shared with
    if (found.owner_user_id && found.owner_user_id !== user.id && !user.isAdmin) {
      const shared = await isDiagramSharedWithUser(id, user.id);
      if (!shared) return res.status(403).json({ error: 'Forbidden' });
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
  if (!state.diagramName || String(state.diagramName).trim().length === 0) return res.status(400).json({ error: 'Missing diagramName' });
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  try {
    try {
      const sheetCount = state.sheets ? Object.keys(state.sheets).length : 0;
      let totalShapes = 0;
      if (state.sheets) {
        for (const s of Object.values(state.sheets)) {
          totalShapes += Object.keys((s as any).shapesById || {}).length;
        }
      }
      console.debug(`[diagrams.put] Replacing diagram ${id} by user ${user.id}: sheets=${sheetCount}, totalShapes=${totalShapes}`);
    } catch (e) {}
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
  if (!patch.state.diagramName || String(patch.state.diagramName).trim().length === 0) return res.status(400).json({ error: 'Missing diagramName' });
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  try {
    try {
      const sheetCount = patch.state.sheets ? Object.keys(patch.state.sheets).length : 0;
      let totalShapes = 0;
      if (patch.state.sheets) {
        for (const s of Object.values(patch.state.sheets)) {
          totalShapes += Object.keys((s as any).shapesById || {}).length;
        }
      }
      console.debug(`[diagrams.patch] Patching diagram ${id} by user ${user.id}: sheetsInPatch=${sheetCount}, totalShapesInPatch=${totalShapes}`);
    } catch (e) {}
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

// Delete a diagram (only owner or admin)
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const existing = await getDiagram(id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.owner_user_id && existing.owner_user_id !== user.id && !user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await deleteDiagram(id);
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete diagram' });
  }
});

// Share a diagram with one or more emails (only owner or admin)
router.post('/:id/share', async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  const { emails } = req.body || {};
  if (!emails) return res.status(400).json({ error: 'Missing emails' });
  try {
    const existing = await getDiagram(id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.owner_user_id && existing.owner_user_id !== user.id && !user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Normalize input (allow comma-separated string or array)
    let list: string[] = [];
    if (typeof emails === 'string') {
      list = emails.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(emails)) {
      list = emails.map((s: any) => String(s).trim()).filter(Boolean);
    } else {
      return res.status(400).json({ error: 'Invalid emails format' });
    }

    // Validate emails
    const valid: string[] = [];
    for (const e of list) {
      if (validator.isEmail(e)) valid.push(e.toLowerCase());
    }
    const unique = Array.from(new Set(valid));
    if (unique.length === 0) return res.status(400).json({ error: 'No valid email addresses provided' });

    // Resolve emails to user ids
    const users = await getUsersByUsernames(unique);
    const foundUsernames = users.map((u: any) => String(u.username).toLowerCase());
    const missing = unique.filter(u => !foundUsernames.includes(u));
    if (missing.length > 0) {
      return res.status(400).json({ error: 'Some emails are not registered users', missing });
    }
    const userIds = users.map((u: any) => u.id);

    // Insert into shared_documents
    await shareDiagramWithUserIds(id, userIds, user.id === 'admin' ? null : user.id);

    res.json({ success: true, sharedWith: userIds });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to share diagram' });
  }
});

// Invite a user (registered or not) to a diagram. For registered users, we will share immediately; for unregistered we create pending_invites and send an email if configured.
router.post('/:id/invite', async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  const { emails } = req.body || {};
  if (!emails) return res.status(400).json({ error: 'Missing emails' });
  try {
    const existing = await getDiagram(id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.owner_user_id && existing.owner_user_id !== user.id && !user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let list: string[] = [];
    if (typeof emails === 'string') {
      list = emails.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(emails)) {
      list = emails.map((s: any) => String(s).trim()).filter(Boolean);
    } else {
      return res.status(400).json({ error: 'Invalid emails format' });
    }

    const valid: string[] = [];
    for (const e of list) {
      if (validator.isEmail(e)) valid.push(e.toLowerCase());
    }
    const unique = Array.from(new Set(valid));
    if (unique.length === 0) return res.status(400).json({ error: 'No valid email addresses provided' });

    // Resolve to registered users
    const users = await getUsersByUsernames(unique);
    const foundUsernames = users.map((u: any) => String(u.username).toLowerCase());
    const missing = unique.filter(u => !foundUsernames.includes(u));
    const userIds = users.map((u: any) => u.id);

    // Share with any registered user ids immediately
    if (userIds.length > 0) await shareDiagramWithUserIds(id, userIds, user.id === 'admin' ? null : user.id);

    // Create pending invites for missing emails and send emails
    const createdInvites: any[] = [];
    for (const m of missing) {
      const invite = await (await import('../invitesStore')).createInvite(id, m, user.id === 'admin' ? null : user.id, null);
      createdInvites.push(invite);
      // Construct invite link briefly using FRONTEND_ORIGIN env var or fallback
      const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
      const inviteLink = `${FRONTEND_ORIGIN}/accept-invite?token=${invite.token}`;
      try {
        const { sendInviteEmail } = await import('../utils/mailer');
        await sendInviteEmail(m, inviteLink, user.username || undefined);
      } catch (e) {
        console.warn('Mailer not configured or failed for invite', e);
      }
    }

    res.json({ success: true, sharedUserIds: userIds, invites: createdInvites, missingEmails: missing });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create invites' });
  }
});

// Publicly view an invite token (no auth) — returns basic invite info
router.get('/invites/:token', async (req: Request, res: Response) => {
  const { token } = req.params as { token: string };
  try {
    const { getInviteByToken } = await import('../invitesStore');
    const invite = await getInviteByToken(token);
    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    res.json({ invite });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch invite' });
  }
});

// Accept an invite (must be authenticated) — associates the authenticated user with the diagram and marks invite accepted
router.post('/invites/:token/accept', async (req: Request, res: Response) => {
  const { token } = req.params as { token: string };
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const { getInviteByToken, acceptInvite } = await import('../invitesStore');
    const invite = await getInviteByToken(token);
    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    // Require that the authenticated user's username/email match the invited_email or admin
    if (!user.isAdmin && String(user.username).toLowerCase() !== String(invite.invited_email).toLowerCase()) {
      return res.status(403).json({ error: 'Invite not for this user' });
    }
    // Create share row and mark invite accepted
    await shareDiagramWithUserIds(invite.diagram_id, [user.id], invite.invited_by);
    await acceptInvite(token, user.id);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to accept invite' });
  }
});

// List users a diagram is shared with
router.get('/:id/shares', async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const existing = await getDiagram(id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    // Only owner or admin can list shares
    if (existing.owner_user_id && existing.owner_user_id !== user.id && !user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const shares = await listUsersSharedForDiagram(id);
    res.json({ shares });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list shares' });
  }
});

// Unshare (revoke) a user's access to a diagram
router.delete('/:id/share/:userId', async (req: Request, res: Response) => {
  const { id, userId } = req.params as { id: string; userId: string };
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const existing = await getDiagram(id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    // Only owner or admin can revoke shares
    if (existing.owner_user_id && existing.owner_user_id !== user.id && !user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await unshareDiagramWithUser(id, userId);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to revoke share' });
  }
});

export default router;
