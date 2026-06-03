import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/artist/balance
 * Returns the current artist's balance + transaction history.
 * Requires authentication + claimed artist profile.
 */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const [profile] = await sql`
      SELECT ap.artist_id, ap.balance_cents, ap.lifetime_deposits_cents,
             da.artist_name
      FROM artist_profiles ap
      JOIN discovered_artists da ON da.id = ap.artist_id
      WHERE ap.claimed_by_user_id = ${user.id}
      LIMIT 1
    `;

    if (!profile) {
      return NextResponse.json({ artist: null, balance: 0, transactions: [] });
    }

    const transactions = await sql`
      SELECT id, amount_cents, type, description, campaign_id, created_at
      FROM artist_transactions
      WHERE artist_id = ${profile.artist_id}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    // Count pending payouts
    const [pendingPayouts] = await sql`
      SELECT COUNT(*)::int as count, COALESCE(SUM(s.payout_amount_cents), 0)::int as total_cents
      FROM submissions s
      JOIN campaigns c ON c.id = s.campaign_id
      JOIN campaign_claims cc ON cc.campaign_id = c.id
      WHERE cc.discovered_artist_id = ${profile.artist_id}
        AND s.review_status = 'approved'
        AND s.payout_status != 'paid'
    `;

    return NextResponse.json({
      artist_id: profile.artist_id,
      artist_name: profile.artist_name,
      balance_cents: profile.balance_cents,
      lifetime_deposits_cents: profile.lifetime_deposits_cents,
      pending_payouts_cents: pendingPayouts.total_cents,
      pending_submissions: pendingPayouts.count,
      transactions,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
