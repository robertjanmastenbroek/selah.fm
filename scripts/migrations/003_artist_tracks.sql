-- ── Phase A: Artist-First Data Model ───────────────────────────
-- Creates artist_tracks, artist_donations, and adds track_id to submissions.
-- Run with: scripts/migrations/run-migration.cjs

-- 0A. Artist Tracks — per-artist song catalog
CREATE TABLE IF NOT EXISTS artist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES discovered_artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  spotify_url TEXT,
  spotify_track_id TEXT,
  cover_art_url TEXT,
  duration_ms INTEGER,
  cpm_rate_cents INTEGER DEFAULT 10,
  enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_at_artist ON artist_tracks(artist_id, sort_order, enabled DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_at_spotify ON artist_tracks(artist_id, spotify_track_id) WHERE spotify_track_id IS NOT NULL;

-- 0B. Artist Donations — artist-level donations (not per-campaign)
CREATE TABLE IF NOT EXISTS artist_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES discovered_artists(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  donor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  donor_name TEXT,
  donor_email TEXT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 100),
  message TEXT CHECK (length(message) <= 500),
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ad_artist ON artist_donations(artist_id, created_at DESC);

-- 0C. Add track_id to submissions (nullable for backward compat)
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS track_id UUID REFERENCES artist_tracks(id) ON DELETE SET NULL;

-- 0D. Add is_artist_pool flag to campaigns (to mark the primary funding pool)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_artist_pool BOOLEAN DEFAULT false;
