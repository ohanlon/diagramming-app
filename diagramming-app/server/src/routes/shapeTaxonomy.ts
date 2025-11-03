import express from 'express';
import {
  createShapeCategory,
  createShapeSubcategory,
  DuplicateShapeCategoryError,
  DuplicateShapeSubcategoryError,
  listShapeCategories,
  listShapeSubcategories,
  ShapeCategoryNotFoundError,
} from '../shapeTaxonomyStore';

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

export default router;
