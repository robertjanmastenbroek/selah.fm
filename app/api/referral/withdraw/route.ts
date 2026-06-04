import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import sql from '@/lib/db';

/**
 * POST /api/referral/withdraw
 * Withdraw referral earnings as campaign budget (or future Stripe payout for non-artists).
 * 
 * For now, referral earnings are credited to the first active campaign the user has.
 * If the user has no active campaign, the bonus remains as pending balance.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { amount_cents } = await request.json();
  if (!amount_cents || amount_cents <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  // Check user has enough earnings
  const [profile] = await sql`
    SELECT id, referrer_earnings_cents FROM users WHERE id = ${user.id}
  `;
  if (!profile || profile.referrer_earnings_cents < amount_cents) {
    return NextResponse.json({ error: 'Insufficient earnings' }, { status: 400 });
  }

  // Check user has a campaign to credit
  const [campaign] = await sql`
    SELECT id, total_budget_cents, budget_remaining_cents, status
    FROM campaigns WHERE artist_id = ${user.id} AND status = 'active'
    ORDER BY updated_at DESC LIMIT 1
  `;

  if (campaign) {
    // Artist: credit to campaign budget
    await sql`
      UPDATE campaigns SET
        total_budget_cents = total_budget_cents + ${amount_cents},
        budget_remaining_cents = budget_remaining_cents + ${amount_cents},
        updated_at = NOW()
      WHERE id = ${campaign.id}
    `;

    // Mark referral bonuses as paid
    await sql`
      UPDATE pending_referral_bonuses SET status = 'paid', paid_at = NOW()
      WHERE user_id = ${user.id} AND status = 'pending'
      AND id IN (
        SELECT id FROM pending_referral_bonuses
        WHERE user_id = ${user.id} AND status = 'pending'
        ORDER BY created_at ASC
        LIMIT CASE WHEN ${amount_cents} >= (
          SELECT COALESCE(SUM(amount_cents), 0) FROM pending_referral_bonuses
          WHERE user_id = ${user.id} AND status = 'pending'
        ) THEN 999999 ELSE 1 END
      )
    `;

    // Deduct from earnings
    await sql`
      UPDATE users SET referrer_earnings_cents = referrer_earnings_cents - ${amount_cents}
      WHERE id = ${user.id}
    `;

    return NextResponse.json({
      ok: true,
      message: `$${(amount_cents / 100).toFixed(2)} credited to campaign "${campaign.id}"`,
    });
  }

  // Non-artist: keep as pending balance for future Stripe payout
  return NextResponse.json({
    ok: false,
    message: 'Create an active campaign first, or build a campaign to use your referral earnings.',
  });
}
