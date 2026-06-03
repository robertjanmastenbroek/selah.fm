-- Artist follow system — server-persisted follows (replaces localStorage-only)
CREATE TABLE IF NOT EXISTS artist_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES discovered_artists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, artist_id)
);

CREATE INDEX IF NOT EXISTS idx_artist_follows_user ON artist_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_artist_follows_artist ON artist_follows(artist_id);

-- Enable RLS
ALTER TABLE artist_follows ENABLE ROW LEVEL SECURITY;

-- Users can read their own follows
CREATE POLICY "Users can read own follows"
  ON artist_follows FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own follows
CREATE POLICY "Users can insert own follows"
  ON artist_follows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own follows
CREATE POLICY "Users can delete own follows"
  ON artist_follows FOR DELETE
  USING (auth.uid() = user_id);
