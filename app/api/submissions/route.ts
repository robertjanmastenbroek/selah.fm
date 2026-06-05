import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';
import { trackSubmitContent } from '@/lib/analytics-server';
import { normalizeUrl, extractVideoId } from '@/lib/url-normalize';

export async function POST(request: Request) {
  const { rateLimit, getRateLimitKey } = await import('@/lib/rate-limit');
  const rl = await rateLimit(getRateLimitKey(request), { maxRequests: 10, windowMs: 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 });

  try {
    const body = await request.json();
    let { campaignId, trackId, contentUrl, platform } = body;

    // If trackId is provided instead of campaignId, resolve to the artist's campaign
    if (!campaignId && trackId) {
      const [trackInfo] = await sql`
        SELECT cc.campaign_id FROM artist_tracks at
        JOIN campaign_claims cc ON cc.discovered_artist_id = at.artist_id
        WHERE at.id = ${trackId} AND at.enabled = true
        ORDER BY cc.created_at ASC LIMIT 1
      `;
      if (!trackInfo) {
        // Fallback: find any campaign for this artist
        const [fallbackCampaign] = await sql`
          SELECT c.id FROM artist_tracks at
          JOIN campaign_claims cc ON cc.discovered_artist_id = at.artist_id
          JOIN campaigns c ON c.id = cc.campaign_id AND c.status = 'active'
          WHERE at.id = ${trackId}
          ORDER BY c.created_at ASC LIMIT 1
        `;
        if (!fallbackCampaign) {
          return NextResponse.json({ error: 'No active campaign found for this track' }, { status: 400 });
        }
        campaignId = fallbackCampaign.id;
      } else {
        campaignId = trackInfo.campaign_id;
      }
    }
    
    // Resolve campaignId from slug to UUID (campaignId can come from URL slug)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(campaignId || '');
    if (campaignId && !isUuid) {
      const [resolved] = await sql`SELECT id FROM campaigns WHERE slug = ${campaignId} LIMIT 1`;
      if (resolved) campaignId = resolved.id;
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const creatorId = user.id;

    // Normalize URL for storage (strips tracking params, resolves short URLs)
    const normalizedUrl = normalizeUrl(contentUrl);
    
    // Extract unique video ID for cross-URL dedup
    const videoId = extractVideoId(contentUrl, platform);
    
    // Dedup: block duplicate submissions using video ID + normalize URL
    // Check by video ID first (catches short URL variants)
    let dupCheck;
    if (videoId.platform !== 'unknown') {
      dupCheck = await sql`
        SELECT id FROM submissions WHERE campaign_id = ${campaignId}
          AND creator_id = ${creatorId}
          AND content_url LIKE ${'%' + videoId.id + '%'}
        LIMIT 1
      `;
    }
    // Fallback: check normalized URL
    if (!dupCheck || dupCheck.length === 0) {
      dupCheck = await sql`
        SELECT id FROM submissions WHERE campaign_id = ${campaignId}
          AND creator_id = ${creatorId}
          AND content_url = ${normalizedUrl}
        LIMIT 1
      `;
    }
    if (dupCheck && dupCheck.length > 0) {
      return NextResponse.json({ error: 'You already submitted this video to this campaign', duplicate: true }, { status: 409 });
    }

    // Try to get initial view count
    let initialViews = 0;
    try {
      const verifyRes = await fetch(`${process.env.NEXTAUTH_URL || 'https://selah.fm'}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: contentUrl, platform }),
      });
      const vData = await verifyRes.json();
      if (typeof vData.views === 'number') initialViews = vData.views;
    } catch (e: any) { console.error('Unhandled error in api/submissions/route.ts:', e); }

    // Check campaign is active and has budget
    const campaign = await sql`SELECT status, budget_remaining_cents FROM campaigns WHERE id = ${campaignId}`;
    if (campaign.length === 0) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    if (campaign[0].status !== 'active') {
      return NextResponse.json({ error: 'Campaign is not accepting submissions' }, { status: 400 });
    }
    if (campaign[0].budget_remaining_cents <= 0) {
      return NextResponse.json({ error: 'Campaign budget is exhausted' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO submissions (campaign_id, creator_id, content_url, platform, views_at_submit, views_verified)
      VALUES (${campaignId}, ${creatorId}, ${normalizedUrl}, ${platform}, ${initialViews}, ${initialViews})
      RETURNING *
    `;

    // Server-side GA tracking
    trackSubmitContent(platform, creatorId).catch((e: any) => console.error('Async error in api/submissions/route.ts:', e));

    // Live ticker event
    const [profileRow] = await sql`
      SELECT display_name FROM users WHERE id = ${creatorId} LIMIT 1
    `;
    const creatorName = profileRow?.display_name || (user.user_metadata?.full_name || user.email?.split('@')[0] || 'Someone');
    const creatorFirst = creatorName.split(' ')[0];
    const creatorLastInitial = creatorName.split(' ').slice(1).join(' ')[0] || '';
    const platformLabel = platform === 'instagram' ? 'Instagram Reels' : platform === 'youtube' ? 'YouTube Shorts' : platform === 'facebook' ? 'Facebook' : 'TikTok';
    await sql`
      INSERT INTO live_ticker_events (campaign_id, event_type, message, metadata)
      VALUES (${campaignId}, 'video_submitted', ${`${creatorFirst} submitted a ${platformLabel}`}, ${JSON.stringify({
        first_name: creatorFirst,
        last_initial: creatorLastInitial ? creatorLastInitial + '.' : '',
        platform: platformLabel,
      })})
    `.catch((e: any) => console.error('Async error in api/submissions/route.ts:', e));

    // Notify the artist
    try {
      const campaign = await sql`SELECT artist_id, track_title FROM campaigns WHERE id = ${campaignId}`;
      if (campaign.length > 0) {
        await sql`
          INSERT INTO notifications (user_id, type, message, link, metadata)
          VALUES (
            ${campaign[0].artist_id},
            'submission',
            ${`New submission on "${campaign[0].track_title}" from @${creatorName}`},
            '/review',
            ${JSON.stringify({ campaign_id: campaignId, submission_id: result[0].id })}
          )
        `;
      }
    } catch (notifErr) {
      console.error('Notification creation failed:', notifErr);
    }

    // Also email the artist
    try {
      const [campData] = await sql`
        SELECT c.track_title, u.email, u.display_name
        FROM campaigns c LEFT JOIN users u ON u.id = c.artist_id
        WHERE c.id = ${campaignId}
      `;
      if (campData?.email) {
        fetch(`${process.env.NEXTAUTH_URL || 'https://selah.fm'}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: campData.email,
            subject: `New submission on "${campData.track_title}" — review it now`,
            html: `<p>Hi ${campData.display_name || 'Artist'},</p><p>Someone submitted a video for <strong>"${campData.track_title}"</strong> on Selah.fm.</p><p><a href="https://selah.fm/review">Review the submission →</a></p><p style="color:#888;font-size:13px;">You only pay for verified views after you approve.</p>`,
          }),
        }).catch((e: any) => console.error('Async error in api/submissions/route.ts:', e));
      }
    } catch (e: any) { console.error('Unhandled error in api/submissions/route.ts:', e); }

    return NextResponse.json(result[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let campaignId = searchParams.get('campaignId') || '';
    const artistId = searchParams.get('artistId');
    const creatorId = searchParams.get("creator_id");
    const statusListFilter = searchParams.get('status');

    // Resolve campaignId from slug to UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(campaignId);
    if (campaignId && !isUuid) {
      const [resolved] = await sql`SELECT id FROM campaigns WHERE slug = ${campaignId} LIMIT 1`;
      if (resolved) campaignId = resolved.id;
    }

    let submissions;

    // If creatorId is provided, get submissions by that creator
    if (creatorId) {
      submissions = await sql`
        SELECT s.*, c.track_title, c.cpm_rate_cents, c.max_payout_per_submission_cents,
          u.display_name as creator_name
        FROM submissions s
        JOIN campaigns c ON c.id = s.campaign_id
        LEFT JOIN users u ON u.id = s.creator_id
        WHERE s.creator_id = ${creatorId}
        ORDER BY s.submitted_at DESC LIMIT 50
      `;
    } else if (artistId) {
      const statusCondition = statusListFilter ? `AND s.review_status = $2` : '';
      const query = `
        SELECT s.*, c.track_title, c.cpm_rate_cents, c.max_payout_per_submission_cents,
          u.display_name as creator_name
        FROM submissions s
        JOIN campaigns c ON c.id = s.campaign_id
        JOIN campaign_claims cc ON cc.campaign_id = c.id
        LEFT JOIN users u ON u.id = s.creator_id
        WHERE cc.discovered_artist_id = $1 ${statusCondition}
        ORDER BY s.submitted_at DESC
      `;
      const params = statusListFilter ? [artistId, statusListFilter] : [artistId];
      submissions = await sql.raw(query, params);
    } else if (campaignId && campaignId !== 'all') {
      if (statusListFilter) {
        submissions = await sql`
          SELECT s.*, c.track_title, c.cpm_rate_cents, c.max_payout_per_submission_cents,
            u.display_name as creator_name
          FROM submissions s
          JOIN campaigns c ON c.id = s.campaign_id
          LEFT JOIN users u ON u.id = s.creator_id
          WHERE s.campaign_id = ${campaignId} AND s.review_status = ${statusListFilter}
          ORDER BY s.submitted_at DESC
        `;
      } else {
        submissions = await sql`
          SELECT s.*, c.track_title, c.cpm_rate_cents, c.max_payout_per_submission_cents,
            u.display_name as creator_name
          FROM submissions s
          JOIN campaigns c ON c.id = s.campaign_id
          LEFT JOIN users u ON u.id = s.creator_id
          WHERE s.campaign_id = ${campaignId}
          ORDER BY s.submitted_at DESC
        `;
      }
    } else {
      if (statusListFilter) {
        submissions = await sql`
          SELECT s.*, c.track_title, c.cpm_rate_cents, c.max_payout_per_submission_cents,
            u.display_name as creator_name
          FROM submissions s
          JOIN campaigns c ON c.id = s.campaign_id
          LEFT JOIN users u ON u.id = s.creator_id
          WHERE s.review_status = ${statusListFilter}
          ORDER BY s.submitted_at DESC
        `;
      } else {
        submissions = await sql`
          SELECT s.*, c.track_title, c.cpm_rate_cents, c.max_payout_per_submission_cents,
            u.display_name as creator_name
          FROM submissions s
          JOIN campaigns c ON c.id = s.campaign_id
          LEFT JOIN users u ON u.id = s.creator_id
          ORDER BY s.submitted_at DESC
        `;
      }
    }
    return NextResponse.json(submissions);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
