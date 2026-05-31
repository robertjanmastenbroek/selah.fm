import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { trackSubmitContent } from '@/lib/analytics-server';

export async function POST(request: Request) {
  const { rateLimit, getRateLimitKey } = await import('@/lib/rate-limit');
  const rl = rateLimit(getRateLimitKey(request), { maxRequests: 10, windowMs: 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 });

  try {
    const { campaignId, contentUrl, platform } = await request.json();
    
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const creatorId = session.id;

    // Dedup: block duplicate submissions by same creator to same campaign with same URL
    const [existing] = await sql`
      SELECT id FROM submissions
      WHERE campaign_id = ${campaignId}
        AND creator_id = ${creatorId}
        AND content_url = ${contentUrl}
      LIMIT 1
    `;
    if (existing) {
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
    } catch {}

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
      VALUES (${campaignId}, ${creatorId}, ${contentUrl}, ${platform}, ${initialViews}, ${initialViews})
      RETURNING *
    `;

    // Server-side GA tracking
    trackSubmitContent(platform, creatorId).catch(() => {});

    // Live ticker event
    const creatorName = session.name || 'Someone';
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
    `.catch(() => {});

    // Notify the artist
    try {
      const campaign = await sql`SELECT artist_id, track_title FROM campaigns WHERE id = ${campaignId}`;
      if (campaign.length > 0) {
        await sql`
          INSERT INTO notifications (user_id, type, message, link, metadata)
          VALUES (
            ${campaign[0].artist_id},
            'submission',
            ${`New submission on "${campaign[0].track_title}" from @${session.name}`},
            '/review',
            ${JSON.stringify({ campaign_id: campaignId, submission_id: result[0].id })}
          )
        `;
      }
    } catch (notifErr) {
      console.error('Notification creation failed:', notifErr);
    }

    return NextResponse.json(result[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const statusFilter = searchParams.get('status'); // 'pending', 'approved', 'rejected'
    let submissions;
    if (campaignId && campaignId !== 'all') {
      if (statusFilter) {
        submissions = await sql`
          SELECT s.*, c.track_title, c.cpm_rate_cents, c.max_payout_per_submission_cents,
            u.display_name as creator_name
          FROM submissions s
          JOIN campaigns c ON c.id = s.campaign_id
          LEFT JOIN users u ON u.id = s.creator_id
          WHERE s.campaign_id = ${campaignId} AND s.review_status = ${statusFilter}
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
      if (statusFilter) {
        submissions = await sql`
          SELECT s.*, c.track_title, c.cpm_rate_cents, c.max_payout_per_submission_cents,
            u.display_name as creator_name
          FROM submissions s
          JOIN campaigns c ON c.id = s.campaign_id
          LEFT JOIN users u ON u.id = s.creator_id
          WHERE s.review_status = ${statusFilter}
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
