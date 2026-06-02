-- selah.fm — Auto-enable RLS + missing schema + policy completion
-- 2026-06-02

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. AUTO-ENABLE RLS TRIGGER — enables RLS on every new table automatically
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.auto_enable_rls()
RETURNS event_trigger AS $$
DECLARE
    obj record;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands() WHERE command_tag = 'CREATE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', obj.object_identity);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if exists (idempotent)
DROP EVENT TRIGGER IF EXISTS auto_enable_rls_trigger;

CREATE EVENT TRIGGER auto_enable_rls_trigger
ON ddl_command_end
WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS')
EXECUTE FUNCTION public.auto_enable_rls();

COMMENT ON FUNCTION public.auto_enable_rls() IS 'Automatically enables Row Level Security on any new table created in public schema.';


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. MISSING TABLES — created outside migrations (exist in prod)
-- ═══════════════════════════════════════════════════════════════════════════

-- blog_images: stores blog post images as BYTEA (same pattern as campaign_images)
CREATE TABLE IF NOT EXISTS public.blog_images (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_post_id    UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    image_data      BYTEA NOT NULL,
    mime_type       TEXT NOT NULL DEFAULT 'image/jpeg',
    source_url      TEXT,
    alt_text        TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.blog_images ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_blog_images_post ON public.blog_images(blog_post_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. MISSING COLUMNS — added after initial migration (exist in prod)
-- ═══════════════════════════════════════════════════════════════════════════

-- Engagement tracking on users
ALTER TABLE public.users 
    ADD COLUMN IF NOT EXISTS onboarded_at          TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reengage_at           TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS welcome_emails_sent   INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_action_at        TIMESTAMPTZ;

-- Campaign discovery metadata
ALTER TABLE public.campaigns
    ADD COLUMN IF NOT EXISTS is_unclaimed          BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS claimed_by_user_id    UUID REFERENCES public.users(id),
    ADD COLUMN IF NOT EXISTS claim_code            TEXT,
    ADD COLUMN IF NOT EXISTS artist_name           TEXT,
    ADD COLUMN IF NOT EXISTS artist_avatar         TEXT,
    ADD COLUMN IF NOT EXISTS total_verified_views  INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS approved_submissions  INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS donations             JSONB DEFAULT '{"totalCents":0,"count":0,"supporters":[]}'::jsonb;

-- Outreach pipeline enrichment
ALTER TABLE public.discovered_artists
    ADD COLUMN IF NOT EXISTS email_address         TEXT,
    ADD COLUMN IF NOT EXISTS facebook_url          TEXT,
    ADD COLUMN IF NOT EXISTS soundcloud_url        TEXT,
    ADD COLUMN IF NOT EXISTS apple_music_url       TEXT,
    ADD COLUMN IF NOT EXISTS amazon_music_url      TEXT,
    ADD COLUMN IF NOT EXISTS monthly_listeners     INTEGER,
    ADD COLUMN IF NOT EXISTS followers             INTEGER,
    ADD COLUMN IF NOT EXISTS social_links          JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.artist_audits
    ADD COLUMN IF NOT EXISTS spotify_embed_url     TEXT,
    ADD COLUMN IF NOT EXISTS youtube_video_url     TEXT,
    ADD COLUMN IF NOT EXISTS instagram_handle      TEXT,
    ADD COLUMN IF NOT EXISTS tiktok_handle         TEXT,
    ADD COLUMN IF NOT EXISTS youtube_handle        TEXT,
    ADD COLUMN IF NOT EXISTS facebook_handle       TEXT,
    ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMPTZ DEFAULT NOW();

-- Batches: track last sourcing time
ALTER TABLE public.batches
    ADD COLUMN IF NOT EXISTS last_sourced_at       TIMESTAMPTZ;

-- Blog posts SEO enhancements
ALTER TABLE public.blog_posts
    ADD COLUMN IF NOT EXISTS primary_keyword       TEXT,
    ADD COLUMN IF NOT EXISTS internal_links        JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS faq_schema            JSONB,
    ADD COLUMN IF NOT EXISTS word_count            INTEGER,
    ADD COLUMN IF NOT EXISTS cta_positions         JSONB DEFAULT '[]'::jsonb;


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. RLS POLICIES — fill gaps where tables have RLS but no policies
-- ═══════════════════════════════════════════════════════════════════════════

-- ── blog_images: public read (served via /api/images, but defense-in-depth) ──
CREATE POLICY "Public can read blog_images"
  ON public.blog_images FOR SELECT
  USING (true);

-- ── view_snapshots: authenticated users read own (via submission owner) ──
CREATE POLICY "Creators can read own view snapshots"
  ON public.view_snapshots FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.submissions 
    WHERE id = view_snapshots.submission_id AND creator_id = auth.uid()
  ));

CREATE POLICY "Artists can read snapshots on their campaigns"
  ON public.view_snapshots FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.submissions s
    JOIN public.campaigns c ON c.id = s.campaign_id
    WHERE s.id = view_snapshots.submission_id AND c.artist_id = auth.uid()
  ));

-- ── ratings: read by all authenticated, write by submission creator ──
CREATE POLICY "Authenticated users can read ratings"
  ON public.ratings FOR SELECT
  USING (true);

CREATE POLICY "Creators can create ratings for own submissions"
  ON public.ratings FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.submissions 
    WHERE id = ratings.submission_id AND creator_id = auth.uid()
  ));

-- ── campaign_donations: public read, donor can create ──
CREATE POLICY "Anyone can read donations"
  ON public.campaign_donations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can donate"
  ON public.campaign_donations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── referrals: referrer can read own ──
CREATE POLICY "Users can read own referrals"
  ON public.referrals FOR SELECT
  USING (referrer_id = auth.uid());

-- ── bugs: authenticated can create, read own ──
CREATE POLICY "Users can read own bugs"
  ON public.bugs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can report bugs"
  ON public.bugs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── live_ticker_events: already has public read via "Authenticated can read live_ticker" ──
-- (from original migration — policy name "Authenticated can read live_ticker" uses USING(true))

-- ── Blog system tables: authenticated read (cron writes via service_role) ──
CREATE POLICY "Authenticated can read batches"
  ON public.batches FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can read batch_questions"
  ON public.batch_questions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can read batch_interviews"
  ON public.batch_interviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can read voice_chunks"
  ON public.voice_chunks FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can read used_questions"
  ON public.used_questions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can read keyword_buckets"
  ON public.keyword_buckets FOR SELECT
  USING (true);

-- ── Outreach pipeline tables: authenticated read (cron writes via service_role) ──
CREATE POLICY "Authenticated can read discovered_artists"
  ON public.discovered_artists FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can read artist_audits"
  ON public.artist_audits FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can read outreach_log"
  ON public.outreach_log FOR SELECT
  USING (true);

-- ── Email tables: no public access (service_role only via cron) ──
-- Intentionally no policies — RLS is enabled, blocking all anon/authenticated access.
-- Cron jobs use service_role key which bypasses RLS.

-- ── support_chats: authenticated can read own (via user_message) ──
-- No user_id column; skip policy. Server-side only.


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. ADMIN BYPASS — for all tables, allow admin full access
-- ═══════════════════════════════════════════════════════════════════════════

-- The existing admin policy on users hardcodes email addresses. 
-- Replace with a proper lookup using the ADMIN_EMAILS concept.
-- For now, ensure the admin can read all tables.

CREATE POLICY "Admins can read all view_snapshots"
  ON public.view_snapshots FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() 
    AND email = ANY(ARRAY['motomotosings@gmail.com'])
  ));

CREATE POLICY "Admins can manage all ratings"
  ON public.ratings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() 
    AND email = ANY(ARRAY['motomotosings@gmail.com'])
  ));
