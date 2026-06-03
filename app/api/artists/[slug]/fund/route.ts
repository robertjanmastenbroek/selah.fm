import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/artists/[slug]/fund
 * Creates a Stripe PaymentIntent for artist-level donations.
 * Body: { amount, donorName?, donorEmail?, message? }
 */
export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { rateLimit, getRateLimitKey } = await import('@/lib/rate-limit');
    const rl = await rateLimit(getRateLimitKey(request), { maxRequests: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 });
    }

    const { slug } = params;

    // Find artist
    const [artist] = await sql`
      SELECT da.id, da.artist_name, da.genres, ap.slug, ap.spotify_image_url
      FROM discovered_artists da
      JOIN artist_profiles ap ON ap.artist_id = da.id
      WHERE ap.slug = ${slug}
      LIMIT 1
    `;
    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    const body = await request.json();
    const amount = parseInt(body.amount);
    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Amount must be at least $1' }, { status: 400 });
    }

    // Create Stripe PaymentIntent
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
    }

    const formData = new URLSearchParams();
    formData.set('amount', String(amount * 100)); // dollars → cents
    formData.set('currency', 'usd');
    formData.set('metadata[type]', 'artist_donation');
    formData.set('metadata[artist_id]', artist.id);
    formData.set('metadata[artist_name]', artist.artist_name);
    if (body.donorEmail) formData.set('receipt_email', body.donorEmail);

    const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!stripeRes.ok) {
      const err = await stripeRes.json();
      return NextResponse.json({ error: err.error?.message || 'Stripe error' }, { status: 400 });
    }

    const paymentIntent = await stripeRes.json();

    // Store donation record (pending until webhook confirms)
    await sql`
      INSERT INTO artist_donations (artist_id, donor_id, donor_name, donor_email, amount_cents, message, stripe_payment_intent_id, status)
      VALUES (${artist.id}, ${body.donorId || null}, ${body.donorName || null}, ${body.donorEmail || null},
              ${amount * 100}, ${body.message || null}, ${paymentIntent.id}, 'pending')
    `;

    // Create activity event (pending, will be confirmed by webhook)
    await sql`
      INSERT INTO activity_events (artist_id, event_type, actor_type, actor_name, actor_id, message, metadata)
      VALUES (${artist.id}, 'donation', 'anonymous', ${body.donorName || 'Anonymous'}, ${body.donorId || null},
              ${(body.donorName || 'Someone') + ' donated $' + amount},
              ${JSON.stringify({ amount_cents: amount * 100, status: 'pending' })})
    `;

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: amount * 100,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
