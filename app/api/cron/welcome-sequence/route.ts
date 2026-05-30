import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/engagement';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Welcome email sequence cron.
 * Sends welcome email #2 and #3 to users who received #1.
 * Triggered when reengage_at timestamp is reached (set by previous email).
 * 
 * GET /api/cron/welcome-sequence
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
    // Find users due for next welcome email (reengage_at <= now, not yet at max emails)
    const candidates = await sql`
      SELECT id, email, display_name, user_type, welcome_emails_sent
      FROM users
      WHERE reengage_at IS NOT NULL
        AND reengage_at <= NOW()
        AND welcome_emails_sent > 0
        AND welcome_emails_sent < 3
        AND email IS NOT NULL
        AND email != 'info@selah.fm'
      ORDER BY reengage_at ASC
      LIMIT 20
    `;

    results.checked = candidates.length;

    for (const user of candidates) {
      try {
        const role: 'artist' | 'creator' = user.user_type === 'artist' ? 'artist' : 'creator';
        const name = user.display_name || user.email.split('@')[0];
        const nextIndex = user.welcome_emails_sent; // 1 → email #2, 2 → email #3

        const ok = await sendWelcomeEmail(user.id, user.email, name, role, nextIndex);
        if (ok) {
          results.sent++;
        } else {
          results.errors++;
        }
      } catch {
        results.errors++;
      }
    }

    return NextResponse.json({ results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, results }, { status: 500 });
  }
}
