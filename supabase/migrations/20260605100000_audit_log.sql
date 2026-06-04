-- Audit log table for money movement tracking
-- Records every financial event: donation, deposit, payout, refund, fee change

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target ON public.audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_log(action);

-- RLS: service_role only (cron/admin/support)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Allow service_role and admin users full access
CREATE POLICY "Service role full access"
  ON public.audit_log
  USING (true)
  WITH CHECK (true);
