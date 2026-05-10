import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * POST /api/campaigns/[id]/support
 * Fans donate to an artist's campaign — crowdfunding for music promotion.
 * Creates a Stripe Checkout session. Anyone can donate (auth optional).
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  try {
    const { amount, donorName, message, anonymous } = await request.json();

    const donationAmount = parseFloat(amount);
    if (!donationAmount || donationAmount < 1) {
      return NextResponse.json({ error: 'Minimum donation is $1' }, { status: 400 });
    }
    if (donationAmount > 10000) {
      return NextResponse.json({ error: 'Maximum donation is $10,000' }, { status: 400 });
    }

    // Verify campaign exists and is active
    const campaigns = await sql`
      SELECT id, track_title, artist_id FROM campaigns 
      WHERE id = ${params.id} AND status IN ('active', 'draft')
    `;
    if (campaigns.length === 0) {
      return NextResponse.json({ error: 'Campaign not found or not accepting donations' }, { status: 404 });
    }

    const campaign = campaigns[0];
    const amountCents = Math.round(donationAmount * 100);

    // Get donor info if authenticated
    const session = getSession(request);
    const donorId = session?.id || null;
    const finalDonorName = donorName || session?.name || 'Anonymous fan';

    const stripe = new Stripe(key, { apiVersion: '2024-06-20' as any });
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://selah.fm';

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${baseUrl}/c/${params.id}?donated=success`,
      cancel_url: `${baseUrl}/c/${params.id}?donated=cancelled`,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Support "${campaign.track_title}"`,
            description: 'Your donation goes directly to the campaign budget for creator payouts.',
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      metadata: {
        type: 'campaign_donation',
        campaignId: params.id,
        donorId: donorId || '',
        donorName: finalDonorName.slice(0, 100),
        message: (message || '').slice(0, 500),
        anonymous: String(!!anonymous),
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (e: any) {
    console.error('Donation checkout error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
