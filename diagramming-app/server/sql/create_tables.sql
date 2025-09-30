-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure existing users table has password_salt column
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_salt TEXT NOT NULL DEFAULT '';

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

-- Create refresh_tokens table to support refresh token rotation/revocation
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);

-- Create user_settings table to persist per-user settings (pinned shapes etc.)
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings (user_id);

-- Create diagram_history table to store auditable versions of diagrams
CREATE TABLE IF NOT EXISTS diagram_history (
  id UUID PRIMARY KEY,
  diagram_id UUID NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
  state JSONB NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID NULL REFERENCES users(id),
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diagram_history_diagram_id ON diagram_history (diagram_id);
CREATE INDEX IF NOT EXISTS idx_diagram_history_created_at ON diagram_history (created_at);
