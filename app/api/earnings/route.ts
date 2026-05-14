import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const userId = session.id;

    const submissions = await sql`
      SELECT 
        s.id, s.content_url, s.platform, s.review_status, s.payout_status,
        s.views_verified, s.payout_amount_cents, s.submitted_at,
        c.track_title, c.cpm_rate_cents
      FROM submissions s
      JOIN campaigns c ON c.id = s.campaign_id
      WHERE s.creator_id = ${userId}
      ORDER BY s.submitted_at DESC
    `;

    // All totals in CENTS — consistent with payout_amount_cents in submissions
    const totalPaidCents = submissions
      .filter((s: any) => s.payout_status === 'paid')
      .reduce((sum: number, s: any) => sum + (s.payout_amount_cents || 0), 0);

    const totalPendingCents = submissions
      .filter((s: any) => s.payout_status === 'pending' || s.review_status === 'approved')
      .reduce((sum: number, s: any) => sum + (s.payout_amount_cents || 0), 0);

    const totalEarnedCents = submissions
      .reduce((sum: number, s: any) => sum + (s.payout_amount_cents || 0), 0);

    return NextResponse.json({
      submissions,
      totalPaid: totalPaidCents,
      totalPending: totalPendingCents,
      totalEarned: totalEarnedCents,
    });
  } catch (e: any) {
    console.error('Earnings GET error:', e.message);
    return NextResponse.json({ submissions: [], totalPaid: 0, totalPending: 0, totalEarned: 0 });
  }
}
