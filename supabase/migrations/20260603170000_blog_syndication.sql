-- Syndication log for Reddit cross-posting
CREATE TABLE IF NOT EXISTS public.blog_syndication_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('reddit', 'twitter', 'medium', 'devto')),
  target TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_syndication_post
  ON public.blog_syndication_log(blog_post_id, platform);

CREATE INDEX IF NOT EXISTS idx_syndication_date
  ON public.blog_syndication_log(created_at);
