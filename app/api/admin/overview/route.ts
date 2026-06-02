import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  try {
    const [users, campaigns, submissions, budgets, payoutBreakdown, reviewBreakdown] = await Promise.all([
      sql`SELECT count(*)::int as c FROM users`,
      sql`SELECT count(*)::int as c FROM campaigns`,
      sql`SELECT count(*)::int as c FROM submissions`,
      sql`SELECT COALESCE(SUM(total_budget_cents)::bigint, 0) as deposited, COALESCE(SUM(budget_remaining_cents)::bigint, 0) as remaining FROM campaigns`,
      sql`
        SELECT 
          COALESCE(SUM(payout_amount_cents) FILTER (WHERE payout_status = 'paid')::bigint, 0) as paid,
          COALESCE(SUM(payout_amount_cents) FILTER (WHERE payout_status = 'processing')::bigint, 0) as processing,
          COUNT(*) FILTER (WHERE payout_status = 'paid')::int as paid_count,
          COUNT(*) FILTER (WHERE payout_status = 'processing')::int as processing_count
        FROM submissions
      `,
      sql`
        SELECT 
          COUNT(*) FILTER (WHERE review_status = 'pending')::int as pending,
          COUNT(*) FILTER (WHERE review_status = 'approved')::int as approved,
          COUNT(*) FILTER (WHERE review_status = 'rejected')::int as rejected
        FROM submissions
      `,
    ]);

    const activeCampaigns = await sql`SELECT count(*)::int as c FROM campaigns WHERE status = 'active'`;

    const totalDeposited = Number(budgets[0]?.deposited || 0);
    const budgetRemaining = Number(budgets[0]?.remaining || 0);
    const budgetSpent = totalDeposited - budgetRemaining;

    const paidPayouts = Number(payoutBreakdown[0]?.paid || 0);
    const processingPayouts = Number(payoutBreakdown[0]?.processing || 0);
    const paidCount = payoutBreakdown[0]?.paid_count || 0;
    const processingCount = payoutBreakdown[0]?.processing_count || 0;
    const totalPaidOut = paidPayouts + processingPayouts;

    // Platform revenue: 20% fee on artist CPM. 
    // The correct calculation: platform_fee = total_deposited * (0.20 / 1.20)
    // Since the 20% is added ON TOP of CPM (artist pays CPM × 1.20)
    const platformRevenueCents = Math.round(totalDeposited * (0.20 / 1.20));

    return NextResponse.json({
      // User & content counts
      users: users[0]?.c || 0,
      campaigns: campaigns[0]?.c || 0,
      activeCampaigns: activeCampaigns[0]?.c || 0,
      submissions: submissions[0]?.c || 0,

      // Review pipeline
      pendingReviews: reviewBreakdown[0]?.pending || 0,
      approvedReviews: reviewBreakdown[0]?.approved || 0,
      rejectedReviews: reviewBreakdown[0]?.rejected || 0,

      // Money flow
      totalDepositedCents: totalDeposited,
      budgetRemainingCents: budgetRemaining,
      budgetSpentCents: budgetSpent,

      // Payouts
      paidPayouts: paidCount,
      processingPayouts: processingCount,
      paidPayoutsCents: paidPayouts,
      processingPayoutsCents: processingPayouts,
      totalPaidOutCents: totalPaidOut,

      // Platform
      platformRevenueCents,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
