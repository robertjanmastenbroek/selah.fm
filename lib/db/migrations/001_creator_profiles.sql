-- Selah.fm — Migration 001: Creator Profile Fields + creator_stats View
-- Run: psql $DATABASE_URL -f lib/db/migrations/001_creator_profiles.sql

BEGIN;

-- Add creator profile columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS genres TEXT,
  ADD COLUMN IF NOT EXISTS preferred_cpm_cents INTEGER,
  ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
  ADD COLUMN IF NOT EXISTS acceptance_rate REAL DEFAULT 0;

-- Add content_assets_url and recommended_hashtags to campaigns (used by code)
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS content_assets_url TEXT,
  ADD COLUMN IF NOT EXISTS recommended_hashtags TEXT;

-- Drop existing creator_stats view if it exists (to recreate with new columns)
DROP VIEW IF EXISTS creator_stats CASCADE;

-- Create creator_stats view with acceptance rate computation
CREATE VIEW creator_stats AS
SELECT
    u.id AS creator_id,
    u.display_name,
    COUNT(s.id) AS total_submissions,
    COUNT(s.id) FILTER (WHERE s.review_status = 'approved') AS approved_submissions,
    COALESCE(SUM(s.views_verified), 0) AS total_verified_views,
    COALESCE(SUM(s.payout_amount_cents), 0) AS total_earned_cents,
    CASE 
        WHEN COUNT(s.id) > 0 
        THEN ROUND(COUNT(s.id) FILTER (WHERE s.review_status = 'approved')::numeric / COUNT(s.id)::numeric, 2)
        ELSE 0
    END AS acceptance_rate
FROM users u
LEFT JOIN submissions s ON s.creator_id = u.id
WHERE u.user_type = 'creator'
GROUP BY u.id, u.display_name;

COMMIT;
