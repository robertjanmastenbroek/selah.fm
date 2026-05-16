import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/email-stats
 * 
 * Fetches delivery stats from Resend API for the last 50 emails.
 * Requires RESEND_API_KEY in environment.
 */
export async function GET() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  try {
    // Fetch recent email events from Resend
    const res = await fetch('https://api.resend.com/emails?limit=50', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Resend API error: ${res.status}` }, { status: 500 });
    }

    const data = await res.json();
    const emails = data.data || [];

    const stats = {
      total: emails.length,
      delivered: 0,
      bounced: 0,
      complained: 0,
      opened: 0,
      clicked: 0,
      unknown: 0,
      details: [] as any[],
    };

    for (const email of emails) {
      const status = email.last_event || 'unknown';
      if (status === 'delivered') stats.delivered++;
      else if (status === 'bounced') stats.bounced++;
      else if (status === 'complained') stats.complained++;
      else if (status === 'opened') stats.opened++;
      else if (status === 'clicked') stats.clicked++;
      else stats.unknown++;

      if (status === 'bounced' || status === 'complained') {
        stats.details.push({
          to: email.to,
          subject: email.subject,
          status,
          created_at: email.created_at,
        });
      }
    }

    const bounceRate = stats.total > 0 ? ((stats.bounced / stats.total) * 100).toFixed(1) : '0';

    return NextResponse.json({
      ...stats,
      bounce_rate_pct: parseFloat(bounceRate),
      summary: `${stats.delivered} delivered, ${stats.bounced} bounced, ${stats.opened} opened — ${bounceRate}% bounce rate`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
