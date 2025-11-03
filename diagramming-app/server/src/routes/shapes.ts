import express from 'express';
import { listProductionShapeLibrary, searchProductionShapeLibrary } from '../shapeAssetStore';

const router = express.Router();

// Simple in-memory cache for search results
const searchCache = new Map<string, { results: any[]; expiresAt: number }>();
const SEARCH_CACHE_TTL_MS = 10_000; // 10s

// Simple per-IP token bucket throttler
const tokenBuckets = new Map<string, { tokens: number; lastRefill: number }>();
const BUCKET_CAPACITY = 5;
const REFILL_RATE_PER_MS = 5 / 1000; // 5 tokens per second -> per ms

function allowRequest(ip: string) {
  const now = Date.now();
  let bucket = tokenBuckets.get(ip);
  if (!bucket) {
    bucket = { tokens: BUCKET_CAPACITY, lastRefill: now };
    tokenBuckets.set(ip, bucket);
  }
  // Refill
  const elapsed = now - bucket.lastRefill;
  const refill = elapsed * REFILL_RATE_PER_MS;
  bucket.tokens = Math.min(BUCKET_CAPACITY, bucket.tokens + refill);
  bucket.lastRefill = now;
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true;
  }
  return false;
}

router.get('/library', async (_req, res) => {
  try {
    const rows = await listProductionShapeLibrary();
    const categoryMap = new Map<string, {
      id: string;
      name: string;
      subcategories: Map<string, {
        id: string;
        name: string;
        shapes: Array<{
          id: string;
          title: string;
          path: string;
          textPosition: string;
          autosize: boolean;
        }>;
      }>;
    }>();

    for (const row of rows) {
      let category = categoryMap.get(row.categoryId);
      if (!category) {
        category = {
          id: row.categoryId,
          name: row.categoryName,
          subcategories: new Map(),
        };
        categoryMap.set(row.categoryId, category);
      }
      let subcategory = category.subcategories.get(row.subcategoryId);
      if (!subcategory) {
        subcategory = {
          id: row.subcategoryId,
          name: row.subcategoryName,
          shapes: [],
        };
        category.subcategories.set(row.subcategoryId, subcategory);
      }
      subcategory.shapes.push({
        id: row.shapeId,
        title: row.title,
        path: row.path,
        textPosition: row.textPosition,
        autosize: row.autosize,
      });
    }

    const payload = {
      categories: Array.from(categoryMap.values()).map((category) => ({
        id: category.id,
        name: category.name,
        subcategories: Array.from(category.subcategories.values()),
      })),
    };

    return res.json(payload);
  } catch (e) {
    console.error('Failed to build shapes library from database', e);
    return res.status(500).json({ error: 'Failed to load shapes library' });
  }
});

// Search shapes across the production library. Query param: q
router.get('/search', async (req, res) => {
  const ip = (req.ip || req.headers['x-forwarded-for'] || 'unknown').toString();
  if (!allowRequest(ip)) {
    res.setHeader('Retry-After', '1');
    return res.status(429).json({ error: 'Too many requests' });
  }

  const q = (req.query.q || '').toString().trim();
  const cacheKey = `s:${q.toLowerCase()}`;
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json({ q, results: cached.results, cached: true });
  }

  try {
    const matches = await searchProductionShapeLibrary(q, 75);
    const results = matches.map((row) => ({
      provider: row.categoryName,
      category: row.subcategoryName,
      categoryId: row.subcategoryId,
      shapeId: row.shapeId,
      name: row.title,
      path: row.path,
      textPosition: row.textPosition,
      autosize: row.autosize,
    }));

    searchCache.set(cacheKey, { results, expiresAt: Date.now() + SEARCH_CACHE_TTL_MS });
    return res.json({ q, results });
  } catch (e) {
    console.error(`Search failed for q='${q}' ip='${ip}':`, e);
    if (process.env.NODE_ENV === 'development') {
      const errAny = e as any;
      return res.status(500).json({ error: 'Search failed', details: errAny && errAny.stack ? errAny.stack : String(e) });
    }
    return res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
