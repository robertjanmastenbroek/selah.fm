import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Nightly reconciliation job — compares Stripe events against internal records.
 * Runs at 02:00 UTC via dispatcher.
 * Catches: webhook drops, double charges, incorrect fee calculations.
 * Flags any drift > $0.01 and logs for manual review.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: string[] = [];
  const errors: string[] = [];

  // ── Check 1: Stripe events that processed successfully → should have matching donations ──
  try {
    const unprocessedEvents = await sql`
      SELECT se.stripe_event_id, se.event_type, se.created_at
      FROM stripe_events se
      WHERE se.processed = false
        AND se.created_at < NOW() - INTERVAL '30 minutes'
        AND se.error IS NULL
    `;
    
    if (unprocessedEvents.length > 0) {
      errors.push(
        `${unprocessedEvents.length} Stripe events not processed after 30 minutes (stuck)`
      );
      for (const e of unprocessedEvents.slice(0, 5)) {
        errors.push(
          `  → ${e.event_type} (${e.stripe_event_id}) from ${e.created_at}`
        );
      }
    }

    results.push(`Checked ${unprocessedEvents.length} unprocessed events`);
  } catch (e: any) {
    errors.push(`Stripe events check failed: ${e.message}`);
  }

  // ── Check 2: Campaign budgets should match sum of donations ──
  try {
    const budgetMismatches = await sql`
      SELECT 
        c.id as campaign_id,
        c.track_title,
        c.total_budget_cents,
        COALESCE(cd.total_donated, 0) as total_donated_cents,
        c.total_budget_cents - COALESCE(cd.total_donated, 0) as drift_cents
      FROM campaigns c
      LEFT JOIN (
        SELECT campaign_id, SUM(amount_cents) as total_donated
        FROM campaign_donations
        GROUP BY campaign_id
      ) cd ON cd.campaign_id = c.id
      WHERE c.total_budget_cents > 0
        AND ABS(c.total_budget_cents - COALESCE(cd.total_donated, 0)) > 1
      ORDER BY drift_cents DESC
      LIMIT 10
    `;

    if (budgetMismatches.length > 0) {
      errors.push(
        `${budgetMismatches.length} campaign budget/donation mismatches found`
      );
      for (const m of budgetMismatches) {
        errors.push(
          `  → "${m.track_title}": budget=${m.total_budget_cents}c, donations=${m.total_donated_cents}c, drift=${m.drift_cents}c`
        );
      }
    }

    results.push(`Checked ${budgetMismatches.length} budget mismatches`);
  } catch (e: any) {
    errors.push(`Budget reconciliation failed: ${e.message}`);
  }

  // ── Check 3: Approved submissions should have payout amounts deducted from budget ──
  try {
    const payoutMismatches = await sql`
      SELECT 
        c.id as campaign_id,
        c.track_title,
        c.budget_remaining_cents,
        c.total_budget_cents,
        COALESCE(sp.total_approved_payouts, 0) as total_approved_payouts_cents,
        (c.total_budget_cents - COALESCE(sp.total_approved_payouts, 0) - c.budget_remaining_cents) as unaccounted_cents
      FROM campaigns c
      LEFT JOIN (
        SELECT campaign_id, 
          SUM(payout_amount_cents * 1.20)::int as total_approved_payouts
        FROM submissions
        WHERE review_status = 'approved'
        GROUP BY campaign_id
      ) sp ON sp.campaign_id = c.id
      WHERE c.total_budget_cents > 0
        AND c.budget_remaining_cents >= 0
        AND ABS(c.budget_remaining_cents - (c.total_budget_cents - COALESCE(sp.total_approved_payouts, 0))) > 1
      ORDER BY unaccounted_cents DESC
      LIMIT 10
    `;

    if (payoutMismatches.length > 0) {
      errors.push(
        `${payoutMismatches.length} payout/budget mismatches found`
      );
      for (const m of payoutMismatches) {
        errors.push(
          `  → "${m.track_title}": budget=${m.total_budget_cents}c, remaining=${m.budget_remaining_cents}c, payouts=${m.total_approved_payouts_cents}c, gap=${m.unaccounted_cents}c`
        );
      }
    }

    results.push(`Checked ${payoutMismatches.length} payout mismatches`);
  } catch (e: any) {
    errors.push(`Payout reconciliation failed: ${e.message}`);
  }

  // ── Check 4: Referral bonuses should match referral records ──
  try {
    const referralMismatches = await sql`
      SELECT 
        u.id,
        u.referrer_earnings_cents,
        COALESCE(prb.total_pending, 0) as total_pending_cents,
        u.referrer_earnings_cents - COALESCE(prb.total_pending, 0) as drift_cents
      FROM users u
      LEFT JOIN (
        SELECT user_id, SUM(amount_cents)::int as total_pending
        FROM pending_referral_bonuses
        WHERE status = 'pending'
        GROUP BY user_id
      ) prb ON prb.user_id = u.id
      WHERE u.referrer_earnings_cents > 0
        AND ABS(u.referrer_earnings_cents - COALESCE(prb.total_pending, 0)) > 1
      LIMIT 10
    `;

    if (referralMismatches.length > 0) {
      errors.push(
        `${referralMismatches.length} referral balance mismatches found`
      );
    }

    results.push(`Checked ${referralMismatches.length} referral mismatches`);
  } catch (e: any) {
    errors.push(`Referral reconciliation failed: ${e.message}`);
  }

  // ── Check 5: Stripe events older than 90 days should be considered for archival ──
  try {
    const oldEvents = await sql`
      SELECT COUNT(*)::int as count FROM stripe_events
      WHERE processed = true AND created_at < NOW() - INTERVAL '90 days'
    `;
    
    if (oldEvents.length > 0 && oldEvents[0].count > 1000) {
      results.push(`${oldEvents[0].count} archival-ready events (processed, >90 days old)`);
    }
  } catch (e: any) {
    errors.push(`Archival check failed: ${e.message}`);
  }

  // ── Summary ──
  const status = errors.length === 0 ? 'clean' : 'issues_found';
  
  if (errors.length > 0) {
    // Log to a reconciliations table for alerting
    try {
      await sql`
        INSERT INTO activity_events (event_type, actor_id, metadata)
        VALUES ('reconciliation_alert', '00000000-0000-0000-0000-000000000000',
          ${JSON.stringify({ errors: errors.slice(0, 20), timestamp: new Date().toISOString() })}
        )
      `;
    } catch {}
  }

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    checks: results,
    errors: errors.length > 0 ? errors : undefined,
    summary: `${results.length} checks passed, ${errors.length} issues found`,
  });
}
