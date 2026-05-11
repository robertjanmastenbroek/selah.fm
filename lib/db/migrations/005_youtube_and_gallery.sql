-- Migration 005: Add YouTube video URL and gallery images to campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS youtube_video_url TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;
