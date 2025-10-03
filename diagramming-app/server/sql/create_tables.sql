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

-- Create shared_documents table to map diagrams to users they are shared with.
CREATE TABLE IF NOT EXISTS shared_documents (
  diagram_id UUID NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_by UUID NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (diagram_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_shared_documents_user_id ON shared_documents (user_id);
CREATE INDEX IF NOT EXISTS idx_shared_documents_diagram_id ON shared_documents (diagram_id);

-- Create pending_invites table to support invite flow for unregistered emails
CREATE TABLE IF NOT EXISTS pending_invites (
  id UUID PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  invited_email TEXT NOT NULL,
  diagram_id UUID NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
  invited_by UUID NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NULL,
  accepted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_pending_invites_token ON pending_invites (token);
CREATE INDEX IF NOT EXISTS idx_pending_invites_email ON pending_invites (lower(invited_email));

-- Backfill existing state.sharedWith arrays into the shared_documents table for users that exist.
-- For each diagram that has a state.sharedWith array of emails, insert a row for each email that corresponds to
-- an existing user (matched by username, which is the user's email in this system). This is non-destructive and
-- will not insert duplicates due to the primary key and ON CONFLICT DO NOTHING.
INSERT INTO shared_documents (diagram_id, user_id, created_at)
SELECT d.id AS diagram_id, u.id AS user_id, NOW() AS created_at
FROM diagrams d
CROSS JOIN LATERAL jsonb_array_elements_text(d.state->'sharedWith') AS shared_email(email)
JOIN users u ON lower(u.username) = lower(shared_email.email)
ON CONFLICT (diagram_id, user_id) DO NOTHING;
