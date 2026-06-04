-- Stripe events dedupe + async processing infrastructure
-- June 5, 2026 — Financial Pipeline Sprint

-- 1. Raw stripe_events table with UNIQUE constraint for dedup
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  raw_body jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Index for finding unprocessed events
CREATE INDEX IF NOT EXISTS idx_stripe_events_unprocessed 
  ON public.stripe_events(created_at) 
  WHERE processed = false;

-- 3. Index for cleanup queries (events older than 90 days)
CREATE INDEX IF NOT EXISTS idx_stripe_events_cleanup 
  ON public.stripe_events(created_at) 
  WHERE processed = true;

-- 4. Add dispute_reason + dispute_status to submissions for dispute flow
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS dispute_reason text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS dispute_status text 
  CHECK (dispute_status IN ('pending', 'under_review', 'resolved', 'rejected'))
  DEFAULT NULL;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS disputed_at timestamptz;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS dispute_resolved_at timestamptz;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS dispute_resolution text;

-- 5. RLS for stripe_events (admin only)
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read stripe_events"
  ON public.stripe_events FOR SELECT
  USING (auth.jwt() ->> 'email' = 'motomotosings@gmail.com');

-- 6. Function: safe record stripe event (handles duplicates gracefully)
CREATE OR REPLACE FUNCTION public.record_stripe_event(
  p_stripe_event_id text,
  p_event_type text,
  p_raw_body jsonb
) RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.stripe_events (stripe_event_id, event_type, raw_body)
  VALUES (p_stripe_event_id, p_event_type, p_raw_body)
  ON CONFLICT (stripe_event_id) DO NOTHING
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function: mark stripe event processed
CREATE OR REPLACE FUNCTION public.mark_stripe_event_processed(
  p_stripe_event_id text,
  p_error text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  UPDATE public.stripe_events SET
    processed = true,
    processed_at = now(),
    error = p_error
  WHERE stripe_event_id = p_stripe_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Add fee_breakdown column to campaign_donations for audit
ALTER TABLE public.campaign_donations ADD COLUMN IF NOT EXISTS platform_fee_cents integer DEFAULT 0;
ALTER TABLE public.campaign_donations ADD COLUMN IF NOT EXISTS stripe_fee_cents integer DEFAULT 0;
ALTER TABLE public.campaign_donations ADD COLUMN IF NOT EXISTS net_to_artist_cents integer DEFAULT 0;

-- 9. Add pending_payouts_cents to artist_profiles for dashboard
ALTER TABLE public.artist_profiles ADD COLUMN IF NOT EXISTS pending_payouts_cents integer NOT NULL DEFAULT 0;
