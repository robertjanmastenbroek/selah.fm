-- Selah.fm — Migration 002: Campaign Metadata Fields
-- Adds required hashtags, FTC disclosure, min video length, caption requirements
-- Run: psql $DATABASE_URL -f lib/db/migrations/002_campaign_metadata.sql

BEGIN;

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS required_hashtags TEXT,
  ADD COLUMN IF NOT EXISTS require_ftc BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_video_length_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS caption_requirements TEXT;

COMMIT;
