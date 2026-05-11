import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { trackFundCampaign } from '@/lib/analytics-server';

/**
 * POST /api/stripe
 * Creates a Stripe PaymentIntent for an artist campaign deposit.
 * Returns clientSecret for on-platform Stripe Elements.
 */
export async function POST(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { rateLimit, getRateLimitKey } = await import('@/lib/rate-limit');
  const rl = rateLimit(getRateLimitKey(request), { maxRequests: 10, windowMs: 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 });

  try {
    const { amount, campaignId } = await request.json();
    const depositAmount = parseInt(amount);
    if (!depositAmount || depositAmount < 5) return NextResponse.json({ error: 'Minimum deposit is $5' }, { status: 400 });

    // Verify campaign ownership
    const campaigns = await sql`SELECT id, track_title, cover_art_url FROM campaigns WHERE id = ${campaignId} AND artist_id = ${session.id}`;
    if (campaigns.length === 0) return NextResponse.json({ error: 'Campaign not found or not yours' }, { status: 404 });

    const campaign = campaigns[0];
    const stripe = new Stripe(key, { apiVersion: '2024-06-20' as any });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: depositAmount * 100,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: 'campaign_deposit',
        campaignId,
        userId: session.id || '',
      },
      description: `Deposit to "${campaign.track_title}" campaign`,
      statement_descriptor_suffix: 'SELAHFM DEPOSIT',
    });

    // Server-side GA tracking
    trackFundCampaign(depositAmount, session.id).catch(() => {});

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret || '',
      amount: depositAmount,
      campaignId,
    });
  } catch (e: any) {
    console.error('Deposit PaymentIntent error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
