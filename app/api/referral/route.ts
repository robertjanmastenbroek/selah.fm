import { NextResponse } from 'next/server';

/**
 * Referral link redirector.
 * GET /api/referral?code=user@email.com → redirects to login with ref param
 * 
 * The actual bonus is awarded by the Stripe webhook when the referred
 * artist makes their first deposit (10% split 50/50).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_URL || 'https://selah.fm'}/login?ref=${encodeURIComponent(code)}`);
  }

  return NextResponse.json({ error: 'Missing referral code' }, { status: 400 });
}
