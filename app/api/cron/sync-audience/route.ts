import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { addToAudience } from '@/lib/email-outreach';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/sync-audience?secret=...
 * 
 * Syncs ALL platform users to the Resend audience.
 * Safe to rerun — Resend deduplicates by email.
 * Runs weekly via dispatcher.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const apiKey = process.env.RESEND_API_KEY;
  if (!audienceId || !apiKey) {
    return NextResponse.json({ error: 'RESEND_AUDIENCE_ID or RESEND_API_KEY not configured' }, { status: 500 });
  }

  try {
    // Get ALL users (not just artists)
    const users = await sql`
      SELECT id, email, display_name
      FROM users
      WHERE email IS NOT NULL AND email != ''
      ORDER BY created_at DESC
    `;

    let added = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        await addToAudience(user.email, user.display_name || 'User');
        added++;
      } catch (e: any) {
        errors.push(`${user.email}: ${e.message}`);
      }
    }

    return NextResponse.json({
      total: users.length,
      added,
      errors: errors.slice(0, 10),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
