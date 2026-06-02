-- ── Phase B: Migrate existing campaign data to artist_tracks ───
-- Creates artist_tracks from active campaigns, then designates funding pools.
-- Run AFTER 003_artist_tracks.sql.

-- 1. Migrate existing active campaigns to artist_tracks
WITH track_data AS (
  SELECT DISTINCT ON (cc.discovered_artist_id, 
    COALESCE(c.track_url, c.slug, c.id::text))
    cc.discovered_artist_id,
    c.track_title,
    c.track_url,
    c.cover_art_url,
    c.cpm_rate_cents,
    c.created_at,
    ROW_NUMBER() OVER (PARTITION BY cc.discovered_artist_id ORDER BY c.created_at DESC) as rn
  FROM campaigns c
  JOIN campaign_claims cc ON cc.campaign_id = c.id
  WHERE c.status = 'active'
    AND c.track_title IS NOT NULL
    AND c.track_title != ''
)
INSERT INTO artist_tracks (artist_id, title, spotify_url, cover_art_url, cpm_rate_cents, sort_order)
SELECT 
  discovered_artist_id,
  track_title,
  track_url,
  cover_art_url,
  cpm_rate_cents,
  rn
FROM track_data
ORDER BY discovered_artist_id, rn;

-- 2. Check how many were migrated
DO $$
DECLARE migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count FROM artist_tracks;
  RAISE NOTICE 'Migrated % tracks to artist_tracks', migrated_count;
END $$;

-- 3. Designate one campaign per artist as the funding pool
UPDATE campaigns c SET is_artist_pool = true
FROM campaign_claims cc
WHERE cc.campaign_id = c.id
  AND c.id = (
    SELECT c2.id FROM campaigns c2
    JOIN campaign_claims cc2 ON cc2.campaign_id = c2.id
    WHERE cc2.discovered_artist_id = cc.discovered_artist_id 
      AND c2.status = 'active'
    ORDER BY c2.created_at ASC
    LIMIT 1
  );

-- 4. Add comment_count to discovered_artists if missing
ALTER TABLE discovered_artists ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;
