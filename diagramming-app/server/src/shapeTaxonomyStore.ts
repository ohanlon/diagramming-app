import { v4 as uuidv4 } from 'uuid';
import { pool } from './db';

export interface ShapeCategoryRow {
  id: string;
  name: string;
}

export interface ShapeSubcategoryRow {
  id: string;
  name: string;
  category_id: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class DuplicateShapeCategoryError extends Error {
  constructor(public readonly categoryName: string) {
    super(`Category with name "${categoryName}" already exists`);
    this.name = 'DuplicateShapeCategoryError';
  }
}

export class DuplicateShapeSubcategoryError extends Error {
  constructor(public readonly categoryId: string, public readonly subcategoryName: string) {
    super(`Sub-category "${subcategoryName}" already exists for this category`);
    this.name = 'DuplicateShapeSubcategoryError';
  }
}

export class ShapeCategoryNotFoundError extends Error {
  constructor(public readonly categoryId: string) {
    super(`Category ${categoryId} was not found`);
    this.name = 'ShapeCategoryNotFoundError';
  }
}

export async function listShapeCategories(): Promise<ShapeCategoryRow[]> {
  const { rows } = await pool.query('SELECT id, name FROM shape_category ORDER BY name ASC');
  return rows as ShapeCategoryRow[];
}

export async function getShapeCategoryById(categoryId: string): Promise<ShapeCategoryRow | null> {
  if (!UUID_REGEX.test(categoryId)) return null;
  const { rows } = await pool.query('SELECT id, name FROM shape_category WHERE id = $1', [categoryId]);
  return (rows as ShapeCategoryRow[])[0] ?? null;
}

export async function createShapeCategory(name: string): Promise<ShapeCategoryRow> {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    throw new Error('Category name is required');
  }
  const id = uuidv4();
  try {
    const { rows } = await pool.query('INSERT INTO shape_category (id, name) VALUES ($1, $2) RETURNING id, name', [id, trimmed]);
    const inserted = (rows as ShapeCategoryRow[])[0];
    if (!inserted) throw new Error('Failed to insert category');
    return inserted;
  } catch (err: any) {
    if (err && err.code === '23505') {
      throw new DuplicateShapeCategoryError(trimmed);
    }
    throw err;
  }
}

export async function listShapeSubcategories(categoryId: string): Promise<ShapeSubcategoryRow[]> {
  if (!UUID_REGEX.test(categoryId)) {
    throw new ShapeCategoryNotFoundError(categoryId);
  }
  const { rows } = await pool.query('SELECT id, name, category_id FROM shape_subcategory WHERE category_id = $1 ORDER BY name ASC', [categoryId]);
  return rows as ShapeSubcategoryRow[];
}

export async function createShapeSubcategory(categoryId: string, name: string): Promise<ShapeSubcategoryRow> {
  if (!UUID_REGEX.test(categoryId)) {
    throw new ShapeCategoryNotFoundError(categoryId);
  }
  const category = await getShapeCategoryById(categoryId);
  if (!category) {
    throw new ShapeCategoryNotFoundError(categoryId);
  }
  const trimmed = (name || '').trim();
  if (!trimmed) {
    throw new Error('Sub-category name is required');
  }
  const existing = await pool.query('SELECT id FROM shape_subcategory WHERE category_id = $1 AND lower(name) = lower($2) LIMIT 1', [categoryId, trimmed]);
  if (existing.rows.length > 0) {
    throw new DuplicateShapeSubcategoryError(categoryId, trimmed);
  }
  const id = uuidv4();
  try {
    const { rows } = await pool.query('INSERT INTO shape_subcategory (id, name, category_id) VALUES ($1, $2, $3) RETURNING id, name, category_id', [id, trimmed, categoryId]);
    const inserted = (rows as ShapeSubcategoryRow[])[0];
    if (!inserted) throw new Error('Failed to insert sub-category');
    return inserted;
  } catch (err: any) {
    if (err && err.code === '23505') {
      const constraint = err.constraint || '';
      const isNameConflict = constraint === 'shape_subcategory_category_name_idx' || constraint === 'shape_subcategory_name';
      if (isNameConflict) {
        throw new DuplicateShapeSubcategoryError(categoryId, trimmed);
      }
    }
    throw err;
  }
}
