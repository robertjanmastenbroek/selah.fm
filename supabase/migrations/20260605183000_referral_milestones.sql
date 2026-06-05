-- June 5, 2026
-- Adds milestone tracking for referral program gamification.

-- 1. Add bonus_type to pending_referral_bonuses for distinguishing regular vs milestone
ALTER TABLE public.pending_referral_bonuses ADD COLUMN IF NOT EXISTS bonus_type text NOT NULL DEFAULT 'referral'
  CHECK (bonus_type IN ('referral', 'milestone'));

-- 2. Add milestone_reached to users for tracking which milestones were awarded
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS milestone_level integer DEFAULT 0;

-- 3. Create a function to award milestone bonuses
CREATE OR REPLACE FUNCTION public.award_referral_milestone(
  p_user_id uuid,
  p_level integer,
  p_amount_cents integer
) RETURNS boolean AS $$
DECLARE
  v_current_level integer;
BEGIN
  -- Check current milestone level
  SELECT milestone_level INTO v_current_level FROM public.users WHERE id = p_user_id;
  
  -- Only award if this milestone hasn't been reached yet
  IF v_current_level IS NULL OR v_current_level < p_level THEN
    UPDATE public.users SET
      referrer_earnings_cents = referrer_earnings_cents + p_amount_cents,
      milestone_level = p_level
    WHERE id = p_user_id;
    
    INSERT INTO public.pending_referral_bonuses (user_id, amount_cents, bonus_type, status)
    VALUES (p_user_id, p_amount_cents, 'milestone', 'pending');
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Index for milestone lookups
CREATE INDEX IF NOT EXISTS idx_users_milestone_level ON public.users(milestone_level);
