-- Referral earnings: support non-artist referrers with withdrawable balance
-- June 4, 2026

-- 1. Add referrer_earnings_cents to users (withdrawable by non-artists)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referrer_earnings_cents integer NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.users(id);

-- 2. Generate referral codes for existing users
UPDATE public.users SET referral_code = encode(sha256((id::text || 'selah2026')::bytea), 'hex') WHERE referral_code IS NULL;

-- 3. Make referral_code NOT NULL once populated
ALTER TABLE public.users ALTER COLUMN referral_code SET NOT NULL;

-- 4. Add referral_bonus_cents to campaign_donations (for tracking)
ALTER TABLE public.campaign_donations ADD COLUMN IF NOT EXISTS referral_bonus_cents integer NOT NULL DEFAULT 0;

-- 5. Create pending_referral_bonuses table for withdrawable referral earnings
CREATE TABLE IF NOT EXISTS public.pending_referral_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  campaign_donation_id uuid REFERENCES public.campaign_donations(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

-- 6. Function to award referral bonus
CREATE OR REPLACE FUNCTION public.award_referral_bonus(
  p_referrer_id uuid,
  p_amount_cents integer,
  p_campaign_donation_id uuid DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Credit referrer's earnings
  UPDATE public.users SET referrer_earnings_cents = referrer_earnings_cents + p_amount_cents
  WHERE id = p_referrer_id;
  
  -- Track for withdrawal
  INSERT INTO public.pending_referral_bonuses (user_id, amount_cents, campaign_donation_id, status)
  VALUES (p_referrer_id, p_amount_cents, p_campaign_donation_id, 'pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS for pending_referral_bonuses
ALTER TABLE public.pending_referral_bonuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own referral bonuses"
  ON public.pending_referral_bonuses FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users can cancel own unredeemed referral bonuses"
  ON public.pending_referral_bonuses FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'cancelled');

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON public.users(referred_by);
CREATE INDEX IF NOT EXISTS idx_pending_referral_bonuses_user ON public.pending_referral_bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_referral_bonuses_status ON public.pending_referral_bonuses(status);
