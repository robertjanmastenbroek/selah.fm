import { NextResponse } from 'next/server';
import sql from '@/lib/db';

/**
 * Inbound email webhook — receives email.received events from Resend.
 * Resend sends metadata only (email_id). We fetch the actual email
 * content via the Resend API.
 *
 * Setup: Resend → Webhooks → Add → https://selah.fm/api/admin/emails/inbound
 *        Event: email.received
 */

export async function POST(request: Request) {
  // Validate webhook secret
  const secret = request.headers.get('svix-id') || request.headers.get('x-webhook-secret') || '';
  const expected = process.env.RESEND_INBOUND_WEBHOOK_SECRET || process.env.RESEND_WEBHOOK_SECRET || '';
  if (expected && secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();

    // Only process email.received events
    if (payload.type !== 'email.received') {
      return NextResponse.json({ received: true, skipped: true });
    }

    const emailId = payload.data?.email_id;
    if (!emailId) {
      return NextResponse.json({ error: 'Missing email_id' }, { status: 400 });
    }

    // Fetch actual email content from Resend API
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const res = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      console.error('Resend API error:', res.status);
      return NextResponse.json({ error: `Resend API error: ${res.status}` }, { status: 500 });
    }

    const json = await res.json();
    const email = json.data || json;
    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Extract fields
    const from = email.from || payload.data?.from || '';
    const to = Array.isArray(email.to) ? email.to.join(', ') : (email.to || payload.data?.to || '');
    const subject = email.subject || payload.data?.subject || '(no subject)';
    const text = email.text || '';
    const html = email.html || '';

    // Ensure table exists (matches actual production schema)
    await sql`
      CREATE TABLE IF NOT EXISTS inbound_emails (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mailbox TEXT,
        from_email TEXT NOT NULL,
        from_name TEXT,
        subject TEXT NOT NULL,
        body_text TEXT,
        body_html TEXT,
        status TEXT NOT NULL DEFAULT 'unread',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `.catch((e: any) => console.error('Async error in api/admin/emails/inbound/route.ts:', e));

    await sql`
      INSERT INTO inbound_emails (from_email, from_name, subject, body_text, body_html, created_at)
      VALUES (${from}, ${email.from_name || ''}, ${subject}, ${text}, ${html}, NOW())
    `;

    console.log(`Inbound email stored: ${subject} from ${from}`);

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('Inbound email error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}