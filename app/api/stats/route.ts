import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60s

export async function GET() {
  try {
    const [artistCount] = await sql`
      SELECT COUNT(*)::int as count FROM users WHERE user_type = 'artist'
    `;
    const [creatorCount] = await sql`
      SELECT COUNT(*)::int as count FROM users WHERE user_type = 'creator'
    `;
    const [campaignCount] = await sql`
      SELECT COUNT(*)::int as count FROM campaigns WHERE status = 'active'
    `;
    const [submissionCount] = await sql`
      SELECT COUNT(*)::int as count FROM submissions
    `;
    const [totalViews] = await sql`
      SELECT COALESCE(SUM(views_verified)::bigint, 0) as total FROM submissions WHERE views_verified > 0
    `;
    const [totalPaid] = await sql`
      SELECT COALESCE(SUM(payout_amount_cents)::bigint, 0) as total FROM submissions WHERE payout_status = 'paid'
    `;

    return NextResponse.json({
      artists: artistCount?.count || 0,
      creators: creatorCount?.count || 0,
      activeCampaigns: campaignCount?.count || 0,
      totalSubmissions: submissionCount?.count || 0,
      totalViews: Number(totalViews?.total || 0),
      totalPaidCents: Number(totalPaid?.total || 0),
    });
  } catch {
    return NextResponse.json({
      artists: 0,
      creators: 0,
      activeCampaigns: 0,
      totalSubmissions: 0,
      totalViews: 0,
      totalPaidCents: 0,
    });
  }
}
