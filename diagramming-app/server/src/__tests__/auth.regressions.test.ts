const express = require('express');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request: any = require('./miniSupertest');

jest.mock('../db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

import { pool } from '../db';
import authRouter from '../routes/auth';

describe('auth regression tests', () => {
  let app: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
    (pool.query as jest.Mock).mockReset();
  });

  it('should return 409 when registering a duplicate username', async () => {
    // Simulate existing user when getUserByUsername is called
    (pool.query as jest.Mock).mockImplementation(async (text: string, params?: any[]) => {
      if (String(text).includes('SELECT * FROM users WHERE username')) {
        return { rows: [{ id: 'existing', username: params ? params[0] : 'dup@example.com' }] };
      }
      return { rows: [] };
    });

    await request(app).post('/auth/register').send({ username: 'dup@example.com', password: 'pw', firstName: 'D', lastName: 'U' }).expect(409);
  });

  it('should return 400 when registering with invalid email', async () => {
    await request(app).post('/auth/register').send({ username: 'not-an-email', password: 'pw', firstName: 'N', lastName: 'E' }).expect(400);
  });

  it('should return 401 for /auth/me with invalid token', async () => {
    // Provide an invalid token
    await request(app).get('/auth/me').set('Authorization', 'Bearer invalid.token.here').expect(401);
  });
});
