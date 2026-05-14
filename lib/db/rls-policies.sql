-- selah.fm — Row Level Security Policies for Supabase
-- Enables Supabase Auth users to access only their own data.
-- Run after schema creation in the Supabase SQL Editor.

-- ── Enable RLS on all tables ────────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.view_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- ── Users ───────────────────────────────────────────────────────────────────
-- Users can read their own profile; admins can read all.
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Admin bypass: admins can read/write all users
CREATE POLICY "Admins can read all users"
  ON public.users FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() 
    AND email = ANY(ARRAY['your-admin@email.com']) -- replace with actual admin emails
  ));

-- ── Campaigns ───────────────────────────────────────────────────────────────
-- Anyone can read active/draft campaigns (public browsing).
-- Artists can create/update their own campaigns.
CREATE POLICY "Anyone can read public campaigns"
  ON public.campaigns FOR SELECT
  USING (status IN ('active', 'draft'));

CREATE POLICY "Artists can manage own campaigns"
  ON public.campaigns FOR ALL
  USING (artist_id = auth.uid());

CREATE POLICY "Admins can manage all campaigns"
  ON public.campaigns FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() 
    AND email = ANY(ARRAY['your-admin@email.com'])
  ));

-- ── Submissions ─────────────────────────────────────────────────────────────
-- Creators can read/create their own submissions.
-- Campaign artists can read submissions on their campaigns.
CREATE POLICY "Creators can manage own submissions"
  ON public.submissions FOR ALL
  USING (creator_id = auth.uid());

CREATE POLICY "Artists can read submissions on their campaigns"
  ON public.submissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE id = submissions.campaign_id AND artist_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all submissions"
  ON public.submissions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() 
    AND email = ANY(ARRAY['your-admin@email.com'])
  ));

-- ── Notifications ───────────────────────────────────────────────────────────
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ── Messages ────────────────────────────────────────────────────────────────
CREATE POLICY "Users can read own messages"
  ON public.messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- ── Payouts ─────────────────────────────────────────────────────────────────
CREATE POLICY "Creators can read own payouts"
  ON public.payouts FOR SELECT
  USING (creator_id = auth.uid());

-- ── Non-sensitive tables (public read, admin write) ─────────────────────────
-- These tables are used by the outreach pipeline (cron jobs) and admin dashboard.
-- Cron jobs use the service_role key, bypassing RLS.

ALTER TABLE public.discovered_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_ticker_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.used_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_buckets ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read; only admins/service_role can write
CREATE POLICY "Authenticated can read blog_posts"
  ON public.blog_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can read live_ticker"
  ON public.live_ticker_events FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can read campaign_images"
  ON public.campaign_images FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can read campaign_claims"
  ON public.campaign_claims FOR SELECT
  USING (true);
