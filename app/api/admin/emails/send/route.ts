import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

const RESEND_API = 'https://api.resend.com/emails';

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  try {
    const { to, subject, body, from } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'to, subject, and body are required' }, { status: 400 });
    }

    const fromAddress = from === 'info' ? 'Selah.fm <info@selah.fm>' : 'Selah.fm Support <support@selah.fm>';
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      // Log as failed attempt
      await logEmail(to, subject, false, 'RESEND_API_KEY not configured');
      return NextResponse.json({ sent: false, reason: 'Email service not configured. Set RESEND_API_KEY in Railway.' }, { status: 500 });
    }

    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject,
        html: body.replace(/\n/g, '<br>'),
      }),
    });

    if (res.ok) {
      await logEmail(to, subject, true);
      return NextResponse.json({ sent: true });
    }

    const err = await res.json().catch(() => ({}));
    await logEmail(to, subject, false, JSON.stringify(err));
    return NextResponse.json({ sent: false, reason: (err as any).message || 'Delivery failed' });
  } catch (e: any) {
    return NextResponse.json({ sent: false, reason: e.message }, { status: 500 });
  }
}

async function logEmail(recipient: string, subject: string, sent: boolean, reason?: string) {
  try {
    await sql`
      INSERT INTO email_logs (recipient, subject, sent, reason)
      VALUES (${recipient}, ${subject}, ${sent}, ${reason || null})
    `;
  } catch {}
}
