#!/usr/bin/env node
const { Pool } = require('pg');
const readline = require('readline');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL must be set in environment');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function run() {
  const args = process.argv.slice(2);
  const dropIsAdmin = args.includes('--drop-is-admin');
  const forceDrop = args.includes('--force');

  console.log('Starting roles backfill migration...');
  try {
    await pool.query('BEGIN');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, role)
      )
    `);
    const res = await pool.query(`INSERT INTO user_roles(user_id, role, created_at)
      SELECT id, 'admin', NOW() FROM users WHERE is_admin = true
      ON CONFLICT (user_id, role) DO NOTHING RETURNING *`);
    console.log(`Inserted/ensured ${res.rowCount} admin role rows`);
    await pool.query('COMMIT');

    const [{ rows: [[{ count: usersWithFlag = 0 }]] } = {}] = [];
    const countIsAdmin = (await pool.query('SELECT COUNT(*)::int AS count FROM users WHERE is_admin = true')).rows[0].count;
    const countRoles = (await pool.query("SELECT COUNT(*)::int AS count FROM user_roles WHERE role = 'admin' ")).rows[0].count;
    console.log(`Users with is_admin flag: ${countIsAdmin}`);
    console.log(`Users with 'admin' role: ${countRoles}`);

    if (dropIsAdmin) {
      if (!forceDrop) {
        const answer = await promptYesNo(`About to DROP COLUMN users.is_admin which is irreversible. Continue? (y/N)`);
        if (!answer) {
          console.log('Aborting drop of is_admin column');
          await pool.end();
          return;
        }
      }
      console.log('Dropping column users.is_admin');
      await pool.query('ALTER TABLE users DROP COLUMN IF EXISTS is_admin');
      console.log('Dropped is_admin column');
    } else {
      console.log('is_admin column left intact. To drop it run this script with --drop-is-admin [--force]');
    }

    await pool.end();
    console.log('Migration complete');
  } catch (e) {
    console.error('Migration failed:', e);
    try { await pool.query('ROLLBACK'); } catch (e2) {}
    await pool.end();
    process.exit(1);
  }
}

function promptYesNo(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question + ' ', (answer) => {
      rl.close();
      const ok = String(answer || '').toLowerCase().startsWith('y');
      resolve(ok);
    });
  });
}

run();
