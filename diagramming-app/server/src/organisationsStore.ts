import { v4 as uuidv4 } from 'uuid';
import { pool } from './db';

export interface CreateOrganisationParams {
  name: string;
  primaryContactEmail: string;
  primaryContactName: string;
  billingAddress: string;
  localAdminEmail: string;
  createdBy?: string | null;
}

export async function createOrganisation(params: CreateOrganisationParams) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const query = `INSERT INTO organisations(id, name, primary_contact_email, primary_contact_name, billing_address, localadmin_email, created_by, created_at) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
  const values = [
    id,
    params.name,
    params.primaryContactEmail,
    params.primaryContactName,
    params.billingAddress,
    params.localAdminEmail,
    params.createdBy ?? null,
    now,
  ];
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

export async function listOrganisations() {
  const { rows } = await pool.query('SELECT * FROM organisations ORDER BY name ASC');
  return rows;
}

export async function addCompanyAdmin(companyId: string, userId: string, assignedBy: string | null = null) {
  const now = new Date().toISOString();
  const query = `INSERT INTO company_admins (company_id, user_id, assigned_by, assigned_at) VALUES ($1, $2, $3, $4) ON CONFLICT (company_id, user_id) DO NOTHING RETURNING *`;
  const { rows } = await pool.query(query, [companyId, userId, assignedBy, now]);
  return rows[0] || null;
}

export async function removeCompanyAdmin(companyId: string, userId: string) {
  const query = `DELETE FROM company_admins WHERE company_id = $1 AND user_id = $2 RETURNING *`;
  const { rows } = await pool.query(query, [companyId, userId]);
  return rows[0] || null;
}

export async function listCompanyAdmins(companyId: string) {
  const query = `
    SELECT u.id, u.username, u.first_name, u.last_name, ca.assigned_by, ca.assigned_at
    FROM company_admins ca
    JOIN users u ON ca.user_id = u.id
    WHERE ca.company_id = $1
    ORDER BY ca.assigned_at ASC
  `;
  const { rows } = await pool.query(query, [companyId]);
  return rows;
}

export async function getCompaniesByUserId(userId: string) {
  const query = `
    SELECT o.id, o.name, o.primary_contact_email, o.primary_contact_name, o.billing_address, o.created_at
    FROM company_admins ca
    JOIN organisations o ON ca.company_id = o.id
    WHERE ca.user_id = $1
    ORDER BY o.name ASC
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
}
