import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import diagramsRouter from './routes/diagrams';
import authRouter from './routes/auth';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { testConnection } from './db';

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
function combinedAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
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
      (req as any).user = { id: 'admin', username: ADMIN_USER, isAdmin: true };
      return next();
    }
    res.setHeader('WWW-Authenticate', 'Basic realm="Diagram API"');
    return res.status(401).send('Invalid credentials');
  }

  res.setHeader('WWW-Authenticate', 'Bearer realm="Diagram API", Basic realm="Diagram API"');
  return res.status(401).send('Unsupported authentication scheme');
}

app.get('/health', (_req, res) => res.json({ ok: true }));

// Public auth endpoints for register/login
app.use('/auth', authRouter);

// Protect diagram endpoints with combined auth middleware
app.use('/diagrams', combinedAuth, diagramsRouter);

const PORT = Number(process.env.PORT || 4000);

// Test DB connectivity on startup so connection refused / db down is clear in logs
(async () => {
  try {
    await testConnection();
    console.log('Connected to DB');
  } catch (e) {
    console.error('Database connectivity test failed at startup (diagrams may fail):', e);
  }

  app.listen(PORT, () => {
    console.log(`Diagram server listening on port ${PORT}`);
  });
})();
