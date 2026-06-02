import { NextResponse } from 'next/server';
import sql from '@/lib/db';

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
 * PATCH /api/artists/[slug] — Update artist profile (claimed artists only)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { getSession } = await import('@/lib/auth');
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { slug } = params;

    // Find the artist
    const [artistRow] = await sql`
      SELECT da.id FROM discovered_artists da
      JOIN artist_profiles ap ON ap.artist_id = da.id
      WHERE ap.slug = ${slug} LIMIT 1
    `;
    if (!artistRow) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    // Verify the user has claimed this artist
    const [claim] = await sql`
      SELECT cc.id FROM campaign_claims cc
      JOIN campaigns c ON c.id = cc.campaign_id
      WHERE cc.discovered_artist_id = ${artistRow.id} AND c.artist_id = ${session.id}
      LIMIT 1
    `;
    if (!claim) {
      // Also check if user's display name matches artist name
      const [profile] = await sql`
        SELECT display_name FROM users WHERE id = ${session.id}
      `;
      const userName = profile?.display_name || '';
      const [match] = await sql`
        SELECT id FROM discovered_artists WHERE id = ${artistRow.id} AND artist_name ILIKE ${userName}
        LIMIT 1
      `;
      if (!match) {
        return NextResponse.json({ error: 'You have not claimed this artist profile' }, { status: 403 });
      }
    }

    const body = await request.json();
    const updates: string[] = [];
    const values: any[] = [];

    // Update artist_profiles fields
    if (body.bio !== undefined) {
      // Store bio in artist_audits
      updates.push(`bio = $${updates.length + 1}`);
      values.push(body.bio);
    }

    if (updates.length > 0) {
      values.push(artistRow.id);
      await sql.raw(
        `UPDATE artist_audits SET ${updates.join(', ')} WHERE discovered_artist_id = $${values.length}`,
        values
      );
    }

    // Update per-track CPM rates
    if (body.tracks && Array.isArray(body.tracks)) {
      for (const track of body.tracks) {
        if (track.id && track.cpm_rate_cents !== undefined) {
          await sql`
            UPDATE campaigns SET cpm_rate_cents = ${track.cpm_rate_cents}
            WHERE id = ${track.id} AND artist_id = ${session.id}
          `;
        }
      }
    }

    return NextResponse.json({ updated: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
