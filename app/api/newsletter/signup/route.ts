import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

/**
 * POST /api/newsletter/signup
 * Adds email to Resend audience for newsletter + lead magnet delivery.
 * Also sends a welcome email with the lead magnet (CPM Cheat Sheet).
 */
export async function POST(request: Request) {
  try {
    const { email, name, source } = await request.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const displayName = name || email.split('@')[0];

    // Add to Resend audience
    if (RESEND_API_KEY && RESEND_AUDIENCE_ID) {
      const audienceRes = await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          email,
          first_name: displayName,
          unsubscribed: false,
        }),
      });

      if (!audienceRes.ok) {
        const errText = await audienceRes.text();
        // 409 = already exists — not an error
        if (audienceRes.status !== 409) {
          console.error('Resend audience error:', errText);
        }
      }
    }

    // Send welcome email with lead magnet
    if (RESEND_API_KEY) {
      const leadMagnetHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FFFFFF;font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:16px;overflow:hidden">
        <tr><td style="padding:32px 32px 0;text-align:center">
          <h1 style="font-size:24px;font-weight:700;color:#1A1A2E;margin:0 0 8px">Welcome to Selah.fm 🎵</h1>
          <p style="font-size:15px;color:#6B7280;line-height:1.6;margin:0 0 20px">
            Thanks for signing up, ${displayName}!
          </p>
        </td></tr>
        <tr><td style="padding:0 32px 32px">
          <div style="background:#F3F4F6;border-radius:12px;padding:24px;margin-bottom:20px">
            <h2 style="font-size:16px;font-weight:600;color:#1A1A2E;margin:0 0 12px">📊 Your Free CPM Cheat Sheet</h2>
            <p style="font-size:14px;color:#6B7280;line-height:1.6;margin:0 0 12px">
              Know what creators actually earn per 1,000 views:
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <tr style="background:#4338CA;color:white">
                <th style="padding:8px 12px;text-align:left;border-radius:8px 0 0 0">Platform</th>
                <th style="padding:8px 12px;text-align:right">Avg CPM</th>
                <th style="padding:8px 12px;text-align:right;border-radius:0 8px 0 0">1M Views</th>
              </tr>
              <tr style="border-bottom:1px solid #E5E7EB">
                <td style="padding:8px 12px">TikTok</td>
                <td style="padding:8px 12px;text-align:right">$0.50–$1</td>
                <td style="padding:8px 12px;text-align:right">$500–$1,000</td>
              </tr>
              <tr style="border-bottom:1px solid #E5E7EB">
                <td style="padding:8px 12px">Instagram Reels</td>
                <td style="padding:8px 12px;text-align:right">$1–$3</td>
                <td style="padding:8px 12px;text-align:right">$1,000–$3,000</td>
              </tr>
              <tr>
                <td style="padding:8px 12px">YouTube Shorts</td>
                <td style="padding:8px 12px;text-align:right">$1–$5</td>
                <td style="padding:8px 12px;text-align:right">$1,000–$5,000</td>
              </tr>
            </table>
          </div>
          <p style="font-size:14px;color:#6B7280;line-height:1.6;margin:0 0 20px">
            <strong>On Selah.fm, creators keep 100%</strong> of the CPM rate. The platform fee is added on the artist's side.
            Browse campaigns, pick tracks you love, and start earning per verified view.
          </p>
          <div style="text-align:center">
            <a href="https://selah.fm/browse" style="display:inline-block;padding:14px 32px;background:#4338CA;color:#FFFFFF;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px">
              Browse Campaigns →
            </a>
          </div>
          <p style="font-size:12px;color:#9CA3AF;text-align:center;margin-top:20px">
            You're receiving this because you signed up at selah.fm.<br>
            <a href="https://selah.fm/unsubscribe?email=${encodeURIComponent(email)}" style="color:#4338CA;text-decoration:none">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Selah.fm <newsletter@selah.fm>',
          to: email,
          subject: 'Welcome! Here\'s your free CPM Cheat Sheet 📊',
          html: leadMagnetHtml,
        }),
      });
    }

    return NextResponse.json({ ok: true, message: 'Signed up! Check your email for the CPM Cheat Sheet.' });
  } catch (e: any) {
    console.error('Newsletter signup error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
