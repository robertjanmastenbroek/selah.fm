-- Add video_url to campaigns for YouTube/Vimeo embeds
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS video_url TEXT;
