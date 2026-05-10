import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const userId = session.id;

    // Submissions with view + payout data, grouped by platform
    const byPlatform = await sql`
      SELECT 
        s.platform,
        COUNT(*)::int as total_submissions,
        COALESCE(SUM(s.views_verified)::int, 0) as total_views,
        COALESCE(SUM(s.payout_amount_cents)::int, 0) as total_earned_cents,
        COUNT(*) FILTER (WHERE s.review_status = 'approved')::int as approved,
        COUNT(*) FILTER (WHERE s.review_status = 'pending')::int as pending,
        COUNT(*) FILTER (WHERE s.review_status = 'rejected')::int as rejected
      FROM submissions s
      WHERE s.creator_id = ${userId}
      GROUP BY s.platform
      ORDER BY total_views DESC
    `;

    // Lifetime totals
    const lifetime = await sql`
      SELECT 
        COUNT(*)::int as total_submissions,
        COALESCE(SUM(s.views_verified)::int, 0) as total_views,
        COALESCE(SUM(CASE WHEN s.payout_status = 'paid' THEN s.payout_amount_cents ELSE 0 END)::int, 0) as total_paid_cents,
        COALESCE(SUM(s.payout_amount_cents)::int, 0) as total_earned_cents
      FROM submissions s
      WHERE s.creator_id = ${userId}
    `;

    // Recent submissions (last 10)
    const recent = await sql`
      SELECT 
        s.id,
        s.platform,
        s.content_url,
        s.views_verified,
        s.payout_amount_cents,
        s.review_status,
        s.payout_status,
        s.submitted_at,
        c.track_title,
        c.cover_art_url
      FROM submissions s
      JOIN campaigns c ON c.id = s.campaign_id
      WHERE s.creator_id = ${userId}
      ORDER BY s.submitted_at DESC
      LIMIT 10
    `;

    // Monthly earnings trend (last 6 months)
    const monthly = await sql`
      SELECT 
        TO_CHAR(s.submitted_at, 'YYYY-MM') as month,
        COUNT(*)::int as submissions,
        COALESCE(SUM(s.views_verified)::int, 0) as views,
        COALESCE(SUM(s.payout_amount_cents)::int, 0) as earned_cents
      FROM submissions s
      WHERE s.creator_id = ${userId}
        AND s.submitted_at >= NOW() - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month ASC
    `;

    // Platform connection status
    const profile = await sql`
      SELECT tiktok_handle, instagram_handle, youtube_handle, facebook_handle
      FROM users WHERE id = ${userId}
    `;

    const connections = {
      tiktok: !!profile[0]?.tiktok_handle,
      instagram: !!profile[0]?.instagram_handle,
      youtube: !!profile[0]?.youtube_handle,
      facebook: !!profile[0]?.facebook_handle,
    };

    return NextResponse.json({
      byPlatform,
      lifetime: lifetime[0] || { total_submissions: 0, total_views: 0, total_paid_cents: 0, total_earned_cents: 0 },
      recent,
      monthly,
      connections,
    });
  } catch (e: any) {
    console.error('Analytics error:', e.message);
    return NextResponse.json({
      byPlatform: [],
      lifetime: { total_submissions: 0, total_views: 0, total_paid_cents: 0, total_earned_cents: 0 },
      recent: [],
      monthly: [],
      connections: { tiktok: false, instagram: false, youtube: false, facebook: false },
    });
  }
}
