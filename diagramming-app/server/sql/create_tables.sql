-- Create diagrams table
CREATE TABLE IF NOT EXISTS diagrams (
  id UUID PRIMARY KEY,
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional index on updated_at for listing by recency
CREATE INDEX IF NOT EXISTS idx_diagrams_updated_at ON diagrams (updated_at);
