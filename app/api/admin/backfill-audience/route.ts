import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { addToAudience } from '@/lib/email-outreach';
import { isAdminRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/backfill-audience
 * 
 * Backfills all previously-emailed artists into the Resend audience.
 * One-time operation — safe to rerun (Resend deduplicates by email).
 */
export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!audienceId) {
    return NextResponse.json({ error: 'RESEND_AUDIENCE_ID not configured' }, { status: 500 });
  }

  try {
    const artists = await sql`
      SELECT da.artist_name, aa.email_address
      FROM discovered_artists da
      JOIN artist_audits aa ON aa.discovered_artist_id = da.id
      WHERE aa.email_confidence = 'verified'
        AND EXISTS (SELECT 1 FROM outreach_log ol WHERE ol.discovered_artist_id = da.id AND ol.channel = 'email')
    `;

    let added = 0;
    const errors: string[] = [];

    for (const artist of artists) {
      try {
        await addToAudience(artist.email_address, artist.artist_name);
        added++;
      } catch (e: any) {
        errors.push(`${artist.artist_name}: ${e.message}`);
      }
    }

    return NextResponse.json({
      total: artists.length,
      added,
      errors: errors.length > 0 ? errors.slice(0, 10) : [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
