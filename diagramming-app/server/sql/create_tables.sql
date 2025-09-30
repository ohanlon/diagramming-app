-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create diagrams table
CREATE TABLE IF NOT EXISTS diagrams (
  id UUID PRIMARY KEY,
  state JSONB NOT NULL,
  owner_user_id UUID NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional index on updated_at for listing by recency
CREATE INDEX IF NOT EXISTS idx_diagrams_updated_at ON diagrams (updated_at);

-- Ensure existing diagrams get an owner_user_id column if the table existed before
ALTER TABLE diagrams ADD COLUMN IF NOT EXISTS owner_user_id UUID NULL REFERENCES users(id);

-- Create index on owner_user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_diagrams_owner_user_id ON diagrams (owner_user_id);
