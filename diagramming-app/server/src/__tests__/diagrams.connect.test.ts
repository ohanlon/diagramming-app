import express from 'express';
// Use minimal local supertest replacement to avoid external dependency
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request: any = require('./miniSupertest');

// Mock DB pool before importing modules
jest.mock('../db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

import { pool } from '../db';
import { mountDiagramsGrpcShims } from '../grpc/diagrams';

describe('REST-based gRPC shim', () => {
  beforeEach(() => {
    (pool.query as jest.Mock).mockReset();
  });

  it('ListDiagrams: REST shim returns expected diagram list', async () => {
    (pool.query as jest.Mock).mockImplementation(async (text: string, params?: any[]) => {
      if (String(text).includes('WHERE owner_user_id')) {
        return { rows: [{ id: 'd1', owner_user_id: 'user-1', diagram_name: 'Doc1', thumbnail_data_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }] };
      }
      if (String(text).includes('FROM shared_documents')) {
        return { rows: [{ id: 's1', owner_user_id: 'other', diagram_name: 'SharedDoc', thumbnail_data_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }] };
      }
      return { rows: [] };
    });

    const appShim = express();
    appShim.use(express.json());
    appShim.use((req, _res, next) => { (req as any).user = { id: 'user-1', username: 'owner@example.com' }; next(); });
    mountDiagramsGrpcShims(appShim as any);

    const resShim = await request(appShim).post('/diagrams.v1.Diagrams/ListDiagrams').expect(200);
    expect(resShim.body).toHaveProperty('diagrams');
    expect(Array.isArray(resShim.body.diagrams)).toBe(true);
  });

  it('ListSharedDiagrams: REST shim returns expected shared diagram list', async () => {
    (pool.query as jest.Mock).mockImplementation(async (text: string, params?: any[]) => {
      if (String(text).includes('FROM shared_documents')) {
        return { rows: [{ id: 's1', owner_user_id: 'other', diagram_name: 'SharedDoc', thumbnail_data_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }] };
      }
      return { rows: [] };
    });

    const appShim = express();
    appShim.use(express.json());
    appShim.use((req, _res, next) => { (req as any).user = { id: 'user-1', username: 'owner@example.com' }; next(); });
    mountDiagramsGrpcShims(appShim as any);

    const resShim = await request(appShim).post('/diagrams.v1.Diagrams/ListSharedDiagrams').expect(200);
    expect(resShim.body).toHaveProperty('diagrams');
    expect(Array.isArray(resShim.body.diagrams)).toBe(true);
  });
});
