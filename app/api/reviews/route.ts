import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reviews?artistId=UUID — Fetch reviews for an artist
 * POST /api/reviews — Create or update a review
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');
    if (!artistId) return NextResponse.json({ error: 'artistId required' }, { status: 400 });

    const reviews = await sql`
      SELECT fr.id, fr.rating, fr.title, fr.content, fr.created_at, fr.updated_at,
             fr.is_featured, fr.response_text, fr.response_at,
             u.display_name, u.id as user_id
      FROM fan_reviews fr
      JOIN users u ON u.id = fr.user_id
      WHERE fr.artist_id = ${artistId}::uuid AND NOT fr.is_hidden
      ORDER BY fr.is_featured DESC, fr.created_at DESC
      LIMIT 50
    `;

    return NextResponse.json({ reviews });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { artistId, rating, title, content } = await request.json();

    if (!artistId || !rating || !content) {
      return NextResponse.json({ error: 'artistId, rating (1-5), and content required' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
    }
    if (content.length < 10 || content.length > 2000) {
      return NextResponse.json({ error: 'Content must be 10-2000 characters' }, { status: 400 });
    }

    const [review] = await sql`
      INSERT INTO fan_reviews (user_id, artist_id, rating, title, content)
      VALUES (${user.id}, ${artistId}::uuid, ${rating}, ${title || null}, ${content.trim()})
      ON CONFLICT (user_id, artist_id)
      DO UPDATE SET rating = ${rating}, title = ${title || null}, content = ${content.trim()}, updated_at = NOW()
      RETURNING id, rating, title, content, created_at, updated_at
    `;

    return NextResponse.json({ review });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
