import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

/**
 * POST /api/stripe/connect — creates Stripe Connect Express onboarding link.
 * Creator clicks "Set up payouts" → gets Stripe-hosted onboarding URL.
 */
export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

  try {
    // Lazy-load Stripe (ESM library)
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' as any });

    // Check if creator already has a Stripe account
    const { default: sql } = await import('@/lib/db');
    const rows = await sql`SELECT stripe_account_id FROM users WHERE id = ${session.id}`;
    let accountId = rows[0]?.stripe_account_id;

    // Create new Stripe Connect Express account if needed
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: session.email,
        capabilities: { transfers: { requested: true } },
        business_type: 'individual',
      });
      accountId = account.id;
      await sql`UPDATE users SET stripe_account_id = ${accountId} WHERE id = ${session.id}`;
    }

    // Create onboarding link
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://selah.fm';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/earnings?stripe=refresh`,
      return_url: `${origin}/earnings?stripe=success`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
