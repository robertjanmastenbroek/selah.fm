-- Add pinned flag to artist_profiles for browse page top-pinning
ALTER TABLE artist_profiles ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false;

-- Index for fast pinned-first queries
CREATE INDEX IF NOT EXISTS idx_artist_profiles_pinned ON artist_profiles(pinned DESC) WHERE pinned = true;
