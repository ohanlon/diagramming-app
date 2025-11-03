import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import diagramsRouter from './routes/diagrams';
import authRouter from './routes/auth';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { testConnection } from './db';
import shapesRouter from './routes/shapes';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(bodyParser.json({ limit: '5mb' }));

// Admin Basic auth fallback
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';

// Combined auth middleware: accept either Bearer <token>, cookie, or Basic admin credentials
async function combinedAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const cookieToken = (req as any).cookies?.authToken;

  if (!authHeader && !cookieToken) {
    res.setHeader('WWW-Authenticate', 'Bearer realm="Diagram API", Basic realm="Diagram API"');
    return res.status(401).send('Authentication required');
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      (req as any).user = { id: payload.id, username: payload.username };
      try {
        const { getUserRoles } = require('./usersStore');
        const roles = await getUserRoles(payload.id);
        (req as any).user.roles = roles || [];
      } catch (e) {
        // ignore role fetch errors; leave roles undefined
      }
      return next();
    } catch (e) {
      console.warn('Invalid JWT', e);
      res.setHeader('WWW-Authenticate', 'Bearer realm="Diagram API"');
      return res.status(401).send('Invalid token');
    }
  }

    if (cookieToken) {
    try {
      const payload = jwt.verify(cookieToken, JWT_SECRET) as any;
      (req as any).user = { id: payload.id, username: payload.username };
      try {
        const { getUserRoles } = require('./usersStore');
        const roles = await getUserRoles(payload.id);
        (req as any).user.roles = roles || [];
      } catch (e) {}
      return next();
    } catch (e) {
      console.warn('Invalid JWT in cookie', e);
      res.setHeader('WWW-Authenticate', 'Bearer realm="Diagram API"');
      return res.status(401).send('Invalid token');
    }
  }

  if (authHeader && authHeader.startsWith('Basic ')) {
    const base64 = authHeader.slice('Basic '.length);
    const decoded = Buffer.from(base64, 'base64').toString('utf8');
    const [user, pass] = decoded.split(':');
    if (user === ADMIN_USER && pass === ADMIN_PASSWORD) {
      (req as any).user = { id: 'admin', username: ADMIN_USER, roles: ['admin'] };
      return next();
    }
    res.setHeader('WWW-Authenticate', 'Basic realm="Diagram API"');
    return res.status(401).send('Invalid credentials');
  }

  res.setHeader('WWW-Authenticate', 'Bearer realm="Diagram API", Basic realm="Diagram API"');
  return res.status(401).send('Unsupported authentication scheme');
}

app.get('/health', (_req, res) => res.json({ ok: true }));

// Serve shapes static files from server/public/shapes
// When running via ts-node-dev the static shapes live in server/public/shapes (one level up)
const SHAPES_STATIC_DIR = path.resolve(__dirname, '../public/shapes');
console.log(`Serving shapes static files from ${SHAPES_STATIC_DIR}`);
if (!fs.existsSync(SHAPES_STATIC_DIR)) {
  console.warn(`Warning: shapes static directory does not exist at ${SHAPES_STATIC_DIR}`);
}
app.use('/shapes', express.static(SHAPES_STATIC_DIR));
// Mount shapes API routes (catalog/search)
app.use('/shapes', shapesRouter);

// Public auth endpoints for register/login
app.use('/auth', authRouter);

// Admin image taxonomy routes (categories/subcategories) must mount ahead of the generic /admin router
app.use('/admin/images', combinedAuth, require('./routes/shapeTaxonomy').default);
// Admin routes for runtime configuration (requires combinedAuth and admin credentials)
app.use('/admin', combinedAuth, require('./routes/admin').default);

// Protect user endpoints (settings etc.) with combined auth
app.use('/users', combinedAuth, require('./routes/users').default);

// Protect diagram endpoints with combined auth middleware
app.use('/diagrams', combinedAuth, diagramsRouter);

// Onboarding routes (create organisations) - require combined auth; route-level checks enforce 'sales' or 'admin'
app.use('/onboarding', combinedAuth, require('./routes/onboarding').default);

// Prefer mounting a real Connect handler if available; otherwise fall back
// to the lightweight shim. This shows how to replace the shim cleanly.
// Connect/Protobuf support has been removed. Mount the REST-backed gRPC shims
// directly to provide the same HTTP endpoints that generated Connect handlers
// would have exposed. This keeps runtime behavior stable and avoids any
// dependency on Connect runtimes or generated server code.
try {
  const { mountDiagramsGrpcShims } = require('./grpc/diagrams');
  // Ensure combinedAuth is applied to these routes as well
  app.post('/diagrams.v1.Diagrams/*', combinedAuth, (req, res, next) => next());
  mountDiagramsGrpcShims(app as any);
  console.log('Mounted gRPC shims (legacy REST-backed endpoints)');
} catch (e) {
  console.warn('Failed to mount gRPC shims:', e);
}

const PORT = Number(process.env.PORT || 4000);
import http from 'http';
import { initDiagramsWebsocketServer } from './ws/diagramsWs';

// Test DB connectivity on startup so connection refused / db down is clear in logs
(async () => {
  try {
    await testConnection();
    console.log('Connected to DB');
  } catch (e) {
    console.error('Database connectivity test failed at startup (diagrams may fail):', e);
  }

  const server = http.createServer(app);
  // Initialize WebSocket server for diagrams real-time updates
  try {
    initDiagramsWebsocketServer(server);
    console.log('Initialized diagrams WebSocket server at /ws');
  } catch (e) {
    console.warn('Failed to initialize WebSocket server for diagrams', e);
  }

  server.listen(PORT, () => {
    console.log(`Diagram server listening on port ${PORT}`);
  });
})();
