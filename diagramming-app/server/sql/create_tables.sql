-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure existing users table has password_salt column
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_salt TEXT NOT NULL DEFAULT '';
-- Ensure first_name/last_name columns exist for legacy users
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT NOT NULL DEFAULT '';
-- Add an is_admin flag to users for role-based authorization
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- New: normalized user roles table to support multiple roles per user (admin, sales, etc.)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role)
);

-- Backfill: convert existing is_admin flags into the user_roles table
INSERT INTO user_roles(user_id, role, created_at)
SELECT id, 'admin', NOW() FROM users WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

-- Remove deprecated is_admin column now that roles are normalized
ALTER TABLE users DROP COLUMN IF EXISTS is_admin;

-- Enterprises / organisations onboarding table
CREATE TABLE IF NOT EXISTS organisations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  primary_contact_email TEXT NOT NULL,
  localadmin_email TEXT NOT NULL,
  created_by UUID NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce case-insensitive uniqueness on organisation names (Apple == apple)
CREATE UNIQUE INDEX IF NOT EXISTS idx_organisations_name_ci ON organisations (lower(name));

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
-- Add an integer version column for optimistic concurrency control (ETag support)
ALTER TABLE diagrams ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

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
  -- Permission can be 'view' or 'edit'. Presence of a row implies at least view access.
  permission TEXT NOT NULL DEFAULT 'view',
  -- Whether the recipient is allowed to copy/duplicate the diagram for their own use.
  can_copy BOOLEAN NOT NULL DEFAULT TRUE,
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
  permission TEXT NOT NULL DEFAULT 'view',
  can_copy BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NULL,
  accepted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_pending_invites_token ON pending_invites (token);
CREATE INDEX IF NOT EXISTS idx_pending_invites_email ON pending_invites (lower(invited_email));

-- Application-level settings that can be changed at runtime by an admin.
-- Key is a text identifier and value is stored as jsonb so it can hold simple scalars
-- or richer structures. We use this to persist 'refresh_expires_days'.
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings (key);

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

-- Table: public.shape_category

-- DROP TABLE IF EXISTS public.shape_category;

CREATE TABLE IF NOT EXISTS public.shape_category
(
    id uuid NOT NULL,
    name text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT shape_category_pkey PRIMARY KEY (id),
    CONSTRAINT shape_category_name UNIQUE (name)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.shape_category
    OWNER to postgres;

INSERT INTO public.shape_category(
	id, name)
	VALUES ('4c6dfc72-644f-4e1d-8dda-cfb3cfc59560', 'AWS');
INSERT INTO public.shape_category(
	id, name)
	VALUES ('f7f1136a-ef47-408b-b55e-60528baf801e', 'Azure');
INSERT INTO public.shape_category(
	id, name)
	VALUES ('5944d9a3-e358-4286-adac-1c322e1db5b1', 'Interactive');

-- Table: public.shape_subcategory

-- DROP TABLE IF EXISTS public.shape_subcategory;

CREATE TABLE IF NOT EXISTS public.shape_subcategory
(
    id uuid NOT NULL,
    name text COLLATE pg_catalog."default" NOT NULL,
    category_id uuid NOT NULL,
    CONSTRAINT shape_subcategory_pkey PRIMARY KEY (id),
    CONSTRAINT subcategory_category_id FOREIGN KEY (category_id)
        REFERENCES public.shape_category (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.shape_subcategory
    OWNER to postgres;

-- Ensure sub-category names are only unique per category rather than globally
ALTER TABLE IF EXISTS public.shape_subcategory
  DROP CONSTRAINT IF EXISTS shape_subcategory_name;

CREATE UNIQUE INDEX IF NOT EXISTS shape_subcategory_category_name_idx
  ON public.shape_subcategory (category_id, lower(name));
