import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60s

/**
 * GET /api/stats — public stats for homepage counters.
 * Returns aggregated platform metrics for social proof.
 */
export async function GET() {
  try {
    // User counts
    const [artistCount] = await sql`SELECT COUNT(*)::int as count FROM users WHERE is_artist = true`;
    const [creatorCount] = await sql`SELECT COUNT(*)::int as count FROM users WHERE is_creator = true`;

    // Funded campaigns (those with actual budget — the honest count)
    const [campaignCount] = await sql`SELECT COUNT(*)::int as count FROM campaigns WHERE status = 'active' AND total_budget_cents > 0`;

    // Submission counts
    const [submissionCount] = await sql`SELECT COUNT(*)::int as count FROM submissions`;

    // Verified views (all time)
    const [totalViews] = await sql`
      SELECT COALESCE(SUM(views_verified)::bigint, 0) as total 
      FROM submissions WHERE views_verified > 0
    `;

    // Payouts — include both paid and processing (funds have left the campaign)
    const [payouts] = await sql`
      SELECT 
        COALESCE(SUM(payout_amount_cents) FILTER (WHERE payout_status = 'paid')::bigint, 0) as paid,
        COALESCE(SUM(payout_amount_cents) FILTER (WHERE payout_status = 'processing')::bigint, 0) as processing,
        COALESCE(SUM(payout_amount_cents) FILTER (WHERE payout_status IN ('paid', 'processing'))::bigint, 0) as total
      FROM submissions
    `;

    // Approved submissions (active content)
    const [approved] = await sql`
      SELECT COUNT(*)::int as count FROM submissions WHERE review_status = 'approved'
    `;

    // Donations
    let donorCount = 0;
    let totalDonatedCents = 0;
    try {
      const [donors] = await sql`
        SELECT 
          COUNT(DISTINCT COALESCE(donor_name, donor_email, 'anonymous'))::int as count,
          COALESCE(SUM(amount_cents)::bigint, 0) as total
        FROM campaign_donations
      `;
      donorCount = donors?.count || 0;
      totalDonatedCents = Number(donors?.total || 0);
    } catch { /* table may not exist */ }

    // Total deposited/funded (campaign budgets)
    let totalDepositedCents = 0;
    try {
      const [deposits] = await sql`
        SELECT COALESCE(SUM(total_budget_cents)::bigint, 0) as total
        FROM campaigns WHERE total_budget_cents > 0
      `;
      totalDepositedCents = Number(deposits?.total || 0);
    } catch (e: any) { console.error('Unhandled error in api/stats/route.ts:', e); }

    return NextResponse.json({
      artists: artistCount?.count || 0,
      creators: creatorCount?.count || 0,
      activeCampaigns: campaignCount?.count || 0,
      totalSubmissions: submissionCount?.count || 0,
      approvedSubmissions: approved?.count || 0,
      totalViews: Number(totalViews?.total || 0),
      // Payout breakdown
      totalPaidCents: Number(payouts?.total || 0),       // Everything that's been paid or is processing
      paidCents: Number(payouts?.paid || 0),               // Completed payouts
      processingCents: Number(payouts?.processing || 0),   // Payouts in transit
      // Funding
      totalDepositedCents,
      donors: donorCount,
      totalDonatedCents,
    });
  } catch (e: any) {
    console.error('Stats API error:', e.message);
    return NextResponse.json({
      artists: 0, creators: 0, activeCampaigns: 0,
      totalSubmissions: 0, approvedSubmissions: 0,
      totalViews: 0, totalPaidCents: 0, paidCents: 0, processingCents: 0,
      totalDepositedCents: 0, donors: 0, totalDonatedCents: 0,
    });
  }
}
