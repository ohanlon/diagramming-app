import express from 'express';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// Base directory where shapes are stored on disk (server/public/shapes)
// Resolve two levels up from src/routes -> src -> server so path points to server/public/shapes
const SHAPES_DIR = path.resolve(__dirname, '../../public/shapes');
console.debug(`SHAPES_DIR resolved to ${SHAPES_DIR}`);

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

router.get('/catalog.json', async (_req, res) => {
  try {
    const file = path.join(SHAPES_DIR, 'catalog.json');
    const raw = await fs.readFile(file, 'utf8');
    res.type('application/json').send(raw);
  } catch (e) {
    console.error('Failed to read catalog.json', e);
    res.status(500).json({ error: 'Failed to read catalog' });
  }
});

// Search shapes across catalog/index and shape files. Query param: q
router.get('/search', async (req, res) => {
  const ip = (req.ip || req.headers['x-forwarded-for'] || 'unknown').toString();
  if (!allowRequest(ip)) {
    res.setHeader('Retry-After', '1');
    return res.status(429).json({ error: 'Too many requests' });
  }

  const q = (req.query.q || '').toString().toLowerCase().trim();
  const cacheKey = `s:${q}`;
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json({ q, results: cached.results, cached: true });
  }

  try {
    const catalogPath = path.join(SHAPES_DIR, 'catalog.json');
    let catalogRaw: string;
    try {
      catalogRaw = await fs.readFile(catalogPath, 'utf8');
    } catch (readErr) {
      console.error(`Failed to read catalog.json at ${catalogPath}`, readErr);
      return res.status(500).json({ error: 'Failed to read catalog' });
    }

    let catalog: Array<{ name: string; path: string }> = [];
    try {
      catalog = JSON.parse(catalogRaw) as Array<{ name: string; path: string }>;

    } catch (parseErr) {
      const snippet = catalogRaw.slice(0, 200).replace(/\n/g, ' ');
      console.error(`Failed to parse catalog.json (first 200 chars): ${snippet}`, parseErr);
      return res.status(500).json({ error: 'Invalid catalog.json format' });
    }

    const results: Array<any> = [];

    // Helper to strip any leading '/shapes/' or leading '/' so we always resolve relative to SHAPES_DIR
    const normalizeShapesPath = (p: string | undefined) => {
      if (!p) return '';
      // Remove leading '/shapes/' or leading '/'
      if (p.startsWith('/shapes/')) return p.replace(/^\/shapes\//, '');
      if (p.startsWith('shapes/')) return p.replace(/^shapes\//, '');
      if (p.startsWith('/')) return p.replace(/^\//, '');
      return p;
    };

    for (const providerEntry of catalog) {
      try {
        // providerEntry.path is expected to be a directory index file listing sub-entries
        const providerRelative = normalizeShapesPath(providerEntry.path);
        if (!providerRelative) {
          console.warn(`Provider entry has empty path, skipping: ${JSON.stringify(providerEntry)}`);
          continue;
        }
        const providerIndexPath = path.resolve(SHAPES_DIR, providerRelative);
        if (!providerIndexPath.startsWith(SHAPES_DIR)) {
          console.warn(`Skipping provider index outside shapes dir: ${providerIndexPath}`);
          continue;
        }
        try {
          const providerIndexRaw = await fs.readFile(providerIndexPath, 'utf8');
          const providerIndex = JSON.parse(providerIndexRaw) as Array<any>;
           for (const subEntry of providerIndex) {
            // subEntry.path points to a JSON file listing shapes
            const indexRelative = normalizeShapesPath(subEntry.path);
            if (!indexRelative) {
              console.warn(`Skipping subentry with empty path for provider ${providerEntry.name}: ${JSON.stringify(subEntry)}`);
              continue;
            }
            const indexFile = path.resolve(SHAPES_DIR, indexRelative);
            if (!indexFile.startsWith(SHAPES_DIR)) {
              console.warn(`Skipping index file outside shapes dir: ${indexFile} (original subEntry.path=${String(subEntry.path)})`);
              continue;
            }
            try {
              const indexRaw = await fs.readFile(indexFile, 'utf8');
              const shapesList = JSON.parse(indexRaw) as Array<any>;
              for (const shape of shapesList) {
                const name = (shape.name || shape.title || '').toString();
                if (!q || name.toLowerCase().includes(q) || (subEntry.name || '').toLowerCase().includes(q) || (providerEntry.name || '').toLowerCase().includes(q)) {
                  results.push({
                    provider: providerEntry.name,
                    category: subEntry.name,
                    categoryId: subEntry.id,
                    shapeId: shape.name || shape.title || null,
                    name,
                    path: subEntry.path,
                  });
                }
              }
            } catch (e) {
              console.warn(`Failed to read/parse index file ${indexFile} for provider ${providerEntry.name}:`, e);
              // ignore missing or invalid index files
              continue;
            }
           }
        } catch (e) {
          console.warn(`Failed to read provider index ${providerIndexPath} for provider ${providerEntry.name}:`, e);
          // ignore this provider and continue
          continue;
        }
      } catch (outerErr) {
        console.error(`Error processing provider entry ${JSON.stringify(providerEntry)} for query='${q}' from ip='${ip}':`, outerErr);
        continue;
      }
     }

    // Save to cache
    searchCache.set(cacheKey, { results, expiresAt: Date.now() + SEARCH_CACHE_TTL_MS });
    res.json({ q, results });
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
