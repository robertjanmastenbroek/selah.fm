-- Enhanced analytics: session tracking + referrer + UTM
ALTER TABLE public.analytics_events 
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_session ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON public.analytics_events(user_id);
