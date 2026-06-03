import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/artists/[slug]/follow
 * Returns whether the current user follows this artist.
 */
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ following: false });

  try {
    const [artist] = await sql`
      SELECT id FROM discovered_artists da
      JOIN artist_profiles ap ON ap.artist_id = da.id
      WHERE ap.slug = ${params.slug} LIMIT 1
    `;
    if (!artist) return NextResponse.json({ following: false });

    const [follow] = await sql`
      SELECT id FROM artist_follows
      WHERE user_id = ${user.id} AND artist_id = ${artist.id}
      LIMIT 1
    `;

    return NextResponse.json({ following: !!follow });
  } catch {
    return NextResponse.json({ following: false });
  }
}

/**
 * POST /api/artists/[slug]/follow
 * Toggle follow/unfollow for this artist.
 */
export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const [artist] = await sql`
      SELECT id FROM discovered_artists da
      JOIN artist_profiles ap ON ap.artist_id = da.id
      WHERE ap.slug = ${params.slug} LIMIT 1
    `;
    if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

    const [existing] = await sql`
      SELECT id FROM artist_follows
      WHERE user_id = ${user.id} AND artist_id = ${artist.id}
      LIMIT 1
    `;

    if (existing) {
      await sql`DELETE FROM artist_follows WHERE id = ${existing.id}`;
      return NextResponse.json({ following: false });
    } else {
      await sql`
        INSERT INTO artist_follows (user_id, artist_id)
        VALUES (${user.id}, ${artist.id})
      `;
      return NextResponse.json({ following: true });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
