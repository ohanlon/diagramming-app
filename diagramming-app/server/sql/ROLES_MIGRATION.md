Roles migration guide

Purpose

This guide shows a safe, multi-step plan to migrate from the legacy `users.is_admin` boolean to the normalized `user_roles` table. The intent is to allow gradual rollout with verification steps.

Plan

1) Deploy server code that understands `roles` and reads/writes the `user_roles` table (changes should not depend on dropping `is_admin`).

2) Run the backfill SQL to ensure users that previously had `is_admin = true` have a corresponding `('admin')` row in `user_roles`:

   - Option A: Run the idempotent SQL migration file in `server/sql/migrations/20251007_roles_migration.sql` using your DB migration tooling.
   - Option B: Run the helper script from the server directory: `cd server && npm run migrate:roles` — this will create `user_roles` and insert admin rows for existing flagged users.

3) Verify the counts on production:

   - `SELECT COUNT(*) FROM users WHERE is_admin = true;`
   - `SELECT COUNT(*) FROM user_roles WHERE role = 'admin';`

   These two numbers should match (or you can manually verify specific users).

4) Keep the `is_admin` column for a monitoring period (e.g., 24-72 hours). During this time:

   - Deploy application code that reads `roles` (already done in this change set).
   - Ensure logs and telemetry show no permission regressions.
   - Verify that `user_roles` has been used for authorization in production paths and there are no missing roles for expected admin users.

5) Final step: when you are confident the backfill is complete and the app uses `roles` exclusively, remove the old column:

   - Option A (manual SQL): `ALTER TABLE users DROP COLUMN IF EXISTS is_admin;` — run during a maintenance window.
   - Option B (helper script): From the server directory run `npm run migrate:roles:drop` and follow the interactive confirmation, or run with `--force` to skip confirmation.

Notes

- The migration SQL is idempotent and safe to run multiple times.
- Do not drop the `is_admin` column until application code reads roles and writes back new roles where expected.
- The helper script `server/scripts/migrate_roles.js` can be run from CI/CD or manually; it uses `DATABASE_URL` from environment to connect to the database.

Rollback

- The backfill step inserts `user_roles` rows only (no destructive action). If you accidentally drop `is_admin` before confirming the backfill, you'll lose that column's data (hence the recommended verification step).

*** End Patch