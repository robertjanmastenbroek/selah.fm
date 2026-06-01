import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { generateOutreachVideo } from '@/lib/video-generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 600;

/**
 * GET /api/cron/generate-outreach-videos
 * 
 * Automated MoneyPrinterTurbo-powered video generation pipeline.
 * Picks 5 artists → DeepSeek script → MPT video → stores → notifies.
 * Runs at 08:00 UTC via Railway cron dispatcher.
 * 
 * When MPT is running (./scripts/start-mpt.sh), generates actual videos.
 * When MPT is unavailable, stores cover art + caption for manual posting.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const count = parseInt(searchParams.get('count') || '5');
  const results: any[] = [];

  try {
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
        AND aa.bounced_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM instagram_posts ip WHERE ip.campaign_slug = c.slug)
      ORDER BY RANDOM() LIMIT ${count}
    `;

    for (const artist of artists) {
      try {
        let genre = 'indie';
        try {
          const g = typeof artist.genres === 'string' ? JSON.parse(artist.genres) : (artist.genres || []);
          if (Array.isArray(g) && g.length > 0) genre = g[0];
        } catch {}

        const video = await generateOutreachVideo({
          artistName: artist.artist_name,
          trackName: artist.track_name,
          genre,
          coverArtUrl: artist.cover_art_url || '/images/og-image.jpg',
          campaignSlug: artist.campaign_slug,
          instagramHandle: artist.instagram_handle,
        });

        await sql`
          INSERT INTO instagram_posts (artist_name, track_name, instagram_handle, cover_art_url, video_url, caption, campaign_slug, status)
          VALUES (${artist.artist_name}, ${artist.track_name}, ${artist.instagram_handle}, ${artist.cover_art_url}, ${video.videoUrl}, ${video.caption}, ${artist.campaign_slug}, 'pending_review')
        `;

        await sql`
          INSERT INTO instagram_outreach_log (discovered_artist_id, campaign_id, instagram_handle, message_text, response_type)
          VALUES (${artist.artist_id}, ${artist.campaign_id}, ${artist.instagram_handle}, ${video.dmTemplate}, 'pending')
        `;

        results.push({
          artist: artist.artist_name,
          track: artist.track_name,
          instagram: `@${artist.instagram_handle}`,
          videoUrl: video.videoUrl,
          campaignUrl: `https://selah.fm/c/${artist.campaign_slug}`,
          caption: video.caption,
          dmTemplate: video.dmTemplate,
        });

        await new Promise(r => setTimeout(r, 2000));
      } catch (e: any) {
        results.push({ artist: artist.artist_name, error: e.message });
      }
    }

    // Send notification email
    if (results.length > 0 && process.env.RESEND_API_KEY) {
      const goodVideos = results.filter(r => !r.error);
      if (goodVideos.length > 0) {
        const list = goodVideos.map(r => `
          <div style="margin-bottom:20px;padding:16px;border:1px solid #E5E7EB;border-radius:12px">
            <h3>🎬 ${r.artist} — "${r.track}" (${r.instagram})</h3>
            <p><a href="${r.videoUrl}">📥 Download Video</a> | <a href="${r.campaignUrl}">🔗 Campaign</a></p>
            <details><summary>📝 Caption</summary><pre style="background:#F3F4F6;padding:12px;border-radius:8px;white-space:pre-wrap">${r.caption}</pre></details>
            <details><summary>💬 DM</summary><pre style="background:#F3F4F6;padding:12px;border-radius:8px;white-space:pre-wrap">${r.dmTemplate}</pre></details>
          </div>`).join('');

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: 'Selah.fm <info@selah.fm>',
            to: [process.env.OUTREACH_NOTIFY_EMAIL || 'info@selah.fm'],
            subject: `📱 ${goodVideos.length} IG outreach videos ready`,
            html: `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto"><h2>📱 Outreach Videos Ready</h2><p>${goodVideos.length} videos. Download, post, DM, mark as sent.</p>${list}<p style="color:#6B7280;font-size:13px;margin-top:24px">After posting: <a href="https://selah.fm/admin/outreach/instagram">mark as sent in dashboard</a></p></div>`,
          }),
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      generated: results.filter(r => !r.error).length,
      errors: results.filter(r => r.error).length,
      results,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
