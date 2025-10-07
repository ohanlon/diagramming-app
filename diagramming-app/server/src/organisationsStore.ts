import { v4 as uuidv4 } from 'uuid';
import { pool } from './db';

export async function createOrganisation(name: string, primaryContactEmail: string, localAdminEmail: string, createdBy: string | null = null) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const query = `INSERT INTO organisations(id, name, primary_contact_email, localadmin_email, created_by, created_at) VALUES($1, $2, $3, $4, $5, $6) RETURNING *`;
  const values = [id, name, primaryContactEmail, localAdminEmail, createdBy, now];
  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

export async function getOrganisationById(id: string) {
  const { rows } = await pool.query('SELECT * FROM organisations WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function getOrganisationByNameCI(name: string) {
  const { rows } = await pool.query('SELECT * FROM organisations WHERE lower(name) = lower($1) LIMIT 1', [name]);
  return rows[0] || null;
}
