import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';

/**
 * POST /api/stripe/connect — creates Stripe Connect Express onboarding link.
 * Creator clicks "Set up payouts" → gets Stripe-hosted onboarding URL.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

  try {
    // Lazy-load Stripe (ESM library)
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

    // Check if creator already has a Stripe account (check both column names)
    const { default: sql } = await import('@/lib/db');
    const rows = await sql`SELECT stripe_account_id, stripe_connect_id FROM users WHERE id = ${user.id}`;
    let accountId = rows[0]?.stripe_account_id || rows[0]?.stripe_connect_id;

    // Create new Stripe Connect Express account if needed
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: user.email,
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        business_type: 'individual',
      });
      accountId = account.id;
      await sql`UPDATE users SET stripe_account_id = ${accountId} WHERE id = ${user.id}`;
    } else {
      // Ensure existing accounts also have card_payments capability (Stripe requires it
      // alongside transfers for US accounts). Stripe's update is idempotent — safe to call
      // even if already enabled.
      try {
        await stripe.accounts.update(accountId, {
          capabilities: { card_payments: { requested: true } },
        });
      } catch (capErr: any) {
        console.warn('[STRIPE CONNECT] Could not update capabilities for existing account:', capErr.message);
      }
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://selah.fm';
    // Determine where to return after Stripe onboarding
    const referer = request.headers.get('referer') || '';
    const baseUrl = referer.includes('/onboarding') ? `${origin}/onboarding`
      : referer.includes('/dashboard') ? `${origin}/dashboard?tab=earnings`
      : `${origin}/earnings`;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}?stripe=refresh`,
      return_url: `${baseUrl}?stripe=success`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
