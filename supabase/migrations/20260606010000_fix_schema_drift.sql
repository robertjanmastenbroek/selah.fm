-- Migration: Fix schema drift — add missing columns and tables referenced by production code
-- Found via Railway runtime errors: donor_name missing, campaign_interests missing

-- ── 1. Add donor_name to campaign_donations ──────────────────────────────────
-- Code references this column across api/campaigns/[id], api/stats, api/stripe/webhook,
-- checkout page, and CampaignDetailClient
ALTER TABLE public.campaign_donations ADD COLUMN IF NOT EXISTS donor_name TEXT;
ALTER TABLE public.campaign_donations ADD COLUMN IF NOT EXISTS anonymous BOOLEAN NOT NULL DEFAULT false;

-- ── 2. Create campaign_interests table ──────────────────────────────────────
-- Referenced by app/api/campaigns/[id]/interest/route.ts (POST toggle interest)
CREATE TABLE IF NOT EXISTS public.campaign_interests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, campaign_id)
);

-- RLS: authenticated users can manage their own interests
ALTER TABLE public.campaign_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view campaign interests"
    ON public.campaign_interests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own interests"
    ON public.campaign_interests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own interests"
    ON public.campaign_interests FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_campaign_interests_user ON public.campaign_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_interests_campaign ON public.campaign_interests(campaign_id);

-- ── 3. Fix UUID slug resolution in api/campaigns/[id] ────────────────────────
-- The route handles both UUID and slug lookups, but the error "invalid input syntax for type uuid"
-- suggests some edge case bypasses the slug resolution. This migration adds a partial index
-- on slug for faster slug→UUID resolution.
-- (The actual fix is in the route code; this index makes slug lookups faster)
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON public.campaigns(slug) WHERE slug IS NOT NULL;
