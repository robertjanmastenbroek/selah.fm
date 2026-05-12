-- 012_outreach_pipeline.sql
-- Outbound artist marketing automation tables.
-- Supports: Discover → Audit → Campaign Create → Outreach → Claim pipeline.

-- Discovered artists from automated sourcing (Spotify, TikTok, Bandcamp, etc.)
CREATE TABLE IF NOT EXISTS discovered_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_name TEXT NOT NULL,
  spotify_id TEXT UNIQUE,
  genres TEXT[] DEFAULT '{}',
  monthly_listeners INTEGER DEFAULT 0,
  followers INTEGER DEFAULT 0,
  social_links JSONB DEFAULT '{}',
  latest_track_name TEXT,
  latest_track_spotify_url TEXT,
  latest_track_cover_url TEXT,
  latest_release_date DATE,
  discovery_source TEXT, -- 'spotify_search', 'spotify_playlist', 'tiktok', 'bandcamp'
  ai_signals_detected INTEGER DEFAULT 0, -- count of AI artist signals (skip if >= 2)
  is_ai_artist BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'discovered', -- 'discovered','audited','campaign_created','outreach_sent','claimed','declined','dormant'
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovered_spotify ON discovered_artists(spotify_id);
CREATE INDEX IF NOT EXISTS idx_discovered_status ON discovered_artists(status);
CREATE INDEX IF NOT EXISTS idx_discovered_ai ON discovered_artists(is_ai_artist) WHERE is_ai_artist = false;

-- Detailed audit per artist
CREATE TABLE IF NOT EXISTS artist_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discovered_artist_id UUID REFERENCES discovered_artists(id) ON DELETE CASCADE,
  spotify_monthly_listeners INTEGER,
  spotify_track_streams INTEGER,
  youtube_video_url TEXT,
  youtube_video_views INTEGER,
  spotify_embed_url TEXT,
  artist_bio TEXT,
  recommended_cpm_cents INTEGER DEFAULT 10, -- $0.10 default
  recommended_budget_cents INTEGER DEFAULT 10000, -- $100 default
  instagram_handle TEXT,
  instagram_followers INTEGER,
  instagram_last_post_date DATE,
  instagram_engagement_notes TEXT,
  tiktok_handle TEXT,
  tiktok_followers INTEGER,
  tiktok_avg_views INTEGER,
  email_address TEXT,
  website_url TEXT,
  hashtags TEXT[] DEFAULT '{}',
  personal_angle TEXT, -- specific compliment/observation for outreach
  audited_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audits_artist ON artist_audits(discovered_artist_id);

-- Outreach log — every message sent to an artist
CREATE TABLE IF NOT EXISTS outreach_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discovered_artist_id UUID REFERENCES discovered_artists(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id),
  channel TEXT NOT NULL, -- 'instagram_dm', 'email', 'tiktok_dm', 'twitter_dm'
  message_type TEXT NOT NULL DEFAULT 'initial', -- 'initial', 'follow_up', 'manual'
  message_text TEXT,
  status TEXT DEFAULT 'pending', -- 'pending','sent','delivered','read','replied','claimed','opted_out','failed'
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outreach_artist ON outreach_log(discovered_artist_id);
CREATE INDEX IF NOT EXISTS idx_outreach_status ON outreach_log(status);
CREATE INDEX IF NOT EXISTS idx_outreach_campaign ON outreach_log(campaign_id);

-- Claim codes for campaign ownership transfer
CREATE TABLE IF NOT EXISTS campaign_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) NOT NULL UNIQUE,
  discovered_artist_id UUID REFERENCES discovered_artists(id),
  claim_code TEXT NOT NULL UNIQUE,
  verification_method TEXT, -- 'spotify_oauth', 'instagram_dm', 'email', 'manual'
  claimed_by_user_id UUID REFERENCES users(id),
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claims_code ON campaign_claims(claim_code);
CREATE INDEX IF NOT EXISTS idx_claims_campaign ON campaign_claims(campaign_id);

-- Add unclaimed status support to campaigns table (if not already present)
-- The CHECK constraint may need updating; handled via NOT VALID to avoid locking
DO $$
BEGIN
  ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_unclaimed BOOLEAN DEFAULT false;
  ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS claimed_by_user_id UUID REFERENCES users(id);
  ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

COMMENT ON COLUMN campaigns.is_unclaimed IS 'True if campaign was auto-generated via outreach pipeline, not yet claimed by artist';
