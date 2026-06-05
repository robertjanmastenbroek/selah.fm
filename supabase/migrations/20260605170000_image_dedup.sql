-- Add image hash for byte-level deduplication of blog images
ALTER TABLE blog_images ADD COLUMN IF NOT EXISTS image_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_blog_images_hash ON blog_images(image_hash);

-- Add per_page column to Pexels API calls for more variety
