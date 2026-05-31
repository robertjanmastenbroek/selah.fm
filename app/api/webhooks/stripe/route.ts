import { NextResponse } from 'next/server';

/**
 * Stripe webhook — handles Connect account updates and payout confirmations.
 * 
 * Events:
 * - account.updated → mark stripe_onboarding_complete
 * - transfer.created → payout initiated
 * - transfer.paid → payout completed
 * - transfer.failed → mark payout failed + notify admin
 */
export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature') || '';
  const body = await request.text();

  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' as any });
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    const { default: sql } = await import('@/lib/db');

    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as any;
        if (account.charges_enabled && account.payouts_enabled) {
          // Find user by stripe_account_id
          await sql`
            UPDATE users SET stripe_onboarding_complete = true, updated_at = NOW()
            WHERE stripe_account_id = ${account.id}
          `;
        }
        break;
      }

      case 'transfer.created': {
        const transfer = event.data.object as any;
        await sql`
          UPDATE submissions SET payout_status = 'paid', updated_at = NOW()
          WHERE stripe_transfer_id = ${transfer.id}
        `;
        break;
      }

      case 'transfer.reversed': {
        const transfer = event.data.object as any;
        await sql`
          UPDATE submissions SET payout_status = 'failed', updated_at = NOW()
          WHERE stripe_transfer_id = ${transfer.id}
        `;
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('Webhook error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
