import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * POST /api/campaigns/[id]/support
 * Creates a Stripe PaymentIntent for a fan donation.
 * Returns clientSecret for on-platform Stripe Elements.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

  try {
    const { amount, donorName, message } = await request.json();
    const donationAmount = parseFloat(amount);
    if (!donationAmount || donationAmount < 1) return NextResponse.json({ error: 'Minimum donation is $1' }, { status: 400 });

    const campaigns = await sql`
      SELECT id, track_title, artist_id, cover_art_url FROM campaigns 
      WHERE id = ${params.id} AND status IN ('active', 'draft')
    `;
    if (campaigns.length === 0) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const campaign = campaigns[0];
    const amountCents = Math.round(donationAmount * 100);
    const session = getSession(request);

    const stripe = new Stripe(key, { apiVersion: '2024-06-20' as any });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: {
        type: 'campaign_donation',
        campaignId: params.id,
        donorId: session?.id || '',
        donorName: (donorName || 'Anonymous fan').slice(0, 100),
        message: (message || '').slice(0, 500),
      },
      description: `Support "${campaign.track_title}" on Selah.fm`,
      statement_descriptor_suffix: 'SELAHFM DONATION',
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: donationAmount,
      campaignId: params.id,
    });
  } catch (e: any) {
    console.error('Donation PaymentIntent error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
