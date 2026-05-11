import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSession } from '@/lib/auth';

/**
 * Create a Stripe Connect Standard account link for creators.
 * Creators click this link to onboard with Stripe and receive payouts.
 */
export async function GET(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

  const stripe = new Stripe(key, { apiVersion: '2024-06-20' as any });

  // Get user from session
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  try {
    // Check if user already has a Connect account
    const { default: sql } = await import('@/lib/db');
    const users = await sql`SELECT stripe_connect_id FROM users WHERE id = ${session.id}`;
    
    let connectId = users.length > 0 ? users[0].stripe_connect_id : null;

    if (!connectId) {
      // Create a new Express Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: session.email,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        business_type: 'individual',
      });
      connectId = account.id;

      // Save to DB
      await sql`
        UPDATE users SET stripe_connect_id = ${connectId}, updated_at = NOW()
        WHERE id = ${session.id}
      `;
    }

    // Create an account link for onboarding
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://selah.fm';
    const accountLink = await stripe.accountLinks.create({
      account: connectId,
      refresh_url: `${baseUrl}/earnings?connect=refresh`,
      return_url: `${baseUrl}/earnings?connect=success`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (e: any) {
    console.error('Stripe Connect error:', e.message);
    const msg = e.message || 'Unknown error';
    // Show a helpful message based on the error
    if (msg.includes('api_key') || msg.includes('auth')) return NextResponse.json({ error: 'Stripe API key not configured. Add STRIPE_SECRET_KEY to Railway.' }, { status: 500 });
    if (msg.includes('country')) return NextResponse.json({ error: 'Stripe Connect requires a supported country. Contact support.' }, { status: 500 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
