const WebSocketLib = require('ws');
const WebSocketServer = WebSocketLib.Server;
const INSTANCE_ID = process.env.INSTANCE_ID || `${process.pid}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

// Redis pub/sub (optional). If REDIS_URL is provided we will publish updates so
// other instances can broadcast to their own connected websocket clients.
let useRedis = false;
let redisPub: any = null;
let redisSub: any = null;
const REDIS_CHANNEL = 'diagram_updates';
try {
  const REDIS_URL = process.env.REDIS_URL;
  if (REDIS_URL) {
    // require here so the package remains optional at runtime if the env var is not set
    const IORedis = require('ioredis');
    redisPub = new IORedis(REDIS_URL);
    redisSub = new IORedis(REDIS_URL);
    useRedis = true;
  }
} catch (e) {
  console.warn('Redis not configured or ioredis not available; continuing without clustered pub/sub for WS updates');
  useRedis = false;
}
import url from 'url';
import jwt from 'jsonwebtoken';
import { pool } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';

type Subscriber = {
  ws: any;
  diagramId: string;
  userId?: string;
};

const subscribers = new Set<Subscriber>();

export function initDiagramsWebsocketServer(server: any) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', async (ws: any, req: any) => {
    try {
      const parsed = url.parse(req.url || '', true);
      const diagramId = parsed.query?.diagramId as string | undefined;
      // Try to parse authToken cookie to identify user
      let userId: string | undefined = undefined;
      try {
        const cookie = (req.headers && req.headers.cookie) || '';
  const tokenMatch = cookie.split(';').map((s: string) => s.trim()).find((s: string) => s.startsWith('authToken='));
        if (tokenMatch) {
          const token = tokenMatch.substring('authToken='.length);
          const payload = (jwt as any).verify(token, JWT_SECRET) as any;
          userId = payload?.id;
        }
      } catch (e) {
        // ignore
      }

      if (!diagramId) {
        ws.close(1008, 'Missing diagramId');
        return;
      }

      try {
        const { getDiagram, isDiagramSharedWithUser } = require('../diagramsStore');
        const found = await getDiagram(diagramId);
        if (!found) {
          ws.close(1008, 'Diagram not found');
          return;
        }
        const owner = found.owner_user_id;
        let allowed = false;
        if (!owner) allowed = true;
        if (owner && userId && owner === userId) allowed = true;
        if (!allowed && userId) {
          const shared = await isDiagramSharedWithUser(diagramId, userId);
          if (shared) allowed = true;
        }
        if (!allowed && userId) {
          try {
            const { getUserById } = require('../usersStore');
            const ur = await getUserById(userId);
            if (ur && ur.is_admin) allowed = true;
          } catch (e) {}
        }
        if (!allowed) {
          ws.close(1008, 'Not authorized to view this diagram');
          return;
        }
      } catch (e) {
        ws.close(1011, 'Authorization error');
        return;
      }

      const sub: Subscriber = { ws, diagramId, userId };
      subscribers.add(sub);

      // Subscribe to per-diagram Redis channel if using Redis
      const diagramChannel = `diagram_updates:${diagramId}`;
      if (useRedis && redisSub) {
        try {
          (redisSub as any).__subscribedChannels = (redisSub as any).__subscribedChannels || {};
          const map = (redisSub as any).__subscribedChannels as Record<string, number>;
          map[diagramChannel] = (map[diagramChannel] || 0) + 1;
          if (map[diagramChannel] === 1) {
            redisSub.subscribe(diagramChannel).catch(() => {});
          }
        } catch (e) {}
      }

      ws.on('close', () => {
        subscribers.delete(sub);
        if (useRedis && redisSub) {
          try {
            const map = (redisSub as any).__subscribedChannels as Record<string, number> || {};
            map[diagramChannel] = (map[diagramChannel] || 1) - 1;
            if (map[diagramChannel] <= 0) {
              try { redisSub.unsubscribe(diagramChannel); } catch (e) {}
              delete map[diagramChannel];
            }
          } catch (e) {}
        }
      });
    } catch (e) {
      try { ws.close(1011, 'Server error'); } catch (e) {}
    }
  });

  // Handle messages published via Redis from other instances
  if (useRedis && redisSub) {
    redisSub.on('message', (channel: string, message: string) => {
      try {
        // Expect channel like 'diagram_updates:{diagramId}'
        if (!channel || !channel.startsWith('diagram_updates:')) return;
        const diagramId = channel.slice('diagram_updates:'.length);
        const parsed = JSON.parse(message);
        if (!parsed || parsed.origin === INSTANCE_ID) return; // ignore our own published messages
        const { payload } = parsed;
        for (const s of Array.from(subscribers)) {
          if (s.diagramId === diagramId) {
            try { s.ws.send(JSON.stringify({ type: 'update', diagramId, payload })); } catch (e) { }
          }
        }
      } catch (e) {
        console.warn('Failed to handle redis pubsub message', e);
      }
    });
  }
}

export function broadcastDiagramUpdate(diagramId: string, payload: any) {
  // Publish via Redis if configured so other instances can forward to their local clients
  if (useRedis && redisPub) {
    try {
      const channel = `diagram_updates:${diagramId}`;
      const msg = JSON.stringify({ origin: INSTANCE_ID, diagramId, payload });
      redisPub.publish(channel, msg).catch(() => {});
    } catch (e) {
      console.warn('Failed to publish diagram update to redis', e);
    }
  }
  // Also broadcast to local subscribers
  for (const s of Array.from(subscribers)) {
    if (s.diagramId === diagramId) {
      try {
        s.ws.send(JSON.stringify({ type: 'update', diagramId, payload }));
      } catch (e) {
        try { s.ws.close(); } catch (e) {}
        subscribers.delete(s);
      }
    }
  }
}
