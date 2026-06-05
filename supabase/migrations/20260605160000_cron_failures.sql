-- Cron failure tracking table — enables admin visibility into pipeline health
CREATE TABLE IF NOT EXISTS cron_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_path TEXT NOT NULL,
  error_message TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cron_failures_worker ON cron_failures(worker_path);
CREATE INDEX IF NOT EXISTS idx_cron_failures_attempted ON cron_failures(attempted_at DESC);
