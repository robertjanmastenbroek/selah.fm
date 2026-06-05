import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

/**
 * POST /api/ratings — Rate a user after a transaction completes
 * GET /api/ratings?userId=X — Get all ratings for a user (with avg)
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { submissionId, score, comment, role } = await request.json();

    if (!submissionId || !score || !role) {
      return NextResponse.json({ error: 'submissionId, score, and role are required' }, { status: 400 });
    }
    if (score < 1 || score > 5) {
      return NextResponse.json({ error: 'Score must be 1-5' }, { status: 400 });
    }
    if (!['artist', 'creator'].includes(role)) {
      return NextResponse.json({ error: 'Role must be artist or creator' }, { status: 400 });
    }

    // Fetch submission to verify ownership
    const subs = await sql`
      SELECT s.id, s.creator_id, s.review_status, s.payout_status, c.artist_id
      FROM submissions s
      JOIN campaigns c ON c.id = s.campaign_id
      WHERE s.id = ${submissionId}
    `;
    if (subs.length === 0) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = subs[0];

    // Must be paid before rating
    if (sub.payout_status !== 'paid') {
      return NextResponse.json({ error: 'Rating only allowed after payout completes' }, { status: 400 });
    }

    // Verify reviewer is the right person
    let revieweeId: string;
    if (role === 'artist') {
      if (sub.artist_id !== user.id) {
        return NextResponse.json({ error: 'Only the campaign artist can rate the creator' }, { status: 403 });
      }
      revieweeId = sub.creator_id;
    } else {
      if (sub.creator_id !== user.id) {
        return NextResponse.json({ error: 'Only the submitting creator can rate the artist' }, { status: 403 });
      }
      revieweeId = sub.artist_id;
    }

    // Check no duplicate
    const existing = await sql`
      SELECT id FROM ratings
      WHERE submission_id = ${submissionId} AND reviewer_id = ${user.id}
    `;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'You already rated this submission' }, { status: 409 });
    }

    const result = await sql`
      INSERT INTO ratings (submission_id, reviewer_id, reviewee_id, reviewer_role, score, comment)
      VALUES (${submissionId}, ${user.id}, ${revieweeId}, ${role}, ${score}, ${comment || null})
      RETURNING *
    `;

    // Notify the reviewee
    const roleLabel = role === 'artist' ? 'an artist' : 'a creator';
    await sql`
      INSERT INTO notifications (user_id, type, message, link)
      VALUES (${revieweeId}, 'system', ${`You received a ${score}-star rating from ${roleLabel}!`}, '/settings')
    `;

    return NextResponse.json(result[0]);
  } catch (e: any) {
    console.error('Rating POST error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const submissionId = searchParams.get('submissionId');

    if (submissionId) {
      // Get ratings for a specific submission (to show on campaign/payout view)
      const ratings = await sql`
        SELECT r.*, u.display_name as reviewer_name
        FROM ratings r
        JOIN users u ON u.id = r.reviewer_id
        WHERE r.submission_id = ${submissionId}
        ORDER BY r.created_at DESC
      `;
      return NextResponse.json(ratings);
    }

    if (userId) {
      // Get all ratings for a user with average
      const [avgRow] = await sql`
        SELECT COALESCE(ROUND(AVG(score)::numeric, 1), 0) as avg, COUNT(*)::int as count
        FROM ratings WHERE reviewee_id = ${userId}
      `;

      const ratings = await sql`
        SELECT r.*, u.display_name as reviewer_name
        FROM ratings r
        JOIN users u ON u.id = r.reviewer_id
        WHERE r.reviewee_id = ${userId}
        ORDER BY r.created_at DESC
        LIMIT 20
      `;

      return NextResponse.json({
        average: parseFloat(avgRow?.avg || '0'),
        count: avgRow?.count || 0,
        ratings,
      });
    }

    return NextResponse.json({ error: 'Provide userId or submissionId' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
