import { stripSvgContentFromShapes } from './utils/removeSvgContent';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment');
}

const pool = new Pool({ connectionString: DATABASE_URL });

export async function createDiagram(state: any) {
  const id = uuidv4();
  const now = new Date().toISOString();

  const stateToSave = {
    ...state,
    sheets: Object.fromEntries(Object.entries(state.sheets || {}).map(([sheetId, sheet]: any) => {
      const cloned = { ...(sheet as any) };
      cloned.shapesById = stripSvgContentFromShapes(cloned.shapesById || {});
      return [sheetId, cloned];
    }))
  };

  const query = `INSERT INTO diagrams(id, state, created_at, updated_at) VALUES($1, $2::jsonb, $3, $4) RETURNING *`;
  const values = [id, stateToSave, now, now];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function getDiagram(id: string) {
  const { rows } = await pool.query('SELECT * FROM diagrams WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function replaceDiagram(id: string, state: any) {
  // Ensure diagram exists
  const existing = await getDiagram(id);
  if (!existing) return null;

  const stateToSave = {
    ...state,
    sheets: Object.fromEntries(Object.entries(state.sheets || {}).map(([sheetId, sheet]: any) => {
      const cloned = { ...(sheet as any) };
      cloned.shapesById = stripSvgContentFromShapes(cloned.shapesById || {});
      return [sheetId, cloned];
    }))
  };

  const now = new Date().toISOString();
  const query = `UPDATE diagrams SET state=$1::jsonb, updated_at=$2 WHERE id=$3 RETURNING *`;
  const values = [stateToSave, now, id];
  const { rows } = await pool.query(query, values);
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
        mergedSheet.shapesById = stripSvgContentFromShapes(sheetPatch.shapesById || {});
      }
      mergedState.sheets[sheetId] = mergedSheet;
    }
  }

  const now = new Date().toISOString();
  const query = `UPDATE diagrams SET state=$1::jsonb, updated_at=$2 WHERE id=$3 RETURNING *`;
  const values = [mergedState, now, id];
  const { rows } = await pool.query(query, values);
  return rows[0];
}
