import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';

/**
 * Send email from admin panel — reply or compose.
 * Uses the Resend API with the appropriate FROM address.
 */
export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  try {
    const { to, subject, content, from } = await request.json();

    if (!to || !subject || !content) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const fromAddress = from === 'info' ? 'info@selah.fm' : 'support@selah.fm';

    const { sendEmail } = await import('@/lib/email');

    const result = await sendEmail({
      to,
      subject,
      html: `<div style="font-family:system-ui,sans-serif;color:#F0F0F0;background:#0D0D0D;padding:24px;border-radius:12px;max-width:600px">${content.replace(/\n/g, '<br>')}</div>`,
      from: `Selah.fm <${fromAddress}>`,
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message, sent: false }, { status: 500 });
  }
}
