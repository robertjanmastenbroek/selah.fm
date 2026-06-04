import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import sql from '@/lib/db';

/**
 * GET /api/referral/code
 * Returns the current user's referral code and earnings.
 * POST /api/referral/code
 * Claims a referral code on signup.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Try to get referral_code — handle missing column gracefully
  let profile: any = null;
  try {
    const result = await sql`
      SELECT id, referral_code, referrer_earnings_cents, referred_by
      FROM users WHERE id = ${user.id}
    `;
    profile = result[0];
  } catch {
    // Migration may not have run — fall back to basic query
    const result = await sql`
      SELECT id FROM users WHERE id = ${user.id}
    `;
    profile = result[0] ? { ...result[0], referral_code: null, referrer_earnings_cents: 0, referred_by: null } : null;
  }
  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Get pending bonuses count
  const [bonusStats] = await sql`
    SELECT COALESCE(COUNT(*), 0)::int as pending_bonuses,
           COALESCE(SUM(amount_cents), 0)::int as total_pending_cents
    FROM pending_referral_bonuses
    WHERE user_id = ${user.id} AND status = 'pending'
  `;

  // Get referred users count
  const [referredCount] = await sql`
    SELECT COUNT(*)::int as count FROM users WHERE referred_by = ${user.id}
  `;

  return NextResponse.json({
    referral_code: profile.referral_code,
    referrer_earnings_cents: profile.referrer_earnings_cents,
    total_pending_cents: bonusStats?.total_pending_cents || 0,
    pending_bonuses: bonusStats?.pending_bonuses || 0,
    referred_users: referredCount?.count || 0,
    referred_by: profile.referred_by,
  });
}

/**
 * POST /api/referral/code
 * Body: { ref: "referral_code" }
 * Links the current user to a referrer. Only works once per user.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ref } = await request.json();
  if (!ref) return NextResponse.json({ error: 'Missing referral code' }, { status: 400 });

  // Check user hasn't already been referred
  const [existing] = await sql`
    SELECT referred_by FROM users WHERE id = ${user.id}
  `;
  if (existing?.referred_by) {
    return NextResponse.json({ error: 'Already referred by someone' }, { status: 409 });
  }

  // Find referrer by code (not email)
  const [referrer] = await sql`
    SELECT id FROM users WHERE referral_code = ${ref} AND id != ${user.id}
  `;
  if (!referrer) {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
  }

  // Link user to referrer
  await sql`
    UPDATE users SET referred_by = ${referrer.id} WHERE id = ${user.id}
  `;

  return NextResponse.json({ ok: true, message: 'Referral claimed!' });
}
