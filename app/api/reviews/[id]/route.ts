import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reviews/[id] — Artist responds to a review
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { response } = await request.json();
    if (!response?.trim()) {
      return NextResponse.json({ error: 'Response text required' }, { status: 400 });
    }

    // Verify the user owns the artist this review is about
    const [review] = await sql`
      SELECT fr.id, fr.artist_id
      FROM fan_reviews fr
      WHERE fr.id = ${params.id}::uuid LIMIT 1
    `;
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    const [claim] = await sql`
      SELECT cc.id FROM campaign_claims cc
      WHERE cc.discovered_artist_id = ${review.artist_id} AND cc.claimed_by = ${user.id}
      LIMIT 1
    `;
    if (!claim) {
      const [profile] = await sql`
        SELECT id FROM artist_profiles WHERE artist_id = ${review.artist_id} AND claimed_by_user_id = ${user.id} LIMIT 1
      `;
      if (!profile) {
        return NextResponse.json({ error: 'You must claim this artist to respond' }, { status: 403 });
      }
    }

    await sql`
      UPDATE fan_reviews SET response_text = ${response.trim()}, response_at = NOW()
      WHERE id = ${params.id}::uuid
    `;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
