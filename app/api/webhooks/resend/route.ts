import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/resend
 * 
 * Receives all Resend webhook events:
 * email.bounced, email.complained, email.delivered, email.opened, email.clicked
 * 
 * Updates outreach_log with delivery/open/click timestamps.
 * Marks bounced emails on artist_audits.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventType = body.type;
    const email = body.data?.to?.[0] || body.data?.email;

    if (!email) {
      return NextResponse.json({ ok: true, ignored: true, reason: 'no email in payload' });
    }

    // Find the artist by email
    const [artist] = await sql`
      SELECT da.id, da.artist_name 
      FROM discovered_artists da
      JOIN artist_audits aa ON aa.discovered_artist_id = da.id
      WHERE LOWER(aa.email_address) = LOWER(${email})
      LIMIT 1
    `;

    if (!artist) {
      // Try creator outreach
      const [creator] = await sql`
        SELECT id, display_name FROM discovered_creators
        WHERE LOWER(email_address) = LOWER(${email})
        LIMIT 1
      `;
      if (!creator) {
        return NextResponse.json({ ok: true, ignored: true, reason: `no match for ${email}` });
      }
      
      // Creator event handling
      if (eventType === 'email.bounced' || eventType === 'email.complained') {
        await sql`UPDATE discovered_creators SET email_confidence = 'bounced', updated_at = NOW() WHERE id = ${creator.id}`;
      }
      return NextResponse.json({ ok: true, creator: creator.display_name, event: eventType });
    }

    // Handle bounce/complaint
    if (eventType === 'email.bounced' || eventType === 'email.complained') {
      await sql`
        UPDATE artist_audits 
        SET bounced_at = NOW(), bounce_reason = ${eventType}
        WHERE discovered_artist_id = ${artist.id}
          AND LOWER(email_address) = LOWER(${email})
      `;
      await sql`
        UPDATE outreach_log 
        SET status = 'bounced'
        WHERE discovered_artist_id = ${artist.id} 
          AND channel = 'email' 
          AND status = 'sent'
      `;
      // Bounce logged
      return NextResponse.json({ ok: true, artist: artist.artist_name, event: eventType });
    }

    // Handle delivery — update the most recent matching outreach_log
    if (eventType === 'email.delivered') {
      await sql`
        UPDATE outreach_log 
        SET delivered_at = NOW()
        WHERE discovered_artist_id = ${artist.id} 
          AND channel = 'email' 
          AND delivered_at IS NULL
        ORDER BY created_at DESC LIMIT 1
      `;
      return NextResponse.json({ ok: true, artist: artist.artist_name, event: eventType });
    }

    // Handle open — only set first open
    if (eventType === 'email.opened') {
      await sql`
        UPDATE outreach_log 
        SET opened_at = NOW()
        WHERE discovered_artist_id = ${artist.id} 
          AND channel = 'email' 
          AND opened_at IS NULL
        ORDER BY created_at DESC LIMIT 1
      `;
      return NextResponse.json({ ok: true, artist: artist.artist_name, event: eventType });
    }

    // Handle click — only set first click
    if (eventType === 'email.clicked') {
      await sql`
        UPDATE outreach_log 
        SET clicked_at = NOW()
        WHERE discovered_artist_id = ${artist.id} 
          AND channel = 'email' 
          AND clicked_at IS NULL
        ORDER BY created_at DESC LIMIT 1
      `;
      return NextResponse.json({ ok: true, artist: artist.artist_name, event: eventType });
    }

    return NextResponse.json({ ok: true, ignored: true, reason: `unhandled event: ${eventType}` });
  } catch (e: any) {
    console.error('Resend webhook error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
