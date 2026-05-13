import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

/**
 * Safe migration endpoint — runs DDL without touching data.
 * Only admins can trigger this.
 */
export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const results: string[] = [];

  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook_handle TEXT`;
    results.push('facebook_handle column OK');
  } catch (e: any) { results.push(`facebook_handle: ${e.message}`); }

  try {
    await sql`CREATE TABLE IF NOT EXISTS notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id), type TEXT NOT NULL CHECK (type IN ('submission','approval','rejection','earning','payout','system')), message TEXT NOT NULL, read BOOLEAN NOT NULL DEFAULT false, link TEXT, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE read = false`;
    results.push('notifications table OK');
  } catch (e: any) { results.push(`notifications: ${e.message}`); }

  try {
    await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS required_hashtags TEXT`;
    await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS require_ftc BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS min_video_length_seconds INTEGER`;
    await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS caption_requirements TEXT`;
    await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ`;
    await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'`;
    results.push('campaign metadata columns OK');
  } catch (e: any) { results.push(`campaign columns: ${e.message}`); }

  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ`;
    results.push('user verification columns OK');
  } catch (e: any) { results.push(`campaign columns: ${e.message}`); }

  try {
    await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS rejection_feedback TEXT`;
    results.push('rejection_feedback column OK');
  } catch (e: any) { results.push(`rejection_feedback: ${e.message}`); }

  try {
    await sql`CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sender_id UUID NOT NULL REFERENCES users(id),
      receiver_id UUID NOT NULL REFERENCES users(id),
      campaign_id UUID REFERENCES campaigns(id),
      content TEXT NOT NULL,
      read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON messages(receiver_id) WHERE read = false`;
    results.push('messages table OK');
  } catch (e: any) { results.push(`messages: ${e.message}`); }

  try {
    await sql`CREATE TABLE IF NOT EXISTS campaign_donations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      donor_id UUID REFERENCES users(id) ON DELETE SET NULL,
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      donor_name TEXT,
      message TEXT,
      anonymous BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_donations_campaign ON campaign_donations(campaign_id)`;
    results.push('campaign_donations table OK');
  } catch (e: any) { results.push(`campaign_donations: ${e.message}`); }

  try {
    await sql`CREATE TABLE IF NOT EXISTS email_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      sent BOOLEAN NOT NULL DEFAULT false,
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC)`;
    results.push('email_logs table OK');
  } catch (e: any) { results.push(`email_logs: ${e.message}`); }

  try {
    await sql`CREATE TABLE IF NOT EXISTS inbound_emails (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      mailbox TEXT NOT NULL CHECK (mailbox IN ('info', 'support')),
      from_address TEXT NOT NULL,
      to_address TEXT NOT NULL,
      subject TEXT NOT NULL,
      body_html TEXT,
      body_text TEXT,
      raw_headers JSONB DEFAULT '{}',
      read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_inbound_mailbox ON inbound_emails(mailbox, created_at DESC)`;
    results.push('inbound_emails table OK');
  } catch (e: any) { results.push(`inbound_emails: ${e.message}`); }

  try {
    await sql`CREATE TABLE IF NOT EXISTS support_chats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_message TEXT NOT NULL,
      bot_reply TEXT,
      reply_source TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
    results.push('support_chats table OK');
  } catch (e: any) { results.push(`support_chats: ${e.message}`); }

  try {
    await sql`CREATE TABLE IF NOT EXISTS ratings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      reviewer_id UUID NOT NULL REFERENCES users(id),
      reviewee_id UUID NOT NULL REFERENCES users(id),
      reviewer_role TEXT NOT NULL CHECK (reviewer_role IN ('artist', 'creator')),
      score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
      comment TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(submission_id, reviewer_id)
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ratings_reviewee ON ratings(reviewee_id)`;
    results.push('ratings table OK');
  } catch (e: any) { results.push(`ratings: ${e.message}`); }

  try {
    await sql`CREATE TABLE IF NOT EXISTS bugs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      description TEXT NOT NULL,
      steps_to_reproduce TEXT,
      severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
      status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'fixed', 'closed')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
    results.push('bugs table OK');
  } catch (e: any) { results.push(`bugs: ${e.message}`); }

  // ── Outreach Pipeline (multi-channel discovery → audit → campaign → claim) ──
  try {
    await sql`CREATE TABLE IF NOT EXISTS discovered_artists (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      artist_name TEXT NOT NULL,
      spotify_id TEXT UNIQUE,
      genres TEXT[] DEFAULT '{}',
      monthly_listeners INTEGER DEFAULT 0,
      followers INTEGER DEFAULT 0,
      social_links JSONB DEFAULT '{}',
      latest_track_name TEXT,
      latest_track_spotify_url TEXT,
      latest_track_cover_url TEXT,
      latest_release_date DATE,
      discovery_source TEXT,
      ai_signals_detected INTEGER DEFAULT 0,
      is_ai_artist BOOLEAN DEFAULT false,
      status TEXT DEFAULT 'discovered',
      discovered_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_discovered_spotify ON discovered_artists(spotify_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_discovered_status ON discovered_artists(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_discovered_ai ON discovered_artists(is_ai_artist) WHERE is_ai_artist = false`;
    results.push('discovered_artists table OK');
  } catch (e: any) { results.push(`discovered_artists: ${e.message}`); }

  try {
    await sql`CREATE TABLE IF NOT EXISTS artist_audits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      discovered_artist_id UUID REFERENCES discovered_artists(id) ON DELETE CASCADE,
      spotify_monthly_listeners INTEGER,
      spotify_track_streams INTEGER,
      youtube_video_url TEXT,
      youtube_video_views INTEGER,
      spotify_embed_url TEXT,
      artist_bio TEXT,
      recommended_cpm_cents INTEGER DEFAULT 10,
      recommended_budget_cents INTEGER DEFAULT 10000,
      instagram_handle TEXT,
      instagram_followers INTEGER,
      instagram_last_post_date DATE,
      instagram_engagement_notes TEXT,
      tiktok_handle TEXT,
      tiktok_followers INTEGER,
      tiktok_avg_views INTEGER,
      email_address TEXT,
      website_url TEXT,
      hashtags TEXT[] DEFAULT '{}',
      personal_angle TEXT,
      audited_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audits_artist ON artist_audits(discovered_artist_id)`;
    results.push('artist_audits table OK');
  } catch (e: any) { results.push(`artist_audits: ${e.message}`); }

  try {
    await sql`CREATE TABLE IF NOT EXISTS outreach_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      discovered_artist_id UUID REFERENCES discovered_artists(id) ON DELETE CASCADE,
      campaign_id UUID REFERENCES campaigns(id),
      channel TEXT NOT NULL,
      message_type TEXT NOT NULL DEFAULT 'initial',
      message_text TEXT,
      status TEXT DEFAULT 'pending',
      delivered_at TIMESTAMPTZ,
      read_at TIMESTAMPTZ,
      replied_at TIMESTAMPTZ,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_outreach_artist ON outreach_log(discovered_artist_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_outreach_status ON outreach_log(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_outreach_campaign ON outreach_log(campaign_id)`;
    results.push('outreach_log table OK');
  } catch (e: any) { results.push(`outreach_log: ${e.message}`); }

  try {
    await sql`CREATE TABLE IF NOT EXISTS campaign_claims (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id UUID REFERENCES campaigns(id) NOT NULL UNIQUE,
      discovered_artist_id UUID REFERENCES discovered_artists(id),
      claim_code TEXT NOT NULL UNIQUE,
      verification_method TEXT,
      claimed_by_user_id UUID REFERENCES users(id),
      claimed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_claims_code ON campaign_claims(claim_code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_claims_campaign ON campaign_claims(campaign_id)`;
    results.push('campaign_claims table OK');
  } catch (e: any) { results.push(`campaign_claims: ${e.message}`); }

  try {
    await sql`CREATE TABLE IF NOT EXISTS campaign_images (
      campaign_id UUID PRIMARY KEY REFERENCES campaigns(id) ON DELETE CASCADE,
      data BYTEA NOT NULL,
      mime TEXT NOT NULL DEFAULT 'image/jpeg'
    )`;
    results.push('campaign_images table OK');
  } catch (e: any) { results.push(`campaign_images: ${e.message}`); }

  try {
    await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_unclaimed BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS claimed_by_user_id UUID REFERENCES users(id)`;
    await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ`;
    results.push('campaigns unclaimed columns OK');
  } catch (e: any) { results.push(`campaigns unclaimed: ${e.message}`); }

  return NextResponse.json({ migrated: true, results });
}
