import express from 'express';
import multer, { MulterError } from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import {
  createShapeCategory,
  createShapeSubcategory,
  DuplicateShapeCategoryError,
  DuplicateShapeSubcategoryError,
  listShapeCategories,
  listShapeSubcategories,
  ShapeCategoryNotFoundError,
  getShapeSubcategoryById,
  ShapeSubcategoryNotFoundError,
} from '../shapeTaxonomyStore';
import {
  createShapeAsset,
  listShapeAssets,
  ShapeAssetDuplicateTitleError,
  updateShapeAsset,
} from '../shapeAssetStore';
import type { FileFilterCallback } from 'multer';
import type { Request as ExpressRequest } from 'express';

const SHAPES_ROOT = path.resolve(__dirname, '../../public/shapes');
const STAGING_DIR = path.join(SHAPES_ROOT, 'staging');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 50 },
  fileFilter: (_req: ExpressRequest, file: Express.Multer.File, cb: FileFilterCallback) => {
    const isSvg = file.mimetype === 'image/svg+xml' || file.originalname.toLowerCase().endsWith('.svg');
    if (!isSvg) {
      cb(new Error('Only SVG files can be uploaded'));
      return;
    }
    cb(null, true);
  },
});

const TEXT_POSITIONS = new Set(['Inside', 'Outside', 'None']);
type ShapeAssetDto = ReturnType<typeof mapShapeAsset>;
type RequestWithFiles = RequestWithUser & { files?: Express.Multer.File[] };

function deriveTitleFromFilename(filename: string): string {
  const base = filename?.trim() || '';
  if (!base) return 'Untitled shape';
  const lower = base.toLowerCase();
  if (lower.endsWith('.svg')) {
    const stripped = base.slice(0, -4);
    const normalized = stripped.replace(/[-_]+/g, ' ');
    const trimmed = normalized.replace(/\s+/g, ' ').trim();
    return trimmed || 'Untitled shape';
  }
  const normalized = base.replace(/[-_]+/g, ' ');
  const trimmed = normalized.replace(/\s+/g, ' ').trim();
  return trimmed || 'Untitled shape';
}

type RequestWithUser = express.Request & { user?: { id?: string; roles?: string[] } };

const router = express.Router();

async function ensureAdmin(req: RequestWithUser, res: express.Response, next: express.NextFunction): Promise<void> {
  const requester = req.user;
  if (!requester) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  let roles = Array.isArray(requester.roles) ? requester.roles : [];
  if (!roles.includes('admin') && requester.id) {
    try {
      const { getUserRoles } = require('../usersStore');
      roles = await getUserRoles(requester.id);
      if (req.user) req.user.roles = roles;
    } catch (e) {
      console.warn('Failed to load roles for requester', e);
    }
  }
  if (!roles.includes('admin')) {
    res.status(403).json({ error: 'Admin role required' });
    return;
  }
  return next();
}

router.use(ensureAdmin);

const mapCategory = (row: { id: string; name: string }) => ({ id: row.id, name: row.name });
const mapSubcategory = (row: { id: string; name: string; category_id: string }) => ({
  id: row.id,
  name: row.name,
  categoryId: row.category_id,
});

const mapShapeAsset = (row: {
  id: string;
  subcategory_id: string;
  title: string;
  path: string;
  original_filename: string;
  text_position: string;
  autosize: boolean;
  created_at: string;
  updated_at: string;
}) => ({
  id: row.id,
  subcategoryId: row.subcategory_id,
  title: (row.title && row.title.trim().length > 0 ? row.title : row.original_filename) || 'Untitled shape',
  path: row.path,
  originalFilename: row.original_filename,
  textPosition: row.text_position,
  autosize: row.autosize,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

router.get('/categories', async (_req, res) => {
  try {
    const categories = await listShapeCategories();
    return res.json({ categories: categories.map(mapCategory) });
  } catch (e) {
    console.error('Failed to list shape categories', e);
    return res.status(500).json({ error: 'Failed to list categories' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { name } = req.body || {};
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const category = await createShapeCategory(name.trim());
    return res.status(201).json({ category: mapCategory(category) });
  } catch (e) {
    if (e instanceof DuplicateShapeCategoryError) {
      return res.status(409).json({ error: e.message });
    }
    console.error('Failed to create category', e);
    return res.status(500).json({ error: 'Failed to create category' });
  }
});

router.get('/categories/:categoryId/subcategories', async (req, res) => {
  const { categoryId } = req.params;
  try {
    const subcategories = await listShapeSubcategories(categoryId);
    return res.json({ subcategories: subcategories.map(mapSubcategory) });
  } catch (e) {
    if (e instanceof ShapeCategoryNotFoundError) {
      return res.status(404).json({ error: 'Category not found' });
    }
    console.error('Failed to list subcategories', e);
    return res.status(500).json({ error: 'Failed to list subcategories' });
  }
});

router.post('/categories/:categoryId/subcategories', async (req, res) => {
  const { categoryId } = req.params;
  try {
    const { name } = req.body || {};
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Sub-category name is required' });
    }
    const subcategory = await createShapeSubcategory(categoryId, name.trim());
    return res.status(201).json({ subcategory: mapSubcategory(subcategory) });
  } catch (e) {
    if (e instanceof ShapeCategoryNotFoundError) {
      return res.status(404).json({ error: 'Category not found' });
    }
    if (e instanceof DuplicateShapeSubcategoryError) {
      return res.status(409).json({ error: e.message });
    }
    console.error('Failed to create subcategory', e);
    return res.status(500).json({ error: 'Failed to create subcategory' });
  }
});

router.get('/subcategories/:subcategoryId/shapes', async (req, res) => {
  const { subcategoryId } = req.params as { subcategoryId: string };
  try {
    const subcategory = await getShapeSubcategoryById(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ error: 'Sub-category not found' });
    }
    const shapes = await listShapeAssets(subcategoryId);
    return res.json({ shapes: shapes.map(mapShapeAsset) });
  } catch (e) {
    console.error('Failed to list shape assets', e);
    return res.status(500).json({ error: 'Failed to list shapes' });
  }
});

router.post('/subcategories/:subcategoryId/shapes/upload', upload.array('files', 50), async (req, res) => {
  const { subcategoryId } = req.params as { subcategoryId: string };
  try {
    const subcategory = await getShapeSubcategoryById(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ error: 'Sub-category not found' });
    }
    const files = ((req as RequestWithFiles).files as Express.Multer.File[] | undefined) || [];
    if (!files.length) {
      return res.status(400).json({ error: 'Select at least one SVG file to upload' });
    }
    await fs.mkdir(STAGING_DIR, { recursive: true });
    const created: ShapeAssetDto[] = [];
    const errors: Array<{ file: string; message: string; code: string }> = [];
    for (const file of files) {
      const id = uuidv4();
      const relativePath = path.join('staging', `${id}.svg`);
      const absolutePath = path.join(STAGING_DIR, `${id}.svg`);
      try {
        await fs.writeFile(absolutePath, file.buffer);
        const dbPath = `/shapes/${relativePath.replace(/\\/g, '/')}`;
        const title = deriveTitleFromFilename(file.originalname);
        const asset = await createShapeAsset({
          id,
          subcategoryId,
          title,
          originalFilename: file.originalname,
          path: dbPath,
          textPosition: 'None',
          autosize: true,
        });
        created.push(mapShapeAsset(asset));
      } catch (err: any) {
        try { await fs.unlink(absolutePath); } catch (_) { /* ignore cleanup errors */ }
        if (err instanceof ShapeAssetDuplicateTitleError) {
          errors.push({ file: file.originalname, message: err.message, code: 'duplicate_title' });
          continue;
        }
        if (err instanceof ShapeSubcategoryNotFoundError) {
          return res.status(404).json({ error: 'Sub-category not found' });
        }
        const message = err instanceof Error ? err.message : 'Failed to save shape';
        errors.push({ file: file.originalname, message, code: 'unknown_error' });
      }
    }
    if (created.length === 0 && errors.length) {
      return res.status(409).json({ error: 'No shapes were uploaded', errors });
    }
    const status = errors.length ? 207 : 201;
    return res.status(status).json({ created, errors });
  } catch (err: unknown) {
    if (err instanceof MulterError) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'SVG files must be smaller than 5MB' : err.message;
      return res.status(400).json({ error: message });
    }
    console.error('Failed to upload shape assets', err);
    return res.status(500).json({ error: 'Failed to upload shapes' });
  }
});

router.patch('/shapes/:shapeId', async (req, res) => {
  const { shapeId } = req.params;
  const { title, textPosition, autosize } = req.body || {};
  try {
    const payload: { title?: string; textPosition?: string; autosize?: boolean } = {};
    if (typeof title === 'string') {
      const trimmed = title.trim();
      if (!trimmed) {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }
      payload.title = trimmed;
    }
    if (typeof textPosition === 'string') {
      if (!TEXT_POSITIONS.has(textPosition)) {
        return res.status(400).json({ error: 'Invalid text position' });
      }
      payload.textPosition = textPosition as any;
    }
    if (typeof autosize === 'boolean') {
      payload.autosize = autosize;
    }
    const updated = await updateShapeAsset({
      id: shapeId,
      title: payload.title,
      textPosition: payload.textPosition as any,
      autosize: payload.autosize,
    });
    return res.json({ shape: mapShapeAsset(updated) });
  } catch (e) {
    if (e instanceof ShapeAssetDuplicateTitleError) {
      return res.status(409).json({ error: e.message });
    }
    if (e instanceof ShapeSubcategoryNotFoundError) {
      return res.status(404).json({ error: 'Sub-category not found' });
    }
    console.error('Failed to update shape asset', e);
    return res.status(500).json({ error: 'Failed to update shape' });
  }
});

export default router;
