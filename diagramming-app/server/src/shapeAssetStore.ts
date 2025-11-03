import { v4 as uuidv4 } from 'uuid';
import { pool } from './db';
import { ShapeSubcategoryNotFoundError } from './shapeTaxonomyStore';

export type TextPosition = 'Inside' | 'Outside' | 'None';

export interface ShapeAssetRow {
  id: string;
  subcategory_id: string;
  title: string;
  path: string;
  original_filename: string;
  text_position: TextPosition;
  autosize: boolean;
  is_production: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ShapeAssetDuplicateTitleError extends Error {
  constructor(public readonly subcategoryId: string, public readonly title: string) {
    super(`A shape titled "${title}" already exists for this sub-category.`);
    this.name = 'ShapeAssetDuplicateTitleError';
  }
}

export class ShapeAssetNotFoundError extends Error {
  constructor(public readonly assetId: string) {
    super(`Shape asset ${assetId} not found.`);
    this.name = 'ShapeAssetNotFoundError';
  }
}

export interface CreateShapeAssetParams {
  subcategoryId: string;
  title: string;
  path: string;
  originalFilename: string;
  textPosition?: TextPosition;
  autosize?: boolean;
  id?: string;
}

export async function listShapeAssets(subcategoryId: string): Promise<ShapeAssetRow[]> {
  if (!UUID_REGEX.test(subcategoryId)) return [];
  const { rows } = await pool.query(
    `SELECT id, subcategory_id, title, path, original_filename, text_position, autosize, is_production, is_deleted, created_at, updated_at
     FROM shape_asset
     WHERE subcategory_id = $1 AND is_deleted = FALSE
     ORDER BY created_at ASC`,
    [subcategoryId]
  );
  return rows as ShapeAssetRow[];
}

export async function createShapeAsset(params: CreateShapeAssetParams): Promise<ShapeAssetRow> {
  const id = params.id ?? uuidv4();
  const textPosition: TextPosition = params.textPosition ?? 'None';
  const autosize = params.autosize ?? true;
  const title = (params.title ?? '').trim();
  if (!title) {
    throw new Error('Title is required');
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO shape_asset (id, subcategory_id, title, path, original_filename, text_position, autosize)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, subcategory_id, title, path, original_filename, text_position, autosize, is_production, is_deleted, created_at, updated_at`,
      [
        id,
        params.subcategoryId,
        title,
        params.path,
        params.originalFilename,
        textPosition,
        autosize,
      ]
    );
    const inserted = (rows as ShapeAssetRow[])[0];
    if (!inserted) throw new Error('Failed to insert shape asset');
    return inserted;
  } catch (err: any) {
    if (err && err.code === '23505') {
      const constraint = err.constraint || '';
      if (constraint === 'shape_asset_subcategory_title_idx') {
        throw new ShapeAssetDuplicateTitleError(params.subcategoryId, params.title);
      }
      if (constraint === 'shape_asset_path_idx') {
        throw new Error('A shape asset already references this path.');
      }
    }
    if (err && err.code === '23503') {
      throw new ShapeSubcategoryNotFoundError(params.subcategoryId);
    }
    throw err;
  }
}

export interface UpdateShapeAssetParams {
  id: string;
  title?: string;
  textPosition?: TextPosition;
  autosize?: boolean;
}

export async function updateShapeAsset({ id, title, textPosition, autosize }: UpdateShapeAssetParams): Promise<ShapeAssetRow> {
  if (!UUID_REGEX.test(id)) {
    throw new ShapeAssetNotFoundError(id);
  }
  const existingResult = await pool.query(
    'SELECT id, subcategory_id, title, path, original_filename, text_position, autosize, is_production, is_deleted, created_at, updated_at FROM shape_asset WHERE id = $1',
    [id]
  );
  const existing = (existingResult.rows as ShapeAssetRow[])[0];
  if (!existing) throw new ShapeAssetNotFoundError(id);

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  if (typeof title === 'string') {
    fields.push(`title = $${idx++}`);
    values.push(title);
  }
  if (typeof textPosition === 'string') {
    fields.push(`text_position = $${idx++}`);
    values.push(textPosition);
  }
  if (typeof autosize === 'boolean') {
    fields.push(`autosize = $${idx++}`);
    values.push(autosize);
  }
  if (fields.length === 0) {
    return existing;
  }
  fields.push(`updated_at = NOW()`);
  const query = `UPDATE shape_asset SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, subcategory_id, title, path, original_filename, text_position, autosize, is_production, is_deleted, created_at, updated_at`;
  values.push(id);
  try {
    const { rows } = await pool.query(query, values);
    const row = (rows as ShapeAssetRow[])[0];
    if (!row) throw new ShapeAssetNotFoundError(id);
    return row;
  } catch (err: any) {
    if (err && err.code === '23505' && err.constraint === 'shape_asset_subcategory_title_idx') {
      throw new ShapeAssetDuplicateTitleError(existing.subcategory_id, title || existing.title);
    }
    throw err;
  }
}

export async function getShapeAssetsByIds(ids: string[]): Promise<ShapeAssetRow[]> {
  const uniqueIds = Array.from(new Set(ids.filter((id): id is string => typeof id === 'string' && UUID_REGEX.test(id))));
  if (uniqueIds.length === 0) {
    return [];
  }
  const { rows } = await pool.query(
    'SELECT id, subcategory_id, title, path, original_filename, text_position, autosize, is_production, is_deleted, created_at, updated_at FROM shape_asset WHERE id = ANY($1::uuid[])',
    [uniqueIds]
  );
  return rows as ShapeAssetRow[];
}

export async function markShapeAssetPromoted(id: string, newPath: string): Promise<ShapeAssetRow> {
  if (!UUID_REGEX.test(id)) {
    throw new ShapeAssetNotFoundError(id);
  }
  const { rows } = await pool.query(
    `UPDATE shape_asset
     SET path = $1,
         is_production = TRUE,
         updated_at = NOW()
     WHERE id = $2
     RETURNING id, subcategory_id, title, path, original_filename, text_position, autosize, is_production, is_deleted, created_at, updated_at`,
    [newPath, id]
  );
  const row = (rows as ShapeAssetRow[])[0];
  if (!row) {
    throw new ShapeAssetNotFoundError(id);
  }
  return row;
}

export async function softDeleteShapeAsset(id: string): Promise<ShapeAssetRow> {
  if (!UUID_REGEX.test(id)) {
    throw new ShapeAssetNotFoundError(id);
  }
  const { rows } = await pool.query(
    `UPDATE shape_asset
     SET is_deleted = TRUE,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, subcategory_id, title, path, original_filename, text_position, autosize, is_production, is_deleted, created_at, updated_at`,
    [id]
  );
  const row = (rows as ShapeAssetRow[])[0];
  if (!row) {
    throw new ShapeAssetNotFoundError(id);
  }
  return row;
}

export async function deleteShapeAssetPermanently(id: string): Promise<ShapeAssetRow> {
  if (!UUID_REGEX.test(id)) {
    throw new ShapeAssetNotFoundError(id);
  }
  const { rows } = await pool.query(
    `DELETE FROM shape_asset
     WHERE id = $1
     RETURNING id, subcategory_id, title, path, original_filename, text_position, autosize, is_production, is_deleted, created_at, updated_at`,
    [id]
  );
  const row = (rows as ShapeAssetRow[])[0];
  if (!row) {
    throw new ShapeAssetNotFoundError(id);
  }
  return row;
}
