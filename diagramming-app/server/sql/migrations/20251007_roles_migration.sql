-- Migration: Add user_roles table and backfill from users.is_admin
-- This script is idempotent and safe to run multiple times.

BEGIN;

-- 1) Ensure user_roles exists
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role)
);

-- 2) Backfill admin roles from existing is_admin column
INSERT INTO user_roles(user_id, role, created_at)
SELECT id, 'admin', NOW() FROM users WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

COMMIT;

-- After running the above and verifying the counts below, you can remove the
-- legacy is_admin column in a subsequent, manual maintenance window.
-- Uncomment and run the following only after you have verified the backfill
-- on all production instances and clients have been updated to use roles.

-- ALTER TABLE users DROP COLUMN IF EXISTS is_admin;

-- Verification queries (run manually):
-- SELECT COUNT(*) FROM users WHERE is_admin = true;
-- SELECT COUNT(*) FROM user_roles WHERE role = 'admin';
