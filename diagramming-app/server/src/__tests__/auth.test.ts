import express from 'express';
// Use minimal local supertest replacement to avoid external dependency
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request: any = require('./miniSupertest');

jest.mock('../db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

import { pool } from '../db';
import authRouter from '../routes/auth';

describe('auth register and /me', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    // attach auth router
    app.use('/auth', authRouter);
    (pool.query as jest.Mock).mockReset();
  });

  it('POST /auth/register should 400 when firstName or lastName missing', async () => {
    await request(app).post('/auth/register').send({ username: 'a@b.com', password: 'pw' }).expect(400);
    await request(app).post('/auth/register').send({ username: 'a@b.com', password: 'pw', firstName: ' ' , lastName: 'Smith' }).expect(400);
    await request(app).post('/auth/register').send({ username: 'a@b.com', password: 'pw', firstName: 'Alice' }).expect(400);
  });

  it('POST /auth/register should create user and return names when provided', async () => {
    // mock getUserByUsername -> no existing user, and createUser will return created row
    (pool.query as jest.Mock).mockImplementation(async (text: string, params?: any[]) => {
      // Insert returning
      if (String(text).startsWith('INSERT INTO users')) {
        return { rows: [{ id: 'user-123', username: params ? params[1] : 'a@b.com', first_name: params ? params[4] : 'Alice', last_name: params ? params[5] : 'Smith' }] };
      }
      // getUserRoles
      if (String(text).startsWith('SELECT role FROM user_roles')) return { rows: [] };
      // default
      return { rows: [] };
    });

    const res = await request(app).post('/auth/register').send({ username: 'alice@example.com', password: 'pw', firstName: 'Alice', lastName: 'Smith' }).expect(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.firstName).toBe('Alice');
    expect(res.body.user.lastName).toBe('Smith');
  });

  it('GET /auth/me should return firstName/lastName from user row', async () => {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
    const token = jwt.sign({ id: 'user-321', username: 'bob@example.com' }, JWT_SECRET);

    (pool.query as jest.Mock).mockImplementation(async (text: string, params?: any[]) => {
      if (String(text).startsWith('SELECT * FROM users WHERE id')) {
        return { rows: [{ id: 'user-321', username: 'bob@example.com', first_name: 'Bob', last_name: 'Jones' }] };
      }
      if (String(text).startsWith('SELECT role FROM user_roles')) return { rows: [] };
      return { rows: [] };
    });

    const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.firstName).toBe('Bob');
    expect(res.body.user.lastName).toBe('Jones');
  });
});
