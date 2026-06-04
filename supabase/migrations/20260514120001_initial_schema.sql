-- selah.fm — Supabase Schema
-- Generated 2026-05-14 from Neon PostgreSQL schema
-- 
-- Supabase Auth manages auth.users (email, password, sessions).
-- public.users is a profile extension table linked by auth.users.id.

-- ─── Users (profile extension — auth.users is the source of truth) ───────────

CREATE TABLE public.users (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    user_type       TEXT NOT NULL DEFAULT 'creator' CHECK (user_type IN ('artist', 'creator')),
    is_artist       BOOLEAN NOT NULL DEFAULT false,
    is_creator      BOOLEAN NOT NULL DEFAULT true,
    display_name    TEXT NOT NULL,
    
    -- Creator-specific
    tiktok_handle   TEXT,
    instagram_handle TEXT,
    youtube_handle  TEXT,
    facebook_handle TEXT,
    
    -- Creator profile (marketplace directory)
    bio                     TEXT,
    genres                  TEXT,
    preferred_cpm_cents     INTEGER,
    profile_image_url       TEXT,
    acceptance_rate         REAL DEFAULT 0,
    
    -- Stripe
    stripe_customer_id      TEXT,
    stripe_connect_id       TEXT,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_type ON public.users(user_type);
CREATE INDEX idx_users_is_artist ON public.users(is_artist) WHERE is_artist = true;
CREATE INDEX idx_users_is_creator ON public.users(is_creator) WHERE is_creator = true;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, user_type, is_artist, is_creator)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'creator'),
    COALESCE((NEW.raw_user_meta_data->>'is_artist')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'is_creator')::boolean, true)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Campaigns ───────────────────────────────────────────────────────────────

CREATE TABLE public.campaigns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id       UUID NOT NULL REFERENCES public.users(id),
    
    -- Display
    title           TEXT,
    
    -- Track info
    track_title     TEXT NOT NULL,
    track_url       TEXT NOT NULL,
    cover_art_url   TEXT,
    preview_clip_url TEXT,
    
    -- YouTube + Gallery
    youtube_video_url TEXT,
    gallery_images  JSONB DEFAULT '[]'::jsonb,
    
    -- Budget & pricing
    cpm_rate_cents  INTEGER NOT NULL,
    total_budget_cents INTEGER NOT NULL,
    max_payout_per_submission_cents INTEGER NOT NULL,
    min_payout_per_submission_cents INTEGER NOT NULL DEFAULT 0,
    flat_fee_bonus_cents INTEGER DEFAULT 0,
    budget_remaining_cents INTEGER NOT NULL,
    
    -- Requirements
    requirements        TEXT,
    required_hashtags   TEXT,
    require_ftc         BOOLEAN DEFAULT false,
    min_video_length_seconds INTEGER,
    caption_requirements TEXT,
    content_assets_url  TEXT,
    
    -- Platform settings
    platforms       TEXT[] NOT NULL DEFAULT '{tiktok,instagram,youtube}',
    
    -- SEO
    slug            TEXT UNIQUE,
    
    -- Timing
    starts_at       TIMESTAMPTZ DEFAULT now(),
    ends_at         TIMESTAMPTZ,
    
    -- Status
    status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    
    -- Stripe
    stripe_payment_intent_id TEXT,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaigns_artist ON public.campaigns(artist_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaign_slug ON public.campaigns(slug) WHERE slug IS NOT NULL;

-- ─── Submissions ─────────────────────────────────────────────────────────────

CREATE TABLE public.submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id     UUID NOT NULL REFERENCES public.campaigns(id),
    creator_id      UUID NOT NULL REFERENCES public.users(id),
    
    content_url     TEXT NOT NULL,
    platform        TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube')),
    
    posted_at       TIMESTAMPTZ,
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    review_status   TEXT NOT NULL DEFAULT 'pending'
                    CHECK (review_status IN ('pending', 'approved', 'rejected')),
    reviewed_by     UUID REFERENCES public.users(id),
    reviewed_at     TIMESTAMPTZ,
    rejection_reason TEXT,
    
    views_at_submit INTEGER DEFAULT 0,
    views_current   INTEGER DEFAULT 0,
    views_verified  INTEGER DEFAULT 0,
    
    payout_amount_cents INTEGER,
    payout_status   TEXT NOT NULL DEFAULT 'pending'
                    CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')),
    stripe_payout_id TEXT,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_submissions_campaign ON public.submissions(campaign_id);
CREATE INDEX idx_submissions_creator ON public.submissions(creator_id);
CREATE INDEX idx_submissions_review ON public.submissions(review_status);
CREATE INDEX idx_submissions_payout ON public.submissions(payout_status);

-- ─── View Snapshots ──────────────────────────────────────────────────────────

CREATE TABLE public.view_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id   UUID NOT NULL REFERENCES public.submissions(id),
    platform        TEXT NOT NULL,
    view_count      INTEGER NOT NULL,
    snapshot_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_snapshots_submission ON public.view_snapshots(submission_id);

-- ─── Payouts ─────────────────────────────────────────────────────────────────

CREATE TABLE public.payouts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id      UUID NOT NULL REFERENCES public.users(id),
    amount_cents    INTEGER NOT NULL,
    submission_ids  UUID[] NOT NULL,
    stripe_payout_id TEXT,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_payouts_creator ON public.payouts(creator_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);

-- ─── Referrals ───────────────────────────────────────────────────────────────

CREATE TABLE public.referrals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id     UUID REFERENCES public.users(id),
    referred_email  TEXT NOT NULL,
    status          TEXT DEFAULT 'pending',
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);

-- ─── Campaign Donations ──────────────────────────────────────────────────────

CREATE TABLE public.campaign_donations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id     UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    donor_id        UUID REFERENCES public.users(id),
    donor_email     TEXT,
    amount_cents    INTEGER NOT NULL,
    message         TEXT,
    stripe_payment_intent_id TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_donations_campaign ON public.campaign_donations(campaign_id);

-- ─── Notifications ───────────────────────────────────────────────────────────

CREATE TABLE public.notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.users(id),
    type            TEXT NOT NULL CHECK (type IN ('submission', 'approval', 'rejection', 'earning', 'payout', 'system')),
    message         TEXT NOT NULL,
    read            BOOLEAN NOT NULL DEFAULT false,
    link            TEXT,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id) WHERE read = false;
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- ─── Messages ────────────────────────────────────────────────────────────────

CREATE TABLE public.messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id       UUID NOT NULL REFERENCES public.users(id),
    receiver_id     UUID NOT NULL REFERENCES public.users(id),
    campaign_id     UUID REFERENCES public.campaigns(id),
    content         TEXT NOT NULL,
    read            BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON public.messages(sender_id, receiver_id);
CREATE INDEX idx_messages_receiver_unread ON public.messages(receiver_id) WHERE read = false;

-- ─── Ratings ─────────────────────────────────────────────────────────────────

CREATE TABLE public.ratings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id   UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    reviewer_id     UUID NOT NULL REFERENCES public.users(id),
    reviewee_id     UUID NOT NULL REFERENCES public.users(id),
    rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(submission_id, reviewer_id)
);

CREATE INDEX idx_ratings_reviewee ON public.ratings(reviewee_id);

-- ─── Bugs ────────────────────────────────────────────────────────────────────

CREATE TABLE public.bugs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES public.users(id) ON DELETE SET NULL,
    description     TEXT NOT NULL,
    steps_to_reproduce TEXT,
    severity        TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status          TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'in_progress', 'fixed', 'wont_fix')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bugs_status_new ON public.bugs(status, created_at) WHERE status = 'new';

-- ─── Live Ticker ─────────────────────────────────────────────────────────────

CREATE TABLE public.live_ticker_events (
    id              SERIAL PRIMARY KEY,
    campaign_id     UUID NOT NULL REFERENCES public.campaigns(id),
    event_type      TEXT NOT NULL,
    message         TEXT NOT NULL,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticker_campaign_time ON public.live_ticker_events(campaign_id, created_at DESC);

-- ─── Email Logs ──────────────────────────────────────────────────────────────

CREATE TABLE public.email_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient       TEXT NOT NULL,
    subject         TEXT NOT NULL,
    template_name   TEXT,
    status          TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
    error           TEXT,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_logs_created ON public.email_logs(created_at DESC);

-- ─── Inbound Emails ──────────────────────────────────────────────────────────

CREATE TABLE public.inbound_emails (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mailbox         TEXT NOT NULL CHECK (mailbox IN ('info', 'support')),
    from_email      TEXT NOT NULL,
    from_name       TEXT,
    subject         TEXT NOT NULL,
    body_text       TEXT,
    body_html       TEXT,
    status          TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inbound_mailbox ON public.inbound_emails(mailbox, created_at DESC);

-- ─── Support Chats ───────────────────────────────────────────────────────────

CREATE TABLE public.support_chats (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_message    TEXT NOT NULL,
    ai_response     TEXT,
    resolved        BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Outreach Pipeline ───────────────────────────────────────────────────────

CREATE TABLE public.discovered_artists (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_name     TEXT NOT NULL,
    source          TEXT NOT NULL CHECK (source IN ('spotify_related', 'bandcamp_discover', 'bandcamp_tag', 'youtube_channel', 'reddit')),
    spotify_id      TEXT,
    bandcamp_url    TEXT,
    youtube_channel_id TEXT,
    instagram_handle TEXT,
    tiktok_handle   TEXT,
    genre           TEXT,
    is_ai_artist    BOOLEAN NOT NULL DEFAULT false,
    status          TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'audited', 'contacted', 'claimed', 'rejected', 'duplicate')),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discovered_spotify ON public.discovered_artists(spotify_id);
CREATE INDEX idx_discovered_status ON public.discovered_artists(status);
CREATE INDEX idx_discovered_ai ON public.discovered_artists(is_ai_artist) WHERE is_ai_artist = false;

CREATE TABLE public.artist_audits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discovered_artist_id UUID REFERENCES public.discovered_artists(id) ON DELETE CASCADE,
    youtube_subscribers INTEGER,
    spotify_monthly_listeners INTEGER,
    instagram_followers INTEGER,
    tiktok_followers INTEGER,
    social_links    JSONB DEFAULT '{}',
    genres          TEXT[],
    bio             TEXT,
    top_tracks      JSONB DEFAULT '[]',
    youtube_sample_videos JSONB DEFAULT '[]',
    quality_score   INTEGER,
    audit_data      JSONB DEFAULT '{}',
    audited_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audits_artist ON public.artist_audits(discovered_artist_id);

CREATE TABLE public.outreach_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discovered_artist_id UUID REFERENCES public.discovered_artists(id) ON DELETE CASCADE,
    channel         TEXT NOT NULL CHECK (channel IN ('instagram', 'tiktok', 'email')),
    message_text    TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'replied', 'failed')),
    campaign_id     UUID REFERENCES public.campaigns(id),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outreach_artist ON public.outreach_log(discovered_artist_id);
CREATE INDEX idx_outreach_status ON public.outreach_log(status);
CREATE INDEX idx_outreach_campaign ON public.outreach_log(campaign_id);

CREATE TABLE public.campaign_claims (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id     UUID REFERENCES public.campaigns(id) NOT NULL UNIQUE,
    claim_code      TEXT NOT NULL UNIQUE,
    claimed_by      UUID REFERENCES public.users(id),
    claimed_at      TIMESTAMPTZ,
    status          TEXT NOT NULL DEFAULT 'unclaimed' CHECK (status IN ('unclaimed', 'claimed')),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_claims_code ON public.campaign_claims(claim_code);
CREATE INDEX idx_claims_campaign ON public.campaign_claims(campaign_id);

CREATE TABLE public.campaign_images (
    campaign_id     UUID PRIMARY KEY REFERENCES public.campaigns(id) ON DELETE CASCADE,
    data            BYTEA NOT NULL,
    mime_type       TEXT NOT NULL DEFAULT 'image/jpeg',
    source_url      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Blog System ─────────────────────────────────────────────────────────────

CREATE TABLE public.batches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_year      TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'draft',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.batch_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id        UUID NOT NULL REFERENCES public.batches(id),
    source          TEXT,
    question_text   TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_batch_questions_batch ON public.batch_questions(batch_id);

CREATE TABLE public.batch_interviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id        UUID NOT NULL REFERENCES public.batches(id),
    source_question_id UUID REFERENCES public.batch_questions(id),
    questions       JSONB NOT NULL DEFAULT '[]',
    answers         JSONB DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'draft',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_batch_interviews_batch ON public.batch_interviews(batch_id);

CREATE TABLE public.voice_chunks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id    UUID REFERENCES public.batch_interviews(id),
    chunk_text      TEXT NOT NULL,
    embedding       extensions.vector(1536),
    session_name    TEXT,
    topic           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_voice_chunks_interview ON public.voice_chunks(interview_id);

CREATE TABLE public.blog_posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id    UUID REFERENCES public.batch_interviews(id),
    slug            TEXT UNIQUE,
    title           TEXT NOT NULL,
    excerpt         TEXT,
    content         TEXT NOT NULL,
    featured_image_url TEXT,
    seo_keywords    TEXT[],
    category        TEXT,
    status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
    publish_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_publish_at ON public.blog_posts(publish_at) WHERE status = 'scheduled';
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);

CREATE TABLE public.used_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text   TEXT NOT NULL,
    normalized_text TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'used',
    blog_post_id    UUID REFERENCES public.blog_posts(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_used_questions_status ON public.used_questions(status);
CREATE INDEX idx_used_questions_blog_post ON public.used_questions(blog_post_id);
CREATE INDEX idx_used_questions_normalized ON public.used_questions(normalized_text);

-- ─── SEO Keywords ────────────────────────────────────────────────────────────

CREATE TABLE public.keyword_buckets (
    id              SERIAL PRIMARY KEY,
    bucket_name     TEXT NOT NULL,
    keyword         TEXT NOT NULL,
    search_volume   INTEGER,
    difficulty      INTEGER,
    cpc             REAL
);

CREATE INDEX idx_kw_bucket ON public.keyword_buckets(bucket_name);

-- ─── Views ───────────────────────────────────────────────────────────────────

CREATE VIEW public.campaign_stats AS
SELECT 
    c.id,
    c.track_title,
    c.cpm_rate_cents,
    c.total_budget_cents,
    c.budget_remaining_cents,
    c.max_payout_per_submission_cents,
    c.platforms,
    c.status,
    COUNT(s.id) FILTER (WHERE s.review_status = 'approved') AS approved_submissions,
    COUNT(s.id) FILTER (WHERE s.review_status = 'pending') AS pending_submissions,
    COALESCE(SUM(s.views_verified), 0) AS total_verified_views,
    CASE 
        WHEN c.total_budget_cents > 0 
        THEN ROUND((c.total_budget_cents - c.budget_remaining_cents)::numeric / c.total_budget_cents * 100, 1)
        ELSE 0
    END AS budget_consumed_pct
FROM public.campaigns c
LEFT JOIN public.submissions s ON s.campaign_id = c.id
GROUP BY c.id;

CREATE VIEW public.creator_earnings AS
SELECT
    u.id AS creator_id,
    u.display_name,
    COUNT(s.id) AS total_submissions,
    COUNT(s.id) FILTER (WHERE s.review_status = 'approved') AS approved_submissions,
    COALESCE(SUM(s.views_verified), 0) AS total_verified_views,
    COALESCE(SUM(s.payout_amount_cents), 0) AS total_earned_cents
FROM public.users u
LEFT JOIN public.submissions s ON s.creator_id = u.id AND s.payout_status = 'paid'
WHERE u.is_creator = true
GROUP BY u.id, u.display_name;

CREATE VIEW public.creator_stats AS
SELECT
    u.id AS creator_id,
    u.display_name,
    COUNT(s.id) AS total_submissions,
    COUNT(s.id) FILTER (WHERE s.review_status = 'approved') AS approved_submissions,
    COALESCE(SUM(s.views_verified), 0) AS total_verified_views,
    COALESCE(SUM(s.payout_amount_cents), 0) AS total_earned_cents,
    CASE 
        WHEN COUNT(s.id) > 0 
        THEN ROUND(COUNT(s.id) FILTER (WHERE s.review_status = 'approved')::numeric / COUNT(s.id)::numeric, 2)
        ELSE 0
    END AS acceptance_rate
FROM public.users u
LEFT JOIN public.submissions s ON s.creator_id = u.id
WHERE u.is_creator = true
GROUP BY u.id, u.display_name;

ALTER VIEW public.creator_stats SET (security_invoker = true);

-- ─── Functions & Triggers ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_budget_remaining()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payout_status = 'paid' AND OLD.payout_status != 'paid' THEN
        UPDATE public.campaigns
        SET budget_remaining_cents = budget_remaining_cents - NEW.payout_amount_cents,
            updated_at = now()
        WHERE id = NEW.campaign_id;
        
        UPDATE public.campaigns
        SET status = 'completed',
            updated_at = now()
        WHERE id = NEW.campaign_id
          AND budget_remaining_cents <= 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_budget ON public.submissions;
CREATE TRIGGER trigger_update_budget
    AFTER UPDATE ON public.submissions
    FOR EACH ROW
    WHEN (NEW.payout_status IS DISTINCT FROM OLD.payout_status)
    EXECUTE FUNCTION public.update_budget_remaining();
