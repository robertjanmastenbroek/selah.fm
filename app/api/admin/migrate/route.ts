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
    results.push('campaign metadata columns OK');
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

  return NextResponse.json({ migrated: true, results });
}
