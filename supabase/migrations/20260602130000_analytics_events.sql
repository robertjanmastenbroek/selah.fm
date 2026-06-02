-- selah.fm — Analytics events table
-- 2026-06-02
-- Tracks key user actions: CTA clicks, signup funnel, campaign joins, video submissions.

CREATE TABLE IF NOT EXISTS public.analytics_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event       TEXT NOT NULL,
    path        TEXT NOT NULL DEFAULT '',
    metadata    JSONB DEFAULT '{}'::jsonb,
    ip_hash     TEXT,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON public.analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

-- RLS is auto-enabled by the auto_enable_rls event trigger (20260602120000_rls_auto_enable.sql)

-- Read policy for authenticated users (admins/dashboard)
CREATE POLICY "Authenticated users can read analytics_events"
  ON public.analytics_events FOR SELECT
  USING (auth.uid() IS NOT NULL);
