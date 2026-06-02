import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/artists/[slug]/activity?limit=20&before=CURSOR
 * Returns activity events for an artist (paginated, cursor-based).
 */
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const before = searchParams.get('before');

    const slug = params.slug;

    // Look up artist by slug
    const [artist] = await sql`
      SELECT da.id FROM discovered_artists da
      JOIN artist_profiles ap ON ap.artist_id = da.id
      WHERE ap.slug = ${slug} LIMIT 1
    `;
    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    let events;
    if (before) {
      events = await sql`
        SELECT * FROM activity_events
        WHERE artist_id = ${artist.id} AND created_at < ${before}::timestamptz
        ORDER BY created_at DESC LIMIT ${limit}
      `;
    } else {
      events = await sql`
        SELECT * FROM activity_events
        WHERE artist_id = ${artist.id}
        ORDER BY created_at DESC LIMIT ${limit}
      `;
    }

    const nextCursor = events.length === limit ? events[events.length - 1].created_at.toISOString() : null;

    return NextResponse.json({ events, nextCursor });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
