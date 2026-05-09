import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const users = await sql`SELECT id FROM users WHERE email = ${session.email}`;
    if (users.length === 0) return NextResponse.json({ submissions: [], totalPaid: 0, totalPending: 0 });

    const userId = users[0].id;

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

    const totalPaid = submissions
      .filter((s: any) => s.payout_status === 'paid')
      .reduce((sum: number, s: any) => sum + (s.payout_amount_cents || 0), 0) / 100;

    const totalPending = submissions
      .filter((s: any) => s.payout_status === 'pending' || s.review_status === 'approved')
      .reduce((sum: number, s: any) => sum + (s.payout_amount_cents || 0), 0) / 100;

    const totalEarned = submissions
      .reduce((sum: number, s: any) => sum + (s.payout_amount_cents || 0), 0) / 100;

    return NextResponse.json({
      submissions,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalPending: Math.round(totalPending * 100) / 100,
      totalEarned: Math.round(totalEarned * 100) / 100,
    });
  } catch (e: any) {
    console.error('Earnings GET error:', e.message);
    return NextResponse.json({ submissions: [], totalPaid: 0, totalPending: 0, totalEarned: 0 });
  }
}
