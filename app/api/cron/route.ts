import { NextResponse } from 'next/server';

// Auto-payout cron — triggered by Railway cron job or external scheduler
// Checks approved submissions, verifies views, triggers payouts

export async function GET() {
  const payouts = [
    { submissionId: '1', creatorId: 'c1', views: 12400, earned: 37.20, status: 'paid' },
    { submissionId: '2', creatorId: 'c2', views: 8300, earned: 33.20, status: 'paid' },
    { submissionId: '3', creatorId: 'c3', views: 45100, earned: 90.20, status: 'pending' },
  ];

  // In production: query DB for approved submissions, verify views, trigger Stripe payouts

  return NextResponse.json({
    processed: payouts.filter(p => p.status === 'paid').length,
    pending: payouts.filter(p => p.status === 'pending').length,
    totalPaid: payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.earned, 0),
    nextRun: '1 hour',
  });
}

// Manual trigger — force payout for a specific submission
export async function POST(request: Request) {
  const { submissionId } = await request.json();
  
  // In production:
  // 1. Verify current view count via platform API
  // 2. Calculate earnings: min(views * cpm, max_payout)
  // 3. Call Stripe transfer API
  // 4. Update DB

  return NextResponse.json({
    submissionId,
    status: 'paid',
    amount: 37.20,
    paidAt: new Date().toISOString(),
  });
}
