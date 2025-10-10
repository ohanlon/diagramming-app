import { v4 as uuidv4 } from 'uuid';
import { pool } from './db';

export async function createInvite(
  diagramId: string,
  invitedEmail: string,
  invitedBy: string | null = null,
  expiresAt: string | null = null,
  permission: string = 'view',
  canCopy: boolean = true
) {
  const id = uuidv4();
  const token = uuidv4();
  const now = new Date().toISOString();
  const query = `INSERT INTO pending_invites(id, token, invited_email, diagram_id, invited_by, permission, can_copy, created_at, expires_at, accepted) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`;
  const values = [id, token, String(invitedEmail).toLowerCase(), diagramId, invitedBy, permission, canCopy, now, expiresAt, false];
  const { rows } = await pool.query(query, values as any[]);
  return rows[0];
}

export async function getInviteByToken(token: string) {
  const { rows } = await pool.query('SELECT * FROM pending_invites WHERE token = $1', [token]);
  return rows[0] || null;
}

export async function acceptInvite(token: string, userId: string) {
  // Mark invite accepted and associate share via caller; this function just marks accepted
  const now = new Date().toISOString();
  const query = `UPDATE pending_invites SET accepted = true, expires_at = $2 WHERE token = $1 RETURNING *`;
  const values = [token, now];
  const { rows } = await pool.query(query, values as any[]);
  return rows[0] || null;
}

export async function listInvitesForDiagram(diagramId: string) {
  const { rows } = await pool.query('SELECT * FROM pending_invites WHERE diagram_id = $1 ORDER BY created_at DESC', [diagramId]);
  return rows;
}

export async function deleteInviteById(inviteId: string) {
  const { rows } = await pool.query('DELETE FROM pending_invites WHERE id = $1 RETURNING *', [inviteId]);
  return rows[0] || null;
}

export async function listInvitesForEmail(email: string) {
  const { rows } = await pool.query('SELECT * FROM pending_invites WHERE lower(invited_email) = lower($1) ORDER BY created_at DESC', [String(email).toLowerCase()]);
  return rows;
}
