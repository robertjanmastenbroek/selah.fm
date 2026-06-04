import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/artist/submissions
 * Returns all submissions for the artist's campaigns.
 * Authenticated — only the artist can see their own submissions.
 */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const submissions = await sql`
      SELECT s.id, s.content_url, s.platform, s.review_status, s.payout_status,
             s.views_verified, s.payout_amount_cents, s.submitted_at, s.created_at,
             s.creator_id,
             c.track_title, c.slug as campaign_slug,
             u.display_name as creator_name,
             u.profile_image_url as creator_avatar
      FROM submissions s
      JOIN campaigns c ON c.id = s.campaign_id
      JOIN campaign_claims cc ON cc.campaign_id = c.id
      JOIN discovered_artists da ON da.id = cc.discovered_artist_id
      JOIN artist_profiles ap ON ap.artist_id = da.id
      LEFT JOIN users u ON u.id = s.creator_id
      WHERE ap.claimed_by_user_id = ${user.id}
      ORDER BY s.created_at DESC
      LIMIT 50
    `;

    // Unread count: submissions created in last 24h that are pending review
    const unread = submissions.filter((s: any) => {
      const age = Date.now() - new Date(s.created_at).getTime();
      return age < 24 * 60 * 60 * 1000 && s.review_status === 'pending';
    }).length;

    return NextResponse.json({ submissions, unread });
  } catch (e: any) {
    console.error('[artist/submissions] Error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
