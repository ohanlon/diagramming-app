import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import diagramsRouter from './routes/diagrams';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));

// Basic auth middleware
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';

function basicAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Diagram API"');
    return res.status(401).send('Authentication required');
  }
  const base64 = auth.slice('Basic '.length);
  const decoded = Buffer.from(base64, 'base64').toString('utf8');
  const [user, pass] = decoded.split(':');
  if (user === ADMIN_USER && pass === ADMIN_PASSWORD) {
    return next();
  }
  res.setHeader('WWW-Authenticate', 'Basic realm="Diagram API"');
  return res.status(401).send('Invalid credentials');
}

app.get('/health', (_req, res) => res.json({ ok: true }));

// Protect diagram endpoints with basic auth
app.use('/diagrams', basicAuth, diagramsRouter);

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log(`Diagram server listening on port ${PORT}`);
});
