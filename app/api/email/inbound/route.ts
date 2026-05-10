import { NextResponse } from 'next/server';
import sql from '@/lib/db';

/**
 * Resend inbound email webhook.
 * Configure this URL in Resend dashboard: https://selah.fm/api/email/inbound
 * 
 * Resend sends a POST with the parsed email body whenever an email
 * arrives at info@selah.fm or support@selah.fm.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Resend webhook format
    const { from, to, subject, html, text, headers } = body;

    if (!from || !subject) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Determine which address it was sent to
    const toAddresses = Array.isArray(to) ? to : [to];
    const mailbox = toAddresses.some((addr: string) => addr?.includes('support@')) ? 'support' : 'info';

    // Extract sender email
    const fromMatch = from.match(/<?([^\s@]+@[^\s@>]+)>?/);
    const fromEmail = fromMatch?.[1] || from;

    await sql`
      INSERT INTO inbound_emails (mailbox, from_address, to_address, subject, body_html, body_text, raw_headers, read)
      VALUES (${mailbox}, ${fromEmail}, ${toAddresses.join(', ')}, ${subject}, ${html || null}, ${text || null}, ${JSON.stringify(headers || {})}, false)
    `;

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('Inbound email error:', e.message);
    // Always return 200 to Resend so they don't retry
    return NextResponse.json({ received: true });
  }
}
