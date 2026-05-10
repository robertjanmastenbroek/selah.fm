import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  try {
    const [users, campaigns, submissions, payouts] = await Promise.all([
      sql`SELECT count(*) FROM users`,
      sql`SELECT count(*) FROM campaigns`,
      sql`SELECT count(*) FROM submissions`,
      sql`SELECT count(*) FROM submissions WHERE payout_status = 'paid'`,
    ]);

    const paidCount = parseInt(payouts[0].count);
    const totalRevenue = await sql`SELECT COALESCE(SUM(payout_amount_cents),0) as total FROM submissions WHERE payout_status = 'paid'`;
    const activeCampaigns = await sql`SELECT count(*) FROM campaigns WHERE status = 'active'`;
    const pendingSubmissions = await sql`SELECT count(*) FROM submissions WHERE review_status = 'pending'`;

    return NextResponse.json({
      users: parseInt(users[0].count),
      campaigns: parseInt(campaigns[0].count),
      activeCampaigns: parseInt(activeCampaigns[0].count),
      submissions: parseInt(submissions[0].count),
      pendingSubmissions: parseInt(pendingSubmissions[0].count),
      paidPayouts: paidCount,
      totalPaidCents: parseInt(totalRevenue[0].total || '0'),
      platformRevenueCents: Math.round(parseInt(totalRevenue[0].total || '0') * 0.25),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
