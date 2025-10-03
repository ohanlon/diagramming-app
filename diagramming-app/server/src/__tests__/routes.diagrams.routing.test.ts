import express from 'express';
// require supertest dynamically so TypeScript doesn't require type declarations to be present
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request: any = require('supertest');

// Mock the DB pool before importing the router so modules use the mocked pool
jest.mock('../db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

import { pool } from '../db';
import diagramsRouter from '../routes/diagrams';

describe('diagrams routes routing and id handling', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    // fake auth: attach a user to the request
    app.use((req, _res, next) => { (req as any).user = { id: 'user-1', username: 'owner@example.com' }; next(); });
    app.use('/diagrams', diagramsRouter);
    (pool.query as jest.Mock).mockReset();
  });

  it('GET /diagrams/shared should call shared_documents query and not call getDiagram with id "shared"', async () => {
    // Mock pool.query to return rows for shared_documents query
    (pool.query as jest.Mock).mockImplementation(async (text: string, params?: any[]) => {
      if (String(text).includes('FROM shared_documents')) {
        return { rows: [{ id: 'd1', owner_user_id: 'user-1', diagram_name: 'Doc1', thumbnail_data_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }] };
      }
      return { rows: [] };
    });

    const res = await request(app).get('/diagrams/shared').expect(200);
    expect(res.body).toHaveProperty('diagrams');
    expect(Array.isArray(res.body.diagrams)).toBe(true);
    expect(res.body.diagrams.length).toBe(1);

    // Ensure no call queried the diagrams table with param 'shared' (i.e., misrouted to /:id)
    const calls = (pool.query as jest.Mock).mock.calls;
    const badCall = calls.find((c: any[]) => Array.isArray(c[1]) && c[1][0] === 'shared');
    expect(badCall).toBeUndefined();
  });

  it('GET /diagrams/:id with non-UUID should return 404 and not call diagrams SELECT by id', async () => {
    // Fail the test if a SELECT by id is attempted with a non-UUID param
    (pool.query as jest.Mock).mockImplementation(async (text: string, params?: any[]) => {
      if (String(text).trim().startsWith('SELECT * FROM diagrams WHERE id')) {
        // If the param is not a UUID, the route should not have attempted this; if it did, fail by throwing
        if (params && params[0] === 'not-a-uuid') throw new Error('DB select by id should not be called for non-UUID');
      }
      return { rows: [] };
    });

    await request(app).get('/diagrams/not-a-uuid').expect(404);

    // Ensure no pool.query call had 'not-a-uuid' as its first param
    const calls = (pool.query as jest.Mock).mock.calls;
    const badCall = calls.find((c: any[]) => Array.isArray(c[1]) && c[1][0] === 'not-a-uuid');
    expect(badCall).toBeUndefined();
  });
});
