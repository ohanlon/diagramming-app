import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import diagramsRouter from './routes/diagrams';
import authRouter from './routes/auth';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { testConnection } from './db';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));

// Admin Basic auth fallback
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';

// Combined auth middleware: accept either Bearer <token> or Basic admin credentials
function combinedAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) {
    res.setHeader('WWW-Authenticate', 'Bearer realm="Diagram API", Basic realm="Diagram API"');
    return res.status(401).send('Authentication required');
  }

  if (auth.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      // Attach user object to request for later use
      (req as any).user = { id: payload.id, username: payload.username };
      return next();
    } catch (e) {
      console.warn('Invalid JWT', e);
      res.setHeader('WWW-Authenticate', 'Bearer realm="Diagram API"');
      return res.status(401).send('Invalid token');
    }
  }

  if (auth.startsWith('Basic ')) {
    const base64 = auth.slice('Basic '.length);
    const decoded = Buffer.from(base64, 'base64').toString('utf8');
    const [user, pass] = decoded.split(':');
    if (user === ADMIN_USER && pass === ADMIN_PASSWORD) {
      // Admin user - represent as a pseudo-user with id 'admin'
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
