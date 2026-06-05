import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/artists/[slug]/tracks
 * Returns the artist's track catalog.
 */
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;

    const [artist] = await sql`
      SELECT da.id FROM discovered_artists da
      JOIN artist_profiles ap ON ap.artist_id = da.id
      WHERE ap.slug = ${slug} LIMIT 1
    `;
    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    const tracks = await sql`
      SELECT id, title, spotify_url, cover_art_url, duration_ms,
             cpm_rate_cents, enabled, sort_order, created_at
      FROM artist_tracks
      WHERE artist_id = ${artist.id}
      ORDER BY sort_order ASC, created_at DESC
    `;

    return NextResponse.json({ tracks });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST /api/artists/[slug]/tracks — Add a track to an artist's catalog
 * Body: { title, spotify_url?, cover_art_url?, cpm_rate_cents?, enabled? }
 */
export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const slug = params.slug;

    // Find artist + verify ownership
    const [artist] = await sql`
      SELECT da.id FROM discovered_artists da
      JOIN artist_profiles ap ON ap.artist_id = da.id
      JOIN campaign_claims cc ON cc.discovered_artist_id = da.id
      JOIN campaigns c ON c.id = cc.campaign_id
      WHERE ap.slug = ${slug} AND c.artist_id = ${user.id}
      LIMIT 1
    `;
    if (!artist) {
      return NextResponse.json({ error: 'Artist not found or not claimed' }, { status: 404 });
    }

    const body = await request.json();
    const { title, spotify_url, cover_art_url, cpm_rate_cents, enabled } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Track title is required' }, { status: 400 });
    }

    // Get next sort order
    const [{ maxOrder }] = await sql`
      SELECT COALESCE(MAX(sort_order), 0) + 1 as max_order FROM artist_tracks WHERE artist_id = ${artist.id}
    `;

    const [track] = await sql`
      INSERT INTO artist_tracks (artist_id, title, spotify_url, cover_art_url, cpm_rate_cents, enabled, sort_order)
      VALUES (${artist.id}, ${title.trim()}, ${spotify_url || null}, ${cover_art_url || null},
              ${Math.max(1, Math.min(10000, parseInt(cpm_rate_cents) || 10))},
              ${enabled !== false}, ${maxOrder})
      RETURNING id, title, spotify_url, cover_art_url, cpm_rate_cents, enabled
    `;

    return NextResponse.json({ track }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
