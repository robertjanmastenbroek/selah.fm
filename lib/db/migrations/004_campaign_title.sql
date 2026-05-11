-- Migration 004: Add custom title field to campaigns
-- Allows artists to set a display title different from track_title
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS title TEXT;
