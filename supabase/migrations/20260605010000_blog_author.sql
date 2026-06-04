-- Blog posts: add author columns for byline + Person schema
-- June 5, 2026

ALTER TABLE public.blog_posts
    ADD COLUMN IF NOT EXISTS author_name TEXT DEFAULT 'Selah.fm Music Team',
    ADD COLUMN IF NOT EXISTS author_url  TEXT DEFAULT 'https://selah.fm/about';

-- Update existing published/scheduled posts with default author
UPDATE public.blog_posts
SET author_name = 'Selah.fm Music Team',
    author_url  = 'https://selah.fm/about'
WHERE author_name IS NULL;
