import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/resend
 * 
 * Receives bounce and complaint events from Resend.
 * Resend sends webhooks for: email.bounced, email.complained, email.delivered, email.opened, email.clicked
 * 
 * We only process bounces and complaints — marking the artist's email as bounced.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventType = body.type;

    // Only process bounce and complaint events
    if (eventType !== 'email.bounced' && eventType !== 'email.complained') {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const email = body.data?.to?.[0] || body.data?.email;
    if (!email) {
      return NextResponse.json({ ok: true, ignored: true, reason: 'no email in payload' });
    }

    // Find the artist by email in artist_audits
    const [artist] = await sql`
      SELECT da.id, da.artist_name 
      FROM discovered_artists da
      JOIN artist_audits aa ON aa.discovered_artist_id = da.id
      WHERE LOWER(aa.email_address) = LOWER(${email})
      LIMIT 1
    `;

    if (!artist) {
      return NextResponse.json({ ok: true, ignored: true, reason: `no artist found for ${email}` });
    }

    // Mark email as bounced
    await sql`
      UPDATE artist_audits 
      SET bounced_at = NOW(), bounce_reason = ${eventType}
      WHERE discovered_artist_id = ${artist.id}
        AND LOWER(email_address) = LOWER(${email})
    `;

    // Update outreach_log status
    await sql`
      UPDATE outreach_log 
      SET status = 'bounced'
      WHERE discovered_artist_id = ${artist.id} 
        AND channel = 'email' 
        AND status = 'sent'
    `;

    console.log(`📧 Bounce webhook: ${artist.artist_name} (${email}) — marked as bounced`);
    return NextResponse.json({ ok: true, artist: artist.artist_name, email });
  } catch (e: any) {
    console.error('Resend webhook error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
