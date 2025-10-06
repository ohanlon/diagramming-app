import express from 'express';
// Use dynamic require for supertest so TS doesn't complain about missing types
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request: any = require('supertest');

// Mock DB pool before importing modules
jest.mock('../db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

// Mock connect-node createHandler before importing the connect impl so the
// module picks up the mocked createHandler at require-time.
jest.mock('@bufbuild/connect-node', () => ({
  createHandler: (serviceDef: any, impl: any) => {
    // Return an express middleware that routes by path to the appropriate impl method
    return (req: any, res: any, next: any) => {
      try {
        if (req.path === '/diagrams.v1.Diagrams/ListDiagrams') {
          Promise.resolve(impl.listDiagrams({ raw: { req } })).then((r: any) => res.json(r.body)).catch((e: any) => res.status(500).json({ error: String(e) }));
          return;
        }
        if (req.path === '/diagrams.v1.Diagrams/ListSharedDiagrams') {
          Promise.resolve(impl.listSharedDiagrams({ raw: { req } })).then((r: any) => res.json(r.body)).catch((e: any) => res.status(500).json({ error: String(e) }));
          return;
        }
        next();
      } catch (e) {
        next(e);
      }
    };
  }
}));

import { pool } from '../db';
import { mountDiagramsConnectHandler } from '../grpc/diagrams_connect_impl';
import { mountDiagramsGrpcShims } from '../grpc/diagrams';

describe('Connect handler vs REST shim parity', () => {
  beforeEach(() => {
    (pool.query as jest.Mock).mockReset();
  });

  it('ListDiagrams: Connect handler returns same result as REST shim', async () => {
    // Mock DB responses for listDiagramsByUser
    (pool.query as jest.Mock).mockImplementation(async (text: string, params?: any[]) => {
      if (String(text).includes('WHERE owner_user_id')) {
        return { rows: [{ id: 'd1', owner_user_id: 'user-1', diagram_name: 'Doc1', thumbnail_data_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }] };
      }
      if (String(text).includes('FROM shared_documents')) {
        return { rows: [{ id: 's1', owner_user_id: 'other', diagram_name: 'SharedDoc', thumbnail_data_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }] };
      }
      return { rows: [] };
    });

    // App with Connect handler mounted
    const appConnect = express();
    appConnect.use(express.json());
    appConnect.use((req, _res, next) => { (req as any).user = { id: 'user-1', username: 'owner@example.com' }; next(); });
    const mounted = mountDiagramsConnectHandler(appConnect);
    expect(mounted).toBe(true);

    // App with REST shim mounted
    const appShim = express();
    appShim.use(express.json());
    appShim.use((req, _res, next) => { (req as any).user = { id: 'user-1', username: 'owner@example.com' }; next(); });
    mountDiagramsGrpcShims(appShim as any);

    const resConnect = await request(appConnect).post('/diagrams.v1.Diagrams/ListDiagrams').expect(200);
    const resShim = await request(appShim).post('/diagrams.v1.Diagrams/ListDiagrams').expect(200);

    expect(resConnect.body).toHaveProperty('diagrams');
    expect(resShim.body).toHaveProperty('diagrams');
    expect(JSON.stringify(resConnect.body.diagrams)).toEqual(JSON.stringify(resShim.body.diagrams));
  });

  it('ListSharedDiagrams: Connect handler returns same result as REST shim', async () => {
    (pool.query as jest.Mock).mockImplementation(async (text: string, params?: any[]) => {
      if (String(text).includes('FROM shared_documents')) {
        return { rows: [{ id: 's1', owner_user_id: 'other', diagram_name: 'SharedDoc', thumbnail_data_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }] };
      }
      return { rows: [] };
    });

    const appConnect = express();
    appConnect.use(express.json());
    appConnect.use((req, _res, next) => { (req as any).user = { id: 'user-1', username: 'owner@example.com' }; next(); });
    const mounted = mountDiagramsConnectHandler(appConnect);
    expect(mounted).toBe(true);

    const appShim = express();
    appShim.use(express.json());
    appShim.use((req, _res, next) => { (req as any).user = { id: 'user-1', username: 'owner@example.com' }; next(); });
    mountDiagramsGrpcShims(appShim as any);

    const resConnect = await request(appConnect).post('/diagrams.v1.Diagrams/ListSharedDiagrams').expect(200);
    const resShim = await request(appShim).post('/diagrams.v1.Diagrams/ListSharedDiagrams').expect(200);

    expect(resConnect.body).toHaveProperty('diagrams');
    expect(resShim.body).toHaveProperty('diagrams');
    expect(JSON.stringify(resConnect.body.diagrams)).toEqual(JSON.stringify(resShim.body.diagrams));
  });
});
