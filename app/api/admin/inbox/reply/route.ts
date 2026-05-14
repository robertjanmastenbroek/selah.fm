import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';
import { emailSimple } from '@/lib/email-templates';

/**
 * POST — Reply to an inbound email from admin
 */
export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  try {
    const { to, subject, body, from } = await request.json();
    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'to, subject, body required' }, { status: 400 });
    }

    const fromAddress = from === 'info' ? 'Selah.fm <info@selah.fm>' : 'Selah.fm Support <support@selah.fm>';
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ sent: false, reason: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject,
        html: emailSimple({ body }),
        reply_to: from === 'info' ? 'info@selah.fm' : 'support@selah.fm',
      }),
    });

    if (res.ok) {
      await logEmail(to, subject, true);
      return NextResponse.json({ sent: true });
    }

    const err = await res.json().catch(() => ({}));
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
