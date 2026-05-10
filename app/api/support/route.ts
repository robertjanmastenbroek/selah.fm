import { NextResponse } from 'next/server';

/**
 * Support API — forwards conversations to support@selah.fm via email.
 * Called when the Selah AI bot can't answer a question or when a user requests a human.
 */
export async function POST(request: Request) {
  try {
    const { message, history, urgent } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    // Try to send email via SMTP if configured
    let emailSent = false;
    try {
      const { sendEmail } = await import('@/lib/email');

      const historyText = Array.isArray(history)
        ? history.map((h: string) => `  ${h}`).join('\n')
        : 'No history';

      const html = `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#F0F0F0;background:#0D0D0D;padding:24px;border-radius:12px;border:1px solid rgba(255,255,255,0.06)">
          <h2 style="color:#5B7FFF">${urgent ? '🚨 Urgent: ' : ''}Support Request</h2>
          <p style="color:#A0A0A0"><strong>Message:</strong> ${message}</p>
          <div style="background:rgba(255,255,255,0.03);padding:16px;border-radius:8px;margin:16px 0">
            <p style="color:#8C8C8C;font-size:12px;margin-bottom:8px"><strong>Conversation history:</strong></p>
            <pre style="color:#8C8C8C;font-size:11px;white-space:pre-wrap;margin:0">${historyText}</pre>
          </div>
          <p style="color:#555;font-size:11px">Sent from Selah.fm Support Widget · ${new Date().toISOString()}</p>
        </div>`;

      const result = await sendEmail({
        to: 'support@selah.fm',
        subject: `${urgent ? '[URGENT] ' : ''}Support request: ${message.slice(0, 60)}${message.length > 60 ? '...' : ''}`,
        html,
      });

      emailSent = result.sent;
    } catch (emailErr) {
      console.error('Support email failed:', emailErr);
    }

    // Always log the request
    console.log(`[SUPPORT] ${urgent ? 'URGENT ' : ''}Message: ${message}`);

    return NextResponse.json({
      ok: true,
      emailSent,
      note: emailSent
        ? 'Your message has been forwarded to our team.'
        : 'Message received. Our team will review it. (Email delivery was unavailable, but your message is logged.)',
    });
  } catch (e: any) {
    console.error('Support API error:', e.message);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
