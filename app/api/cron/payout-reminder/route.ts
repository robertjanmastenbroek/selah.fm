import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/payout-reminder
 * Daily cron: checks all users with approved submissions but no Stripe Connect.
 * Creates a notification for each so they see it in their bell.
 */
export async function POST(request: Request) {
  try {
    const auth = request.headers.get('authorization') || '';
    const secret = new URL(request.url).searchParams.get('secret');
    const expected = process.env.CRON_SECRET;
    if (auth !== `Bearer ${expected}` && secret !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pending = await sql`
      SELECT DISTINCT u.id, u.display_name, u.email
      FROM submissions s
      JOIN users u ON u.id = s.creator_id
      WHERE s.review_status = 'approved'
        AND s.payout_status = 'processing'
        AND (u.stripe_connect_id IS NULL OR u.stripe_connect_id = '')
        AND (u.stripe_account_id IS NULL OR u.stripe_account_id = '')
        AND (u.stripe_onboarding_complete IS NULL OR u.stripe_onboarding_complete = false)
      ORDER BY u.id
    `;

    let created = 0;
    for (const creator of pending) {
      const [existing] = await sql`
        SELECT id FROM notifications
        WHERE user_id = ${creator.id}
          AND type = 'payout_reminder'
          AND created_at > NOW() - INTERVAL '24 hours'
        LIMIT 1
      `;

      if (!existing) {
        await sql`
          INSERT INTO notifications (user_id, type, message, link)
          VALUES (${creator.id}, 'payout',
            'You have approved earnings waiting! Connect Stripe to receive payouts to your bank account.',
            '/dashboard?tab=payout'
          )
        `;
        created++;
      }
    }

    return NextResponse.json({
      ok: true,
      checked: pending.length,
      notifications_created: created,
    });
  } catch (e: any) {
    console.error('[cron/payout-reminder] Error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
