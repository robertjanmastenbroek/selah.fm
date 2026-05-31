import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { sendReengageEmail } from '@/lib/engagement';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Re-engagement cron.
 * Finds users who signed up 3+ days ago with no meaningful action
 * (no claims, no submissions, no onboarding) and sends a re-engagement email.
 * 
 * Rules:
 * - One re-engagement email per 14-day window (controlled by reengage_at)
 * - Only if user hasn't completed onboarding or taken any action
 * - Max 5 per run to stay within Resend free tier
 * 
 * GET /api/cron/reengage
 * Optional: ?secret=CRON_SECRET for auth
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const results = { checked: 0, sent: 0, errors: 0 };

  try {
    // Find dormant users: signed up 3+ days ago, no onboarding, no re-engagement sent recently
    const candidates = await sql`
      SELECT u.id, u.email, u.display_name, u.created_at
      FROM users u
      WHERE u.email NOT IN ('info@selah.fm', 'motomotosings@gmail.com', 'mastenbroekrobertjan@gmail.com')
        AND u.email IS NOT NULL
        AND u.created_at < NOW() - INTERVAL '3 days'
        AND (u.onboarded_at IS NULL)
        AND (u.reengage_at IS NULL OR u.reengage_at <= NOW())
        AND u.welcome_emails_sent = 0
        AND NOT EXISTS (
          SELECT 1 FROM campaign_claims cc WHERE cc.claimed_by = u.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM submissions s WHERE s.creator_id = u.id
        )
      ORDER BY u.created_at ASC
      LIMIT 5
    `;

    results.checked = candidates.length;

    for (const user of candidates) {
      try {
        const daysSinceSignup = Math.floor(
          (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        const name = user.display_name || (user.email || 'there').split('@')[0];

        const ok = await sendReengageEmail(user.id, user.email, name, daysSinceSignup);
        if (ok) results.sent++;
        else results.errors++;
      } catch {
        results.errors++;
      }
    }

    return NextResponse.json({ results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, results }, { status: 500 });
  }
}
