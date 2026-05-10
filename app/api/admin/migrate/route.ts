import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminRequest } from '@/lib/admin';

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
  } catch (e: any) { results.push(`rejection_feedback: ${e.message}`); }
  } catch (e: any) { results.push(`campaign columns: ${e.message}`); }

  return NextResponse.json({ migrated: true, results });
}
