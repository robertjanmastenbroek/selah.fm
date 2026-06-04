import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession, ADMIN_EMAILS } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session || !ADMIN_EMAILS.includes(session.email)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  try {
    const { to, subject, body } = await request.json();
    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Try sending via Resend
    let sent = false;
    if (process.env.RESEND_API_KEY) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Selah.fm <info@selah.fm>',
            to: [to],
            subject,
            html: body.replace(/\n/g, '<br>'),
          }),
        });
        if (res.ok) sent = true;
      } catch (e: any) { console.error('Unhandled error in api/admin/emails/send/route.ts:', e); }
    }

    // Log to email_logs table
    try {
      await sql`
        INSERT INTO email_logs (recipient, subject, status, metadata)
        VALUES (${to}, ${subject}, ${sent ? 'sent' : 'failed'}, ${JSON.stringify({ sent_by: session.email, body_preview: body.substring(0, 200) })})
      `;
    } catch (e: any) { console.error('Unhandled error in api/admin/emails/send/route.ts:', e); }

    return NextResponse.json({ ok: true, sent });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
