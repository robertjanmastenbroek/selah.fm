-- Blog analytics tracking for self-improvement loop
CREATE TABLE IF NOT EXISTS public.blog_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_analytics_type ON public.blog_analytics(data_type);
CREATE INDEX IF NOT EXISTS idx_blog_analytics_collected ON public.blog_analytics(collected_at DESC);
