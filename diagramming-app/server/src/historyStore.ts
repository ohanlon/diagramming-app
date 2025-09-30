import { v4 as uuidv4 } from 'uuid';
import { pool } from './db';

export async function createDiagramHistory(diagramId: string, state: any, userId: string | null = null, operation: string = 'update', metadata: any = null) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const query = `INSERT INTO diagram_history(id, diagram_id, state, operation, user_id, metadata, created_at) VALUES($1, $2, $3::jsonb, $4, $5, $6::jsonb, $7) RETURNING *`;
  const values = [id, diagramId, state, operation, userId, metadata, now];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function listDiagramHistory(diagramId: string, limit: number = 50, offset: number = 0) {
  const { rows } = await pool.query('SELECT id, diagram_id, operation, user_id, metadata, created_at FROM diagram_history WHERE diagram_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [diagramId, limit, offset]);
  return rows;
}

export async function getDiagramHistoryEntry(id: string) {
  const { rows } = await pool.query('SELECT * FROM diagram_history WHERE id=$1', [id]);
  return rows[0] || null;
}
