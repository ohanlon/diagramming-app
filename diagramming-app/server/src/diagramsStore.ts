import { v4 as uuidv4 } from 'uuid';
import { pool } from './db';

export async function createDiagram(state: any, ownerUserId: string | null = null) {
  const id = uuidv4();
  const now = new Date().toISOString();

  // Persist the full incoming state (including svgContent). We clone the
  // shapesById map to avoid mutating the caller's object.
  const stateToSave = {
    ...state,
    sheets: Object.fromEntries(Object.entries(state.sheets || {}).map(([sheetId, sheet]: any) => {
      const cloned = { ...(sheet as any) };
      cloned.shapesById = { ...(cloned.shapesById || {}) };
      return [sheetId, cloned];
    }))
  };

  const query = `INSERT INTO diagrams(id, state, owner_user_id, created_at, updated_at, version) VALUES($1, $2::jsonb, $3, $4, $5, $6) RETURNING *`;
  const values = [id, stateToSave, ownerUserId, now, now, 1];
  const { rows } = await pool.query(query, values);
  // Return the original (unstripped) state to the caller so the client
  // retains any svgContent it had locally. We still store a stripped
  // version in the DB to avoid persisting large SVG blobs.
  if (rows && rows[0]) {
    rows[0].state = state;
  }
  return rows[0];
}

export async function getDiagram(id: string) {
  // Defensive: ensure id looks like a UUID before querying the database to avoid SQL errors
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) return null;
  const { rows } = await pool.query('SELECT * FROM diagrams WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function replaceDiagram(id: string, state: any) {
  // Ensure diagram exists
  const existing = await getDiagram(id);
  if (!existing) return null;

  // Persist the full replacement state including svgContent
  const stateToSave = {
    ...state,
    sheets: Object.fromEntries(Object.entries(state.sheets || {}).map(([sheetId, sheet]: any) => {
      const cloned = { ...(sheet as any) };
      cloned.shapesById = { ...(cloned.shapesById || {}) };
      return [sheetId, cloned];
    }))
  };

  const now = new Date().toISOString();
  const query = `UPDATE diagrams SET state=$1::jsonb, updated_at=$2, version = version + 1 WHERE id=$3 RETURNING *`;
  const values = [stateToSave, now, id];
  const { rows } = await pool.query(query, values);
  // Return the original (unstripped) incoming state so the client does not
  // lose svgContent after a replace/save operation.
  if (rows && rows[0]) {
    rows[0].state = state;
  }
  return rows[0];
}

export async function patchDiagram(id: string, patch: any) {
  const existingRow = await getDiagram(id);
  if (!existingRow) return null;
  const existing = existingRow.state;

  // Merge at top-level: shallow merge except for sheets merging
  const mergedState: any = { ...existing, ...(patch.state || {}) };

  if (patch.state && patch.state.sheets) {
    mergedState.sheets = { ...existing.sheets };
    for (const [sheetId, sheetPatchRaw] of Object.entries(patch.state.sheets)) {
      const sheetPatch = sheetPatchRaw as any;
      const existingSheet = existing.sheets?.[sheetId] || {};
      const mergedSheet = { ...(existingSheet as any), ...(sheetPatch as any) } as any;
      if (sheetPatch && sheetPatch.shapesById) {
        // Merge existing shapes with incoming shapes. We keep svgContent
        // from the incoming shapes (no stripping) and merge on top of server
        // existing shapes so updated fields replace older ones.
        const incomingShapes = sheetPatch.shapesById || {};
        const existingShapes = (existing.sheets && existing.sheets[sheetId] && existing.sheets[sheetId].shapesById) || {};
        mergedSheet.shapesById = { ...existingShapes, ...incomingShapes };
      }
      // Merge shapeIds arrays (union) to avoid losing reference to shapes when a patch omits some ids
      if (sheetPatch && Array.isArray(sheetPatch.shapeIds)) {
        const existingIds: string[] = (existing.sheets && existing.sheets[sheetId] && existing.sheets[sheetId].shapeIds) || [];
        const incomingIds: string[] = sheetPatch.shapeIds || [];
        const seen = new Set(existingIds);
        const mergedIds = [...existingIds];
        for (const id of incomingIds) {
          if (!seen.has(id)) {
            mergedIds.push(id);
            seen.add(id);
          }
        }
        mergedSheet.shapeIds = mergedIds;
      }
      mergedState.sheets[sheetId] = mergedSheet;
    }
  }

  const now = new Date().toISOString();
  const query = `UPDATE diagrams SET state=$1::jsonb, updated_at=$2, version = version + 1 WHERE id=$3 RETURNING *`;
  const values = [mergedState, now, id];
  const { rows } = await pool.query(query, values);
  // Return the server state as stored (which now includes svgContent)
  return rows[0];
}

export async function listDiagramsByUser(ownerUserId: string | null) {
  // Return minimal info for listing (id, diagramName, thumbnailDataUrl, timestamps)
  const query = `SELECT id, owner_user_id, state->>'diagramName' AS diagram_name, state->>'thumbnailDataUrl' AS thumbnail_data_url, created_at, updated_at FROM diagrams WHERE owner_user_id = $1 ORDER BY updated_at DESC`;
  const values = [ownerUserId];
  const { rows } = await pool.query(query, values);
  return rows.map((r: any) => ({ id: r.id, ownerUserId: r.owner_user_id, diagramName: r.diagram_name, thumbnailDataUrl: r.thumbnail_data_url, createdAt: r.created_at, updatedAt: r.updated_at }));
}

// New: list diagrams shared with a given user id using the shared_documents table
export async function listDiagramsSharedWithUserId(userId: string) {
  const query = `SELECT d.id, d.owner_user_id, d.state->>'diagramName' AS diagram_name, d.state->>'thumbnailDataUrl' AS thumbnail_data_url, d.created_at, d.updated_at, sd.permission AS permission, sd.can_copy AS can_copy FROM shared_documents sd JOIN diagrams d ON sd.diagram_id = d.id WHERE sd.user_id = $1 ORDER BY d.updated_at DESC`;
  const { rows } = await pool.query(query, [userId]);
  return rows.map((r: any) => ({ id: r.id, ownerUserId: r.owner_user_id, diagramName: r.diagram_name, thumbnailDataUrl: r.thumbnail_data_url, createdAt: r.created_at, updatedAt: r.updated_at, permission: r.permission || 'view', canCopy: !!r.can_copy }));
}

// New: share a diagram with one or more user ids (insert rows into shared_documents)
export async function shareDiagramWithUserIds(diagramId: string, userIds: string[], sharedByUserId: string | null = null, permission: string = 'view', canCopy: boolean = true) {
  const entries = userIds.map(id => ({ userId: id, permission, canCopy }));
  return upsertShares(diagramId, entries, sharedByUserId);
}

// Upsert an array of share entries with per-user permission and can_copy flags.
export async function upsertShares(diagramId: string, entries: Array<{ userId: string; permission?: string; canCopy?: boolean }>, sharedByUserId: string | null = null) {
  const now = new Date().toISOString();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const e of entries) {
      const permission = e.permission || 'view';
      const canCopy = typeof e.canCopy === 'boolean' ? e.canCopy : true;
      await client.query(`INSERT INTO shared_documents(diagram_id, user_id, shared_by, permission, can_copy, created_at) VALUES($1, $2, $3, $4, $5, $6) ON CONFLICT (diagram_id, user_id) DO UPDATE SET permission = EXCLUDED.permission, can_copy = EXCLUDED.can_copy, shared_by = EXCLUDED.shared_by`, [diagramId, e.userId, sharedByUserId, permission, canCopy, now]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// New: check whether a diagram is shared with a given user id
export async function isDiagramSharedWithUser(diagramId: string, userId: string) {
  const { rows } = await pool.query('SELECT 1 FROM shared_documents WHERE diagram_id = $1 AND user_id = $2 LIMIT 1', [diagramId, userId]);
  return rows.length > 0;
}

export async function isDiagramEditableByUser(diagramId: string, userId: string) {
  const { rows } = await pool.query("SELECT permission FROM shared_documents WHERE diagram_id = $1 AND user_id = $2 LIMIT 1", [diagramId, userId]);
  if (!rows || rows.length === 0) return false;
  const p = rows[0].permission || 'view';
  return p === 'edit';
}

export async function deleteDiagram(id: string) {
  const { rows } = await pool.query('DELETE FROM diagrams WHERE id = $1 RETURNING *', [id]);
  return rows[0] || null;
}

export async function unshareDiagramWithUser(diagramId: string, userId: string) {
  const { rows } = await pool.query('DELETE FROM shared_documents WHERE diagram_id = $1 AND user_id = $2 RETURNING *', [diagramId, userId]);
  return rows[0] || null;
}

// New: list users a diagram is shared with (returns user rows and shared metadata)
export async function listUsersSharedForDiagram(diagramId: string) {
  const query = `
    SELECT u.id AS user_id, u.username AS username, sd.shared_by AS shared_by, sd.created_at AS created_at, sd.permission AS permission, sd.can_copy AS can_copy
    FROM shared_documents sd
    JOIN users u ON sd.user_id = u.id
    WHERE sd.diagram_id = $1
    ORDER BY sd.created_at ASC
  `;
  const { rows } = await pool.query(query, [diagramId]);
  return rows.map((r: any) => ({ userId: r.user_id, username: r.username, sharedBy: r.shared_by, createdAt: r.created_at, permission: r.permission || 'view', canCopy: !!r.can_copy }));
}

// New: get the share metadata (permission and can_copy) for a given diagram/user pair
export async function getShareMetadata(diagramId: string, userId: string) {
  const { rows } = await pool.query('SELECT permission, can_copy FROM shared_documents WHERE diagram_id = $1 AND user_id = $2 LIMIT 1', [diagramId, userId]);
  if (!rows || rows.length === 0) return null;
  return { permission: rows[0].permission || 'view', canCopy: !!rows[0].can_copy };
}

// New: list entries describing which users shared diagrams with the given user id
export async function listSharedByForUserId(targetUserId: string) {
  const query = `
    SELECT d.id AS diagram_id, d.state->>'diagramName' AS diagram_name, sd.shared_by AS shared_by_id, u.username AS shared_by_username, sd.created_at AS shared_at
    FROM shared_documents sd
    JOIN diagrams d ON sd.diagram_id = d.id
    LEFT JOIN users u ON sd.shared_by = u.id
    WHERE sd.user_id = $1
    ORDER BY sd.created_at DESC
  `;
  const { rows } = await pool.query(query, [targetUserId]);
  return rows.map((r: any) => ({ diagramId: r.diagram_id, diagramName: r.diagram_name, sharedById: r.shared_by_id, sharedByUsername: r.shared_by_username, sharedAt: r.shared_at }));
}
