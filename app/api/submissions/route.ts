import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { campaignId, contentUrl, platform } = await request.json();
    
    // Get creator from session
    const cookieHeader = request.headers.get('cookie') || '';
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    let creatorId = null;
    if (sessionMatch) {
      try {
        const [payload] = sessionMatch[1].split('.');
        const user = JSON.parse(Buffer.from(payload, 'base64').toString());
        const existing = await sql`SELECT id FROM users WHERE email = ${user.email}`;
        if (existing.length > 0) creatorId = existing[0].id;
      } catch {}
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

    const result = await sql`
      INSERT INTO submissions (campaign_id, creator_id, content_url, platform, views_at_submit, views_verified)
      VALUES (${campaignId}, ${creatorId}, ${contentUrl}, ${platform}, ${initialViews}, ${initialViews})
      RETURNING *
    `;
    return NextResponse.json(result[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    let submissions;
    if (campaignId && campaignId !== 'all') {
      submissions = await sql`
        SELECT s.*, c.track_title, c.cpm_rate_cents, c.max_payout_per_submission_cents,
          u.display_name as creator_name
        FROM submissions s
        JOIN campaigns c ON c.id = s.campaign_id
        LEFT JOIN users u ON u.id = s.creator_id
        WHERE s.campaign_id = ${campaignId}
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
    return NextResponse.json(submissions);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
