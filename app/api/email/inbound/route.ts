import { NextResponse } from 'next/server';
import sql from '@/lib/db';

/**
 * Resend inbound email webhook.
 * Configure in Resend dashboard → Domains → selah.fm → Inbound
 * Webhook URL: https://selah.fm/api/email/inbound
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { from, to, subject, html, text, headers } = body;

    if (!from || !subject) {
      return NextResponse.json({ received: true });
    }

    const toAddresses = Array.isArray(to) ? to : [to];
    const mailbox = toAddresses.some((addr: string) => addr?.includes('support@')) ? 'support' : 'info';

    const fromMatch = from.match(/<?([^\s@]+@[^\s@>]+)>?/);
    const fromEmail = fromMatch?.[1] || from;

    await sql`
      INSERT INTO inbound_emails (mailbox, from_address, to_address, subject, body_html, body_text, raw_headers, read)
      VALUES (${mailbox}, ${fromEmail}, ${toAddresses.join(', ')}, ${subject}, ${html || null}, ${text || null}, ${JSON.stringify(headers || {})}, false)
    `;

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true });
  }
}
