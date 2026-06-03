-- Archive table for activity events older than 30 days
CREATE TABLE IF NOT EXISTS public.activity_events_archive (
  LIKE public.activity_events INCLUDING ALL
);

CREATE INDEX IF NOT EXISTS idx_activity_archive_created
  ON public.activity_events_archive(created_at DESC);
