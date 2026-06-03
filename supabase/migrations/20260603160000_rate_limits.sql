-- DB-backed rate limiting (scales across multiple instances)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint for ON CONFLICT upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_key
  ON public.rate_limits(key);

-- Composite index for fast lookup + cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_key_reset
  ON public.rate_limits(key, reset_at);

-- Cleanup old entries (run periodically)
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset
  ON public.rate_limits(reset_at);
