-- Add claimed_by_user_id column to artist_profiles for user→artist ownership
-- This is the canonical link between a user account and their artist profile.
ALTER TABLE artist_profiles ADD COLUMN IF NOT EXISTS claimed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_artist_profiles_claimed_by_user ON artist_profiles(claimed_by_user_id);
