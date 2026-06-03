import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/artists/[slug] — Full artist profile with tracks, stats, activity
 */
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // Find artist by slug in artist_profiles or by name
    const [artistRow] = await sql`
      SELECT da.id, da.artist_name, da.genres, da.monthly_listeners, da.followers,
             da.social_links, da.latest_track_name, da.latest_track_cover_url,
             da.instagram_handle, da.tiktok_handle, da.spotify_id,
             da.comment_count,
             ap.slug as profile_slug, ap.spotify_image_url, ap.total_followers,
             ap.total_streams, ap.total_platforms
      FROM discovered_artists da
      LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
      WHERE ap.slug = ${slug}
      LIMIT 1
    `;

    if (!artistRow) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    const artistId = artistRow.id;

    // Fetch all campaigns (tracks) for this artist
    const tracks = await sql`
      SELECT c.id, c.track_title, c.track_url, c.cover_art_url, c.cpm_rate_cents,
             c.total_budget_cents, c.budget_remaining_cents, c.slug, c.status,
             c.platforms, c.created_at,
             COALESCE(v.approved_submissions, '0')::int as submissions_count,
             COALESCE(v.total_verified_views, '0')::int as total_views,
             COALESCE(v.pending_submissions, '0')::int as pending_submissions
      FROM campaigns c
      JOIN campaign_claims cc ON cc.campaign_id = c.id
      LEFT JOIN campaign_stats v ON v.id = c.id
      WHERE cc.discovered_artist_id = ${artistId}
      ORDER BY c.created_at DESC
    `;

    // Fetch donation totals across all campaigns
    const [donationStats] = await sql`
      SELECT COALESCE(SUM(cd.amount_cents), 0)::int as total_cents,
             COUNT(DISTINCT cd.id)::int as donation_count,
             COUNT(DISTINCT cd.donor_id)::int as supporter_count
      FROM campaigns c
      JOIN campaign_claims cc ON cc.campaign_id = c.id
      LEFT JOIN campaign_donations cd ON cd.campaign_id = c.id
      WHERE cc.discovered_artist_id = ${artistId}
    `;

    // Fetch recent activity
    const recentActivity = await sql`
      SELECT * FROM activity_events
      WHERE artist_id = ${artistId}
      ORDER BY created_at DESC LIMIT 10
    `;

    // Fetch recent submissions
    const recentSubmissions = await sql`
      SELECT s.id, s.content_url, s.platform, s.views_verified, s.reactions_count,
             s.created_at, c.track_title
      FROM submissions s
      JOIN campaigns c ON c.id = s.campaign_id
      JOIN campaign_claims cc ON cc.campaign_id = c.id
      WHERE cc.discovered_artist_id = ${artistId}
        AND s.review_status = 'approved'
      ORDER BY s.created_at DESC LIMIT 6
    `;

    // Fetch recent supporters
    const recentDonors = await sql`
      SELECT cd.donor_email, cd.amount_cents, cd.created_at, cd.message
      FROM campaigns c
      JOIN campaign_claims cc ON cc.campaign_id = c.id
      JOIN campaign_donations cd ON cd.campaign_id = c.id
      WHERE cc.discovered_artist_id = ${artistId}
      ORDER BY cd.created_at DESC LIMIT 10
    `;

    // Fetch recent comments
    const recentComments = await sql`
      SELECT pc.author_name, pc.content, pc.created_at
      FROM page_comments pc
      WHERE pc.page_type = 'artist' AND pc.page_id = ${artistId} AND pc.parent_id IS NULL AND pc.is_hidden = false
      ORDER BY pc.created_at DESC LIMIT 5
    `;

    // Fetch balance
    const [balanceRow] = await sql`
      SELECT balance_cents FROM artist_profiles WHERE artist_id = ${artistId}
    `;

    return NextResponse.json({
      artist: artistRow,
      tracks,
      stats: {
        total_tracks: tracks.length,
        total_donations_cents: donationStats.total_cents,
        donation_count: donationStats.donation_count,
        supporter_count: donationStats.supporter_count,
        total_views: tracks.reduce((s: number, t: any) => s + (t.total_views || 0), 0),
        total_submissions: tracks.reduce((s: number, t: any) => s + (t.submissions_count || 0), 0),
      },
      balance_cents: balanceRow?.balance_cents || 0,
      recent_activity: recentActivity,
      recent_submissions: recentSubmissions,
      recent_donors: recentDonors,
      recent_comments: recentComments,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * PATCH /api/artists/[slug] — Update artist profile (claimed/linked artists only)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { slug } = params;

    // Find the artist
    const [artistRow] = await sql`
      SELECT da.id, da.artist_name FROM discovered_artists da
      JOIN artist_profiles ap ON ap.artist_id = da.id
      WHERE ap.slug = ${slug} LIMIT 1
    `;
    if (!artistRow) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    // Verify the user has claimed this artist
    const [profile] = await sql`
      SELECT ap.claimed_by_user_id FROM artist_profiles ap
      WHERE ap.artist_id = ${artistRow.id} LIMIT 1
    `;
    const isOwner = profile?.claimed_by_user_id === user.id;
    if (!isOwner) {
      return NextResponse.json({ error: 'You have not claimed this artist profile' }, { status: 403 });
    }

    const body = await request.json();

    // Update bio in artist_audits
    if (body.bio !== undefined && body.bio !== null) {
      const [existingAudit] = await sql`
        SELECT id FROM artist_audits WHERE discovered_artist_id = ${artistRow.id} LIMIT 1
      `;
      if (existingAudit) {
        await sql`UPDATE artist_audits SET bio = ${body.bio}, audited_at = NOW() WHERE id = ${existingAudit.id}`;
      } else {
        await sql`INSERT INTO artist_audits (discovered_artist_id, bio, audited_at) VALUES (${artistRow.id}, ${body.bio}, NOW())`;
      }
    }

    // Update social handles in discovered_artists
    if (body.instagram_handle !== undefined) {
      await sql`UPDATE discovered_artists SET instagram_handle = ${body.instagram_handle} WHERE id = ${artistRow.id}`;
    }
    if (body.tiktok_handle !== undefined) {
      await sql`UPDATE discovered_artists SET tiktok_handle = ${body.tiktok_handle} WHERE id = ${artistRow.id}`;
    }

    // Update artist_profiles
    if (body.spotify_image_url !== undefined) {
      await sql`UPDATE artist_profiles SET spotify_image_url = ${body.spotify_image_url} WHERE artist_id = ${artistRow.id}`;
    }
    if (body.genres !== undefined) {
      await sql`UPDATE discovered_artists SET genres = ${body.genres} WHERE id = ${artistRow.id}`;
    }

    return NextResponse.json({ updated: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
