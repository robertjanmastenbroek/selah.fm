import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const maxDuration = 30;

/**
 * Build in Public — posts daily Selah.fm metrics to Bluesky.
 * No X/Twitter needed (free API). Uses Bluesky AT Protocol.
 * 
 * Requires: BLUESKY_USERNAME, BLUESKY_APP_PASSWORD in Railway env.
 * Runs daily at hour 0 via dispatcher.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const username = process.env.BLUESKY_USERNAME;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!username || !password) {
    return NextResponse.json({ posted: false, message: 'Bluesky credentials not configured' });
  }

  try {
    // Gather current metrics
    const [
      [{ count: userCount }],
      [{ count: artistCount }],
      [{ count: creatorCount }],
      [{ count: blogPostCount }],
      [{ count: publishedToday }],
      [{ count: submissionCount }],
      [{ count: approvedSubmissions }],
      [{ val: donatedCents }],
      [{ val: paidOutCents }],
      [{ count: campaignCount }],
    ] = await Promise.all([
      sql`SELECT COUNT(*)::int FROM users`,
      sql`SELECT COUNT(*)::int FROM users WHERE is_artist = true`,
      sql`SELECT COUNT(*)::int FROM users WHERE is_creator = true`,
      sql`SELECT COUNT(*)::int FROM blog_posts WHERE status = 'published'`,
      sql`SELECT COUNT(*)::int FROM blog_posts WHERE status = 'published' AND published_at > CURRENT_DATE`,
      sql`SELECT COUNT(*)::int FROM submissions`,
      sql`SELECT COUNT(*)::int FROM submissions WHERE review_status = 'approved'`,
      sql`SELECT COALESCE(SUM(amount_cents), 0)::int / 100 as val FROM campaign_donations`,
      sql`SELECT COALESCE(SUM(payout_amount_cents), 0)::int / 100 as val FROM submissions WHERE payout_status = 'paid'`,
      sql`SELECT COUNT(*)::int FROM campaigns`,
    ]);

    const dayCount = Math.floor((Date.now() - new Date('2025-09-01').getTime()) / 86400000);
    const statusText = [
      `Building Selah.fm — Day ${dayCount}`,
      `👥 ${userCount} users · ${artistCount} artists · ${creatorCount} creators`,
      `🎵 ${campaignCount} campaigns · ${submissionCount} submissions (${approvedSubmissions} approved)`,
      `💰 $${donatedCents} donated · $${paidOutCents} paid out to creators`,
      `📝 ${blogPostCount} blog posts (${publishedToday} today)`,
      `🎵 Open source CPM marketplace`,
      ``,
      `selah.fm`,
    ].join('\n');

    // Authenticate with Bluesky
    const authRes = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: username, password }),
    });

    if (!authRes.ok) {
      const err = await authRes.text();
      return NextResponse.json({ posted: false, error: `Auth failed: ${err.slice(0, 100)}` });
    }

    const auth = await authRes.json();
    const accessJwt = auth.accessJwt;
    const did = auth.did;

    // Create post record
    const postRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessJwt}`,
      },
      body: JSON.stringify({
        repo: did,
        collection: 'app.bsky.feed.post',
        record: {
          $type: 'app.bsky.feed.post',
          text: statusText,
          createdAt: new Date().toISOString(),
        },
      }),
    });

    if (!postRes.ok) {
      const err = await postRes.text();
      return NextResponse.json({ posted: false, error: `Post failed: ${err.slice(0, 100)}` });
    }

    const post = await postRes.json();
    return NextResponse.json({ posted: true, uri: post.uri, cid: post.cid, text: statusText.split('\n')[0] + '...' });
  } catch (e: any) {
    return NextResponse.json({ posted: false, error: e.message });
  }
}
