import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || 'rony-rex-dcb016';
  const step = searchParams.get('step') || 'all';

  try {
    const [artist] = await sql`
      SELECT da.id, da.artist_name, da.genres, da.monthly_listeners, da.followers,
             da.social_links, da.latest_track_name, da.latest_track_cover_url,
             da.instagram_handle, da.tiktok_handle, da.spotify_id,
             da.comment_count,
             ap.slug as profile_slug, ap.spotify_image_url, ap.total_followers,
             ap.total_streams, ap.total_platforms,
             ''::text as bio
      FROM discovered_artists da
      LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
      WHERE ap.slug = ${slug}
      LIMIT 1
    `;
    if (!artist) return NextResponse.json({ step: 'query1', result: 'no artist found' });

    const artistId = artist.id;
    const results: any[] = [];

    // Step 2: Donation stats
    try {
      const [donationStats] = await sql`
        SELECT COALESCE(SUM(cd.amount_cents), 0)::int as total_cents,
               COUNT(DISTINCT cd.id)::int as donation_count
        FROM discovered_artists da
        LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
        LEFT JOIN campaigns c ON c.id IN (SELECT cc2.campaign_id FROM campaign_claims cc2 WHERE cc2.discovered_artist_id = da.id)
        LEFT JOIN campaign_claims cc ON cc.discovered_artist_id = da.id AND cc.campaign_id = c.id
        LEFT JOIN campaign_donations cd ON cd.campaign_id = c.id
        WHERE da.id = ${artistId}
      `;
      results.push({ step: 'donation_stats', ok: true, data: donationStats });
    } catch (e: any) {
      results.push({ step: 'donation_stats', ok: false, error: e.message });
    }

    // Step 3: Submission stats
    try {
      const [subStats] = await sql`
        SELECT COALESCE(SUM(s.views_verified), 0)::int as total_views,
               COUNT(s.id)::int as total_submissions
        FROM submissions s
        JOIN campaigns c ON c.id = s.campaign_id
        JOIN campaign_claims cc ON cc.campaign_id = c.id
        WHERE cc.discovered_artist_id = ${artistId}
      `;
      results.push({ step: 'submission_stats', ok: true, data: subStats });
    } catch (e: any) {
      results.push({ step: 'submission_stats', ok: false, error: e.message });
    }

    // Step 4: Campaigns
    try {
      const campaigns = await sql`
        SELECT c.id, c.slug, c.track_title, c.cpm_rate_cents, c.total_budget_cents,
               c.status, c.created_at
        FROM campaigns c
        JOIN campaign_claims cc ON cc.campaign_id = c.id
        WHERE cc.discovered_artist_id = ${artistId}
          AND c.status = 'active'
        ORDER BY c.created_at DESC LIMIT 5
      `;
      results.push({ step: 'campaigns', ok: true, count: campaigns.length });
    } catch (e: any) {
      results.push({ step: 'campaigns', ok: false, error: e.message });
    }

    // Step 5: Related artists
    try {
      const related = await sql`
        SELECT da.id FROM discovered_artists da
        JOIN artist_profiles ap ON ap.artist_id = da.id
        WHERE da.id != ${artistId}
          AND da.genres::text ILIKE '%' || COALESCE(NULLIF(da.genres::text, ''), '')
          AND EXISTS (SELECT 1 FROM artist_tracks at WHERE at.artist_id = da.id AND at.enabled = true)
        ORDER BY da.monthly_listeners DESC NULLS LAST
        LIMIT 4
      `;
      results.push({ step: 'related_artists', ok: true, count: related.length });
    } catch (e: any) {
      results.push({ step: 'related_artists', ok: false, error: e.message });
    }

    return NextResponse.json({ artist: artist.artist_name, results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
