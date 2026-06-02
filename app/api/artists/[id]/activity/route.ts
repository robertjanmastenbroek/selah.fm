import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/artists/[id]/activity?limit=20&before=CURSOR
 * Returns activity events for an artist (paginated, cursor-based).
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const before = searchParams.get('before'); // cursor: ISO timestamp

    const { id: artistId } = params;

    let events;
    if (before) {
      events = await sql`
        SELECT * FROM activity_events
        WHERE artist_id = ${artistId} AND created_at < ${before}::timestamptz
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    } else {
      events = await sql`
        SELECT * FROM activity_events
        WHERE artist_id = ${artistId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    }

    const nextCursor = events.length === limit ? events[events.length - 1].created_at.toISOString() : null;

    return NextResponse.json({ events, nextCursor });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
