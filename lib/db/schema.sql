-- selah.fm — PostgreSQL Schema
-- CPM marketplace for music promotion
-- 
-- Core entities: users, campaigns, submissions, payouts
-- Key features: max_payout cap, 1-hour submit window, manual artist review

-- ─── Users ──────────────────────────────────────────────────────────────────

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    user_type       TEXT NOT NULL CHECK (user_type IN ('artist', 'creator')),
    display_name    TEXT NOT NULL,
    
    -- Creator-specific
    tiktok_handle   TEXT,
    instagram_handle TEXT,
    youtube_handle  TEXT,
    facebook_handle TEXT,
    
    -- Creator profile (marketplace directory)
    bio                     TEXT,
    genres                  TEXT,           -- comma-separated: "pop,electronic,indie"
    preferred_cpm_cents     INTEGER,
    profile_image_url       TEXT,
    acceptance_rate         REAL DEFAULT 0, -- computed: approved / total submissions
    
    -- Stripe
    stripe_customer_id      TEXT,
    stripe_connect_id       TEXT,   -- for creator payouts
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);

-- ─── Campaigns ───────────────────────────────────────────────────────────────

CREATE TABLE campaigns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id     UUID NOT NULL REFERENCES users(id),
    
    -- Track info
    track_title     TEXT NOT NULL,
    track_url       TEXT NOT NULL,       -- Spotify / SoundCloud / direct link
    cover_art_url   TEXT,
    preview_clip_url TEXT,               -- 30-second clip for creators
    
    -- Budget & pricing
    cpm_rate_cents  INTEGER NOT NULL,    -- e.g. 300 = $3.00 per 1,000 views
    total_budget_cents INTEGER NOT NULL, -- total escrow amount
    max_payout_per_submission_cents INTEGER NOT NULL,  -- cap per video (Whop: protects budget)
    min_payout_per_submission_cents INTEGER NOT NULL DEFAULT 0,  -- min views to reach review (Whop: $0 = all reviewed)
    flat_fee_bonus_cents INTEGER DEFAULT 0,   -- optional extra per approved submission
    budget_remaining_cents INTEGER NOT NULL,  -- auto-calculated
    
    -- Requirements (brand sets rules upfront)
    requirements        TEXT,           -- quality, messaging, prohibitions, format
    required_hashtags   TEXT,           -- hashtags creators MUST include
    require_ftc         BOOLEAN DEFAULT false,  -- require FTC disclosure hashtag
    min_video_length_seconds INTEGER,  -- minimum video duration
    caption_requirements TEXT,          -- required caption format/text
    content_assets_url  TEXT,           -- link to content folder / Google Drive
    
    -- Platform settings
    platforms       TEXT[] NOT NULL DEFAULT '{tiktok,instagram,youtube}',
    
    -- Status
    status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    
    -- Stripe
    stripe_payment_intent_id TEXT,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaigns_artist ON campaigns(artist_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- ─── Submissions ─────────────────────────────────────────────────────────────

CREATE TABLE submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id     UUID NOT NULL REFERENCES campaigns(id),
    creator_id      UUID NOT NULL REFERENCES users(id),
    
    -- Content links
    content_url     TEXT NOT NULL,       -- TikTok/IG/YT link
    platform        TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube')),
    
    -- Timing
    posted_at       TIMESTAMPTZ,         -- when creator says they published
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Review (Whop: brand approves or rejects based on requirements)
    review_status   TEXT NOT NULL DEFAULT 'pending'
                    CHECK (review_status IN ('pending', 'approved', 'rejected')),
    reviewed_by     UUID REFERENCES users(id),
    reviewed_at     TIMESTAMPTZ,
    rejection_reason TEXT,               -- why rejected (didn't meet requirements)
    
    -- View tracking
    views_at_submit INTEGER DEFAULT 0,   -- view count when submitted (for delta calc)
    views_current   INTEGER DEFAULT 0,   -- auto-updated via API checks
    views_verified  INTEGER DEFAULT 0,   -- final verified count at payout
    
    -- Payout
    payout_amount_cents INTEGER,         -- calculated: min(views * cpm, max_payout)
    payout_status   TEXT NOT NULL DEFAULT 'pending'
                    CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')),
    stripe_payout_id TEXT,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_submissions_campaign ON submissions(campaign_id);
CREATE INDEX idx_submissions_creator ON submissions(creator_id);
CREATE INDEX idx_submissions_review ON submissions(review_status);
CREATE INDEX idx_submissions_payout ON submissions(payout_status);

-- ─── View Snapshots (for verification audit trail) ───────────────────────────

CREATE TABLE view_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id   UUID NOT NULL REFERENCES submissions(id),
    platform        TEXT NOT NULL,
    view_count      INTEGER NOT NULL,
    snapshot_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_snapshots_submission ON view_snapshots(submission_id);

-- ─── Payouts (aggregated per creator) ────────────────────────────────────────

CREATE TABLE payouts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id      UUID NOT NULL REFERENCES users(id),
    amount_cents    INTEGER NOT NULL,
    submission_ids  UUID[] NOT NULL,
    stripe_payout_id TEXT,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_payouts_creator ON payouts(creator_id);
CREATE TABLE IF NOT EXISTS referrals (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), referrer_id UUID REFERENCES users(id), referred_email TEXT NOT NULL, status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT now());
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);

CREATE INDEX idx_payouts_status ON payouts(status);

-- ─── Views (materialized or cached) ──────────────────────────────────────────

-- Campaign stats (for creator browsing)
CREATE VIEW campaign_stats AS
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
    -- Budget urgency: how much of budget is consumed
    CASE 
        WHEN c.total_budget_cents > 0 
        THEN ROUND((c.total_budget_cents - c.budget_remaining_cents)::numeric / c.total_budget_cents * 100, 1)
        ELSE 0
    END AS budget_consumed_pct
FROM campaigns c
LEFT JOIN submissions s ON s.campaign_id = c.id
GROUP BY c.id;

-- Creator earnings summary
CREATE VIEW creator_earnings AS
SELECT
    u.id AS creator_id,
    u.display_name,
    COUNT(s.id) AS total_submissions,
    COUNT(s.id) FILTER (WHERE s.review_status = 'approved') AS approved_submissions,
    COALESCE(SUM(s.views_verified), 0) AS total_verified_views,
    COALESCE(SUM(s.payout_amount_cents), 0) AS total_earned_cents
FROM users u
LEFT JOIN submissions s ON s.creator_id = u.id AND s.payout_status = 'paid'
WHERE u.user_type = 'creator'
GROUP BY u.id, u.display_name;

-- Creator stats (for marketplace directory — includes acceptance rate)
CREATE VIEW creator_stats AS
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
FROM users u
LEFT JOIN submissions s ON s.creator_id = u.id
WHERE u.user_type = 'creator'
GROUP BY u.id, u.display_name;

-- ─── Functions ───────────────────────────────────────────────────────────────

-- Auto-update budget_remaining when a payout is processed
CREATE OR REPLACE FUNCTION update_budget_remaining()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payout_status = 'paid' AND OLD.payout_status != 'paid' THEN
        UPDATE campaigns
        SET budget_remaining_cents = budget_remaining_cents - NEW.payout_amount_cents,
            updated_at = now()
        WHERE id = NEW.campaign_id;
        
        -- Auto-pause campaign if budget exhausted
        UPDATE campaigns
        SET status = 'completed',
            updated_at = now()
        WHERE id = NEW.campaign_id
          AND budget_remaining_cents <= 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_budget
    AFTER UPDATE ON submissions
    FOR EACH ROW
    WHEN (NEW.payout_status IS DISTINCT FROM OLD.payout_status)
    EXECUTE FUNCTION update_budget_remaining();

-- ─── Notifications ───────────────────────────────────────────────────────────

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    type            TEXT NOT NULL CHECK (type IN ('submission', 'approval', 'rejection', 'earning', 'payout', 'system')),
    message         TEXT NOT NULL,
    read            BOOLEAN NOT NULL DEFAULT false,
    link            TEXT,                   -- relative URL e.g. '/review' or '/earnings'
    metadata        JSONB DEFAULT '{}',     -- { campaign_id, submission_id, amount_cents }
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ─── Seed data (for development) ─────────────────────────────────────────────

-- Example campaign
-- INSERT INTO campaigns (artist_id, track_title, track_url, cpm_rate_cents, total_budget_cents, max_payout_per_submission_cents, budget_remaining_cents)
-- VALUES ('...', 'Example Track', 'https://spotify.com/...', 300, 1000000, 100000, 1000000);