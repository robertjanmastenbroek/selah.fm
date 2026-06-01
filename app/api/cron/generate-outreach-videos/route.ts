import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { generateOutreachVideo } from '@/lib/video-generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 600; // 10 minutes for video generation

/**
 * GET /api/cron/generate-outreach-videos
 * 
 * Fully automated pipeline:
 *   1. Picks 3-5 artists from the IG outreach queue
 *   2. Generates video + caption + DM template via DeepSeek + Shotstack
 *   3. Stores in instagram_posts table (status: 'pending_review')
 *   4. Sends email notification with links to download + copy-paste
 * 
 * After notification: human posts video to IG, sends DM, marks as sent.
 * This is the only manual step — Instagram API restricts programmatic posting.
 * 
 * Called by Railway cron at 08:00 UTC (before the morning IG session).
 * Optional: ?secret=CRON_SECRET for auth, ?count=3 to control batch size.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const count = parseInt(searchParams.get('count') || '5');
  const log: string[] = [];
  const results: any[] = [];

  try {
    // Pick artists from the queue (has IG, has campaign, not yet posted)
    const artists = await sql`
      SELECT 
        da.id as artist_id,
        da.artist_name,
        da.latest_track_name as track_name,
        aa.instagram_handle,
        aa.instagram_followers,
        c.id as campaign_id,
        c.slug as campaign_slug,
        c.cover_art_url,
        da.genres,
        da.social_links
      FROM artist_audits aa
      JOIN discovered_artists da ON da.id = aa.discovered_artist_id
      JOIN campaign_claims cc ON cc.discovered_artist_id = da.id
      JOIN campaigns c ON c.id = cc.campaign_id
      WHERE aa.instagram_handle IS NOT NULL 
        AND aa.instagram_handle != ''
        AND (aa.email_address IS NULL OR aa.email_address = '')
        AND aa.bounced_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM instagram_posts ip 
          WHERE ip.campaign_slug = c.slug
        )
      ORDER BY COALESCE(aa.instagram_followers, 0) DESC, RANDOM()
      LIMIT ${count}
    `;

    log.push(`Queue: ${artists.length} artists selected for video generation`);

    for (const artist of artists) {
      log.push(`\n🎬 ${artist.artist_name} — "${artist.track_name}" (@${artist.instagram_handle})`);

      try {
        // Extract genre
        let genre = 'indie';
        try {
          const genres = typeof artist.genres === 'string' ? JSON.parse(artist.genres) : (artist.genres || []);
          if (Array.isArray(genres) && genres.length > 0) genre = genres[0];
        } catch {}

        // Extract track URL for background music
        let trackUrl: string | undefined;
        try {
          const links = typeof artist.social_links === 'string' ? JSON.parse(artist.social_links) : (artist.social_links || {});
          trackUrl = links.bandcamp || links.spotify || links.youtube;
        } catch {}

        // Generate the video package
        const video = await generateOutreachVideo({
          artistName: artist.artist_name,
          trackName: artist.track_name,
          genre,
          coverArtUrl: artist.cover_art_url || '/images/og-image.jpg',
          campaignSlug: artist.campaign_slug,
          instagramHandle: artist.instagram_handle,
          trackUrl,
        });

        // Store in instagram_posts
        await sql`
          INSERT INTO instagram_posts (
            artist_name, track_name, instagram_handle, 
            cover_art_url, video_url, caption, 
            campaign_slug, status
          ) VALUES (
            ${artist.artist_name}, ${artist.track_name}, ${artist.instagram_handle},
            ${artist.cover_art_url}, ${video.videoUrl}, ${video.caption},
            ${artist.campaign_slug}, 'pending_review'
          )
        `;

        // Also pre-create the DM log entry (not sent yet, just prepped)
        await sql`
          INSERT INTO instagram_outreach_log (
            discovered_artist_id, campaign_id, instagram_handle, 
            message_text, response_type
          ) VALUES (
            ${artist.artist_id}, ${artist.campaign_id}, ${artist.instagram_handle},
            ${video.dmTemplate}, 'pending'
          )
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

        log.push(`  ✅ Video generated: ${video.videoUrl?.slice(0, 60)}...`);
        log.push(`  📝 Caption ready (${video.caption.length} chars)`);
        log.push(`  💬 DM template ready (${video.dmTemplate.length} chars)`);

        // Add a small delay between artists to avoid rate limiting
        await new Promise(r => setTimeout(r, 2000));
      } catch (e: any) {
        log.push(`  ❌ Failed: ${e.message}`);
        results.push({ artist: artist.artist_name, error: e.message });
      }
    }

    // Send notification email if Resend is configured
    if (results.length > 0 && process.env.RESEND_API_KEY) {
      await sendNotificationEmail(results, log);
      log.push('\n📧 Notification email sent');
    }

    log.push(`\n✅ Generated ${results.filter(r => !r.error).length} videos`);

    return NextResponse.json({ results, log });
  } catch (e: any) {
    log.push(`Cron crashed: ${e.message}`);
    return NextResponse.json({ error: e.message, results, log }, { status: 500 });
  }
}

/**
 * Send email notification with all generated videos.
 * Contains downloadable links and copy-paste templates.
 */
async function sendNotificationEmail(results: any[], log: string[]) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.OUTREACH_NOTIFY_EMAIL || 'info@selah.fm';
  if (!apiKey) return;

  const videoList = results
    .filter(r => !r.error)
    .map(r => `
      <div style="margin-bottom:24px;padding:16px;border:1px solid #E5E7EB;border-radius:12px">
        <h3 style="margin:0 0 8px">🎬 ${r.artist} — "${r.track}" (${r.instagram})</h3>
        <p><a href="${r.videoUrl}" style="color:#5B7FFF">📥 Download Video</a></p>
        <p><a href="${r.campaignUrl}" style="color:#5B7FFF">🔗 Campaign Page</a></p>
        <details>
          <summary style="cursor:pointer;color:#6B7280">📝 Caption</summary>
          <pre style="background:#F3F4F6;padding:12px;border-radius:8px;white-space:pre-wrap;font-size:13px">${r.caption}</pre>
        </details>
        <details>
          <summary style="cursor:pointer;color:#6B7280">💬 DM Template</summary>
          <pre style="background:#F3F4F6;padding:12px;border-radius:8px;white-space:pre-wrap;font-size:13px">${r.dmTemplate}</pre>
        </details>
      </div>
    `)
    .join('');

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto">
      <h2>📱 Instagram Outreach Videos Ready</h2>
      <p>${results.filter(r => !r.error).length} videos generated. Download, post to @selahfm, and send the DM.</p>
      ${videoList}
      <p style="color:#6B7280;font-size:13px;margin-top:32px">
        After posting each video, mark it as sent in the <a href="https://selah.fm/admin/outreach/instagram">dashboard</a>.
      </p>
    </div>
  `;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Selah.fm <info@selah.fm>',
        to: [notifyEmail],
        subject: `📱 ${results.filter(r => !r.error).length} IG outreach videos ready`,
        html,
      }),
    });
  } catch (e: any) {
    console.error('[video-cron] Failed to send notification:', e.message);
  }
}
