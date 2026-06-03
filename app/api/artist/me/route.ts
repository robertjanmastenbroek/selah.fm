import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/artist/me
 * Returns the artist profile for the current logged-in user.
 * Uses claimed_by_user_id to find the linked artist profile.
 */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    // Find artist by claimed_by_user_id
    const [artist] = await sql`
      SELECT da.id, da.artist_name, da.genres, da.monthly_listeners, da.followers,
             da.instagram_handle, da.tiktok_handle, da.spotify_id, da.status,
             ap.slug as profile_slug, ap.spotify_image_url, ap.total_followers,
             ap.total_streams, ap.total_platforms
      FROM artist_profiles ap
      JOIN discovered_artists da ON da.id = ap.artist_id
      WHERE ap.claimed_by_user_id = ${user.id}
      LIMIT 1
    `;

    if (!artist) {
      return NextResponse.json({ artist: null, slug: '', tracks: [], stats: {} });
    }

    // Fetch bio from artist_audits
    const [audit] = await sql`
      SELECT bio FROM artist_audits WHERE discovered_artist_id = ${artist.id} LIMIT 1
    `;

    // Fetch tracks (campaigns for this artist)
    const tracks = await sql`
      SELECT c.id, c.track_title, c.track_url, c.cover_art_url, c.cpm_rate_cents,
             c.total_budget_cents, c.budget_remaining_cents, c.slug, c.status,
             c.created_at
      FROM campaigns c
      JOIN campaign_claims cc ON cc.campaign_id = c.id
      WHERE cc.discovered_artist_id = ${artist.id}
      ORDER BY c.created_at DESC LIMIT 50
    `;

    // Compute stats
    const [donationStats] = await sql`
      SELECT COALESCE(SUM(cd.amount_cents), 0)::int as total_cents,
             COUNT(DISTINCT cd.donor_id)::int as supporter_count
      FROM campaigns c
      JOIN campaign_claims cc ON cc.campaign_id = c.id
      LEFT JOIN campaign_donations cd ON cd.campaign_id = c.id
      WHERE cc.discovered_artist_id = ${artist.id}
    `;

    const [submissionStats] = await sql`
      SELECT
        COALESCE(SUM(s.views_verified), 0)::int as total_views,
        COUNT(s.id)::int as total_submissions,
        COUNT(CASE WHEN s.review_status = 'approved' THEN 1 END)::int as approved_submissions
      FROM submissions s
      JOIN campaigns c ON c.id = s.campaign_id
      JOIN campaign_claims cc ON cc.campaign_id = c.id
      WHERE cc.discovered_artist_id = ${artist.id}
    `;

    return NextResponse.json({
      artist,
      slug: artist.profile_slug || '',
      bio: audit?.bio || '',
      tracks,
      stats: {
        total_tracks: tracks.length,
        total_donations_cents: donationStats.total_cents,
        supporter_count: donationStats.supporter_count,
        total_views: submissionStats.total_views,
        total_submissions: submissionStats.total_submissions,
      },
    });
  } catch (e: any) {
    console.error('Artist/me error:', e.message);
    return NextResponse.json({ artist: null, slug: '', tracks: [], stats: {}, error: e.message });
  }
}
