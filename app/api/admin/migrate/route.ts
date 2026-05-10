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
    // Add facebook_handle column if missing
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook_handle TEXT`;
    results.push('facebook_handle column OK');
  } catch (e: any) { results.push(`facebook_handle: ${e.message}`); }

  try {
    // Create notifications table if missing
    await sql`CREATE TABLE IF NOT EXISTS notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, type TEXT NOT NULL, message TEXT NOT NULL, read BOOLEAN NOT NULL DEFAULT false, link TEXT, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
    results.push('notifications table OK');
  } catch (e: any) { results.push(`notifications: ${e.message}`); }

  try {
    // Ensure all required columns exist
    await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS required_hashtags TEXT`;
    await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS require_ftc BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS min_video_length_seconds INTEGER`;
    await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS caption_requirements TEXT`;
    results.push('campaign metadata columns OK');

  try {
    await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS rejection_feedback TEXT`;
    results.push('rejection_feedback column OK');

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
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id))`;
    results.push('messages table OK');
  } catch (e: any) { results.push(`messages: ${e.message}`); }
  } catch (e: any) { results.push(`rejection_feedback: ${e.message}`); }
  } catch (e: any) { results.push(`campaign columns: ${e.message}`); }

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
    await sql`CREATE INDEX IF NOT EXISTS idx_bugs_status_new ON bugs(status, created_at) WHERE status = 'new'`;
    results.push('bugs table OK');
  } catch (e: any) { results.push(`bugs: ${e.message}`); }

  return NextResponse.json({ migrated: true, results });
}
