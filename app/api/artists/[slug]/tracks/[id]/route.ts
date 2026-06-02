import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/artists/[slug]/tracks/[id] — Update a track
 * DELETE /api/artists/[slug]/tracks/[id] — Remove a track
 */

export async function PATCH(
  request: Request,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const { getSession } = await import('@/lib/auth');
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { slug, id } = params;

    // Verify ownership
    const [track] = await sql`
      SELECT at.id FROM artist_tracks at
      JOIN discovered_artists da ON da.id = at.artist_id
      JOIN artist_profiles ap ON ap.artist_id = da.id
      JOIN campaign_claims cc ON cc.discovered_artist_id = da.id
      JOIN campaigns c ON c.id = cc.campaign_id
      WHERE ap.slug = ${slug} AND at.id = ${id} AND c.artist_id = ${session.id}
      LIMIT 1
    `;
    if (!track) {
      return NextResponse.json({ error: 'Track not found or not owned' }, { status: 404 });
    }

    const body = await request.json();
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (body.title !== undefined) { updates.push(`title = $${idx++}`); values.push(body.title); }
    if (body.spotify_url !== undefined) { updates.push(`spotify_url = $${idx++}`); values.push(body.spotify_url); }
    if (body.cover_art_url !== undefined) { updates.push(`cover_art_url = $${idx++}`); values.push(body.cover_art_url); }
    if (body.cpm_rate_cents !== undefined) { updates.push(`cpm_rate_cents = $${idx++}`); values.push(Math.max(1, Math.min(10000, parseInt(body.cpm_rate_cents)))); }
    if (body.enabled !== undefined) { updates.push(`enabled = $${idx++}`); values.push(body.enabled === true); }
    if (body.sort_order !== undefined) { updates.push(`sort_order = $${idx++}`); values.push(parseInt(body.sort_order)); }

    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      values.push(id);
      await sql.raw(
        `UPDATE artist_tracks SET ${updates.join(', ')} WHERE id = $${idx}`,
        values
      );
    }

    return NextResponse.json({ updated: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const { getSession } = await import('@/lib/auth');
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { slug, id } = params;

    // Verify ownership
    const [track] = await sql`
      SELECT at.id FROM artist_tracks at
      JOIN discovered_artists da ON da.id = at.artist_id
      JOIN artist_profiles ap ON ap.artist_id = da.id
      JOIN campaign_claims cc ON cc.discovered_artist_id = da.id
      JOIN campaigns c ON c.id = cc.campaign_id
      WHERE ap.slug = ${slug} AND at.id = ${id} AND c.artist_id = ${session.id}
      LIMIT 1
    `;
    if (!track) {
      return NextResponse.json({ error: 'Track not found or not owned' }, { status: 404 });
    }

    await sql`DELETE FROM artist_tracks WHERE id = ${id}`;

    return NextResponse.json({ deleted: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
