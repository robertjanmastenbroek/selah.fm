import { NextResponse } from 'next/server';
import sql from '@/lib/db';

/**
 * Inbound email webhook — receives emails via Resend Inbound.
 * Setup: Resend → Domains → verify subdomain (mail.selah.fm) with inbound.
 *        Resend → Webhooks → Add → https://selah.fm/api/admin/emails/inbound → email.received.
 *        Copy webhook secret → RESEND_WEBHOOK_SECRET in Railway.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { from, to, subject, text, html, headers } = body;
    
    if (!from || !subject) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Store incoming email
    await sql`
      INSERT INTO inbound_emails (from_email, to_email, subject, body_text, body_html, headers, received_at)
      VALUES (${from}, ${Array.isArray(to) ? to.join(', ') : to || ''}, ${subject}, ${text || ''}, ${html || ''}, ${JSON.stringify(headers || {})}, NOW())
    `.catch(async () => {
      // Table may not exist yet — create it
      await sql`
        CREATE TABLE IF NOT EXISTS inbound_emails (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          from_email TEXT NOT NULL,
          to_email TEXT,
          subject TEXT NOT NULL,
          body_text TEXT,
          body_html TEXT,
          headers JSONB DEFAULT '{}',
          read BOOLEAN NOT NULL DEFAULT false,
          received_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        INSERT INTO inbound_emails (from_email, to_email, subject, body_text, body_html, headers, received_at)
        VALUES (${from}, ${Array.isArray(to) ? to.join(', ') : to || ''}, ${subject}, ${text || ''}, ${html || ''}, ${JSON.stringify(headers || {})}, NOW())
      `;
    });

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('Inbound email error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
