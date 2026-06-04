import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || 'rony-rex-dcb016';
  const step = searchParams.get('step') || 'all';

  try {
    if (step === '1' || step === 'all') {
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
      if (step === '1') return NextResponse.json({ step: 'query1', artist: artist.artist_name, ok: true });

      const artistId = artist.id;

      // Step 2: Submission stats
      const [subStats] = await sql`
        SELECT COALESCE(SUM(s.views_verified), 0)::int as total_views,
               COUNT(s.id)::int as total_submissions
        FROM submissions s
        JOIN campaigns c ON c.id = s.campaign_id
        JOIN campaign_claims cc ON cc.campaign_id = c.id
        WHERE cc.discovered_artist_id = ${artistId}
      `;
      if (step === '2') return NextResponse.json({ step: 'query2', ok: true, stats: subStats });

      // Step 3: Campaigns
      const campaigns = await sql`
        SELECT c.id FROM campaigns c
        JOIN campaign_claims cc ON cc.campaign_id = c.id
        WHERE cc.discovered_artist_id = ${artistId} AND c.status = 'active'
        LIMIT 5
      `;
      if (step === '3') return NextResponse.json({ step: 'query3', ok: true, count: campaigns.length });

      // Step 4: Related artists
      const related = await sql`
        SELECT da.id FROM discovered_artists da
        JOIN artist_profiles ap ON ap.artist_id = da.id
        WHERE da.id != ${artistId}
        LIMIT 1
      `;
      if (step === '4') return NextResponse.json({ step: 'query4', ok: true, related: related.length });

      return NextResponse.json({ ok: true, message: 'All queries pass', artist: artist.artist_name });
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack?.slice(0, 500) }, { status: 500 });
  }
}
