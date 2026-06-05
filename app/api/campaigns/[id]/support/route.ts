import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

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
    const { amount, donorName, email, message } = await request.json();
    const donationAmount = parseFloat(amount);
    if (!donationAmount || donationAmount < 1) return NextResponse.json({ error: 'Minimum donation is $1' }, { status: 400 });

    // Resolve id to UUID — the URL param can be either slug or UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
    const campaigns = isUuid
      ? await sql`SELECT id, track_title, artist_id, cover_art_url FROM campaigns WHERE id = ${params.id}::uuid AND status IN ('active', 'draft')`
      : await sql`SELECT id, track_title, artist_id, cover_art_url FROM campaigns WHERE slug = ${params.id} AND status IN ('active', 'draft')`;
    if (campaigns.length === 0) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const campaign = campaigns[0];
    const campaignId = campaign.id; // always UUID — never slug
    const amountCents = Math.round(donationAmount * 100);
    const user = await getUser();

    const stripe = new Stripe(key, { apiVersion: '2024-06-20' as any });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: 'campaign_donation',
        campaignId,  // always UUID
        donorId: user?.id || '',
        donorName: (donorName || 'Anonymous fan').slice(0, 100),
        donorEmail: email || '',
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
