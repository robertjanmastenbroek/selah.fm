import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { generateOutreachVideoAsync, generateCaption, generateDMTemplate } from '@/lib/video-generator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/outreach/videos
 * ?status=pending_review|approved|generating|failed&limit=20
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending_review';
  const limit = parseInt(searchParams.get('limit') || '30');

  try {
    // Video queue
    if (status === 'queue') {
      const artists = await sql`
        SELECT da.id as artist_id, da.artist_name, da.latest_track_name as track_name,
               aa.instagram_handle, c.id as campaign_id, c.slug as campaign_slug,
               c.cover_art_url, da.genres
        FROM artist_audits aa
        JOIN discovered_artists da ON da.id = aa.discovered_artist_id
        JOIN campaign_claims cc ON cc.discovered_artist_id = da.id
        JOIN campaigns c ON c.id = cc.campaign_id
        WHERE aa.instagram_handle IS NOT NULL AND aa.instagram_handle != ''
          AND (aa.email_address IS NULL OR aa.email_address = '')
          AND NOT EXISTS (SELECT 1 FROM instagram_posts ip WHERE ip.campaign_slug = c.slug)
        ORDER BY RANDOM() LIMIT ${limit}
      `;
      return NextResponse.json({ artists });
    }

    // Videos by status — 'all' returns everything with stats
    let videos;
    if (status === 'all') {
      videos = await sql`
        SELECT ip.*, da.artist_name, da.latest_track_name as track_name
        FROM instagram_posts ip
        LEFT JOIN discovered_artists da ON da.artist_name = ip.artist_name
        ORDER BY ip.created_at DESC
        LIMIT ${limit}
      `;
    } else {
      videos = await sql`
      SELECT ip.*, da.artist_name, da.latest_track_name as track_name
      FROM instagram_posts ip
      LEFT JOIN discovered_artists da ON da.artist_name = ip.artist_name
      WHERE ip.status = ${status}
      ORDER BY ip.created_at DESC
      LIMIT ${limit}
    `;
    }

    // Stats
    const [{ pending }, { approved }, { generating }, { posted }] = await Promise.all([
      sql`SELECT COUNT(*)::int as count FROM instagram_posts WHERE status = 'pending_review'`,
      sql`SELECT COUNT(*)::int as count FROM instagram_posts WHERE status = 'approved'`,
      sql`SELECT COUNT(*)::int as count FROM instagram_posts WHERE status = 'generating'`,
      sql`SELECT COUNT(*)::int as count FROM instagram_posts WHERE status = 'posted'`,
    ]);

    return NextResponse.json({
      videos,
      stats: {
        pending: pending.count,
        approved: approved.count,
        generating: generating.count,
        posted: posted.count,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/outreach/videos
 * { action: "generate", artist_id } → single artist generation
 * { action: "batch", count } → batch generation
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'store_local') {
      // Store a locally-generated video (from MPT on user's Mac → Supabase Storage)
      const [post] = await sql`
        INSERT INTO instagram_posts (artist_name, track_name, instagram_handle, cover_art_url, video_url, caption, campaign_slug, status)
        VALUES (${body.artist_name}, ${body.track_name}, ${body.instagram_handle}, ${body.cover_art_url}, ${body.video_url}, ${body.caption}, ${body.campaign_slug}, 'pending_review')
        RETURNING id
      `;
      await sql`INSERT INTO instagram_outreach_log (discovered_artist_id, campaign_id, instagram_handle, message_text, response_type) VALUES (${body.artist_id}, ${body.campaign_id}, ${body.instagram_handle}, ${body.dm_message || ''}, 'pending')`;
      return NextResponse.json({ post_id: post.id, status: 'pending_review', source: 'local_mpt' });
    }

    if (action === 'generate') {
      const [artist] = await sql`
        SELECT da.id as artist_id, da.artist_name, da.latest_track_name as track_name,
               aa.instagram_handle, c.id as campaign_id, c.slug as campaign_slug,
               c.cover_art_url, da.genres
        FROM artist_audits aa
        JOIN discovered_artists da ON da.id = aa.discovered_artist_id
        JOIN campaign_claims cc ON cc.discovered_artist_id = da.id
        JOIN campaigns c ON c.id = cc.campaign_id
        WHERE da.id = ${body.artist_id}
        LIMIT 1
      `;
      if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

      let genre = 'indie';
      try { const g = typeof artist.genres === 'string' ? JSON.parse(artist.genres) : (artist.genres || []); if (Array.isArray(g) && g.length > 0) genre = g[0]; } catch (e: any) { console.error('Unhandled error in api/admin/outreach/videos/route.ts:', e); }

      const result = await generateOutreachVideoAsync({
        artistName: artist.artist_name, trackName: artist.track_name, genre,
        coverArtUrl: artist.cover_art_url || '/images/og-image.jpg',
        campaignSlug: artist.campaign_slug, instagramHandle: artist.instagram_handle,
      });

      if (!result) {
        const caption = generateCaption({ artistName: artist.artist_name, trackName: artist.track_name, genre, coverArtUrl: artist.cover_art_url, campaignSlug: artist.campaign_slug, instagramHandle: artist.instagram_handle });
        const dmTemplate = await generateDMTemplate({ artistName: artist.artist_name, trackName: artist.track_name, genre, coverArtUrl: artist.cover_art_url, campaignSlug: artist.campaign_slug, instagramHandle: artist.instagram_handle });
        const [post] = await sql`
          INSERT INTO instagram_posts (artist_name, track_name, instagram_handle, cover_art_url, video_url, caption, campaign_slug, status, error_message)
          VALUES (${artist.artist_name}, ${artist.track_name}, ${artist.instagram_handle}, ${artist.cover_art_url}, ${artist.cover_art_url}, ${caption}, ${artist.campaign_slug}, 'pending_review', 'MPT unavailable — using cover art')
          RETURNING id
        `;
        await sql`INSERT INTO instagram_outreach_log (discovered_artist_id, campaign_id, instagram_handle, message_text, response_type) VALUES (${artist.artist_id}, ${artist.campaign_id}, ${artist.instagram_handle}, ${dmTemplate}, 'pending')`;
        return NextResponse.json({ post_id: post.id, status: 'pending_review', note: 'MPT unavailable, cover art used' });
      }

      const caption = generateCaption({ artistName: artist.artist_name, trackName: artist.track_name, genre, coverArtUrl: artist.cover_art_url, campaignSlug: artist.campaign_slug, instagramHandle: artist.instagram_handle });
      const dmTemplate = await generateDMTemplate({ artistName: artist.artist_name, trackName: artist.track_name, genre, coverArtUrl: artist.cover_art_url, campaignSlug: artist.campaign_slug, instagramHandle: artist.instagram_handle });

      const [post] = await sql`
        INSERT INTO instagram_posts (artist_name, track_name, instagram_handle, cover_art_url, caption, campaign_slug, status, mpt_task_id)
        VALUES (${artist.artist_name}, ${artist.track_name}, ${artist.instagram_handle}, ${artist.cover_art_url}, ${caption}, ${artist.campaign_slug}, 'generating', ${result.mptTaskId})
        RETURNING id
      `;

      return NextResponse.json({ post_id: post.id, mpt_task_id: result.mptTaskId, status: 'generating' });
    }

    if (action === 'batch') {
      const count = Math.min(body.count || 5, 10);
      const artists = await sql`
        SELECT da.id as artist_id, da.artist_name, da.latest_track_name as track_name,
               aa.instagram_handle, c.id as campaign_id, c.slug as campaign_slug,
               c.cover_art_url, da.genres
        FROM artist_audits aa
        JOIN discovered_artists da ON da.id = aa.discovered_artist_id
        JOIN campaign_claims cc ON cc.discovered_artist_id = da.id
        JOIN campaigns c ON c.id = cc.campaign_id
        WHERE aa.instagram_handle IS NOT NULL AND aa.instagram_handle != ''
          AND (aa.email_address IS NULL OR aa.email_address = '')
          AND NOT EXISTS (SELECT 1 FROM instagram_posts ip WHERE ip.campaign_slug = c.slug)
        ORDER BY RANDOM() LIMIT ${count}
      `;

      const results: any[] = [];
      for (const artist of artists) {
        try {
          let genre = 'indie';
          try { const g = typeof artist.genres === 'string' ? JSON.parse(artist.genres) : (artist.genres || []); if (Array.isArray(g) && g.length > 0) genre = g[0]; } catch (e: any) { console.error('Unhandled error in api/admin/outreach/videos/route.ts:', e); }

          const result = await generateOutreachVideoAsync({
            artistName: artist.artist_name, trackName: artist.track_name, genre,
            coverArtUrl: artist.cover_art_url || '/images/og-image.jpg',
            campaignSlug: artist.campaign_slug, instagramHandle: artist.instagram_handle,
          });

          const caption = generateCaption({ artistName: artist.artist_name, trackName: artist.track_name, genre, coverArtUrl: artist.cover_art_url, campaignSlug: artist.campaign_slug, instagramHandle: artist.instagram_handle });
          const dmTemplate = await generateDMTemplate({ artistName: artist.artist_name, trackName: artist.track_name, genre, coverArtUrl: artist.cover_art_url, campaignSlug: artist.campaign_slug, instagramHandle: artist.instagram_handle });

          if (result) {
            const [post] = await sql`
              INSERT INTO instagram_posts (artist_name, track_name, instagram_handle, cover_art_url, caption, campaign_slug, status, mpt_task_id)
              VALUES (${artist.artist_name}, ${artist.track_name}, ${artist.instagram_handle}, ${artist.cover_art_url}, ${caption}, ${artist.campaign_slug}, 'generating', ${result.mptTaskId})
              RETURNING id
            `;
            results.push({ artist: artist.artist_name, post_id: post.id, mpt_task_id: result.mptTaskId });
          } else {
            const [post] = await sql`
              INSERT INTO instagram_posts (artist_name, track_name, instagram_handle, cover_art_url, video_url, caption, campaign_slug, status, error_message)
              VALUES (${artist.artist_name}, ${artist.track_name}, ${artist.instagram_handle}, ${artist.cover_art_url}, ${artist.cover_art_url}, ${caption}, ${artist.campaign_slug}, 'pending_review', 'MPT unavailable')
              RETURNING id
            `;
            results.push({ artist: artist.artist_name, post_id: post.id, fallback: true });
          }

          if (dmTemplate) {
            await sql`INSERT INTO instagram_outreach_log (discovered_artist_id, campaign_id, instagram_handle, message_text, response_type) VALUES (${artist.artist_id}, ${artist.campaign_id}, ${artist.instagram_handle}, ${dmTemplate}, 'pending')`;
          }
        } catch (e: any) {
          results.push({ artist: artist.artist_name, error: e.message });
        }
      }

      return NextResponse.json({ generated: results.length, results });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/outreach/videos
 * { id, status: "approved" | "rejected" | "generating" }
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (status === 'approved') {
      await sql`UPDATE instagram_posts SET status = 'approved', reviewed_at = NOW() WHERE id = ${id}`;
    } else if (status === 'rejected') {
      await sql`UPDATE instagram_posts SET status = 'rejected', reviewed_at = NOW() WHERE id = ${id}`;
    } else if (status === 'generating') {
      // Retry: resubmit to MPT
      const [post] = await sql`SELECT * FROM instagram_posts WHERE id = ${id}`;
      if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      
      const [artist] = await sql`
        SELECT da.id, c.id as campaign_id FROM discovered_artists da
        JOIN campaign_claims cc ON cc.discovered_artist_id = da.id
        JOIN campaigns c ON c.id = cc.campaign_id
        WHERE da.artist_name = ${post.artist_name} LIMIT 1
      `;
      if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

      const result = await generateOutreachVideoAsync({
        artistName: post.artist_name, trackName: post.track_name, genre: 'indie',
        coverArtUrl: post.cover_art_url, campaignSlug: post.campaign_slug,
        instagramHandle: post.instagram_handle,
      });

      if (result) {
        await sql`UPDATE instagram_posts SET status = 'generating', mpt_task_id = ${result.mptTaskId}, error_message = NULL WHERE id = ${id}`;
        return NextResponse.json({ mpt_task_id: result.mptTaskId });
      }
      return NextResponse.json({ error: 'MPT unavailable' }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
