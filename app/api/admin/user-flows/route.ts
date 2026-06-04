import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/user-flows?limit=10&session=SESSION_ID
 * 
 * Returns user flow data: page views + events grouped by session.
 * Shows the full journey: where they came from, what pages they visited,
 * what actions they took, and whether they signed up.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const sessionListFilter = searchParams.get('session') || '';

    // Get recent sessions with their events
    const sessions = await sql`
      SELECT 
        ae.session_id,
        MIN(ae.created_at) as session_start,
        MAX(ae.created_at) as session_end,
        COUNT(*)::int as event_count,
        COUNT(*) FILTER (WHERE ae.event = 'page_view')::int as page_views,
        COUNT(*) FILTER (WHERE ae.event = 'signup_complete')::int as signed_up,
        COUNT(*) FILTER (WHERE ae.event = 'campaign_join_click')::int as joined_campaign,
        COUNT(*) FILTER (WHERE ae.event = 'cta_click')::int as cta_clicks,
        MAX(ae.referrer) as referrer,
        MAX(ae.utm_source) as utm_source,
        MAX(ae.utm_campaign) as utm_campaign,
        MAX(ae.user_id) as user_id
      FROM analytics_events ae
      WHERE ae.session_id IS NOT NULL
        ${sessionListFilter ? sql`AND ae.session_id = ${sessionListFilter}` : sql``}
      GROUP BY ae.session_id
      ORDER BY session_start DESC
      LIMIT ${limit}
    `;

    // For each session, get the full event timeline
    const sessionIds = sessions.map((s: any) => s.session_id);
    let timeline: any[] = [];
    if (sessionIds.length > 0) {
      timeline = await sql`
        SELECT ae.session_id, ae.event, ae.path, ae.metadata, ae.created_at, ae.referrer
        FROM analytics_events ae
        WHERE ae.session_id = ANY(${sessionIds})
        ORDER BY ae.created_at ASC
      `;
    }

    // Group events by session
    const timelineBySession: Record<string, any[]> = {};
    for (const event of timeline) {
      const sid = event.session_id;
      if (!timelineBySession[sid]) timelineBySession[sid] = [];
      timelineBySession[sid].push(event);
    }

    // Attach timeline to each session
    const result = sessions.map((s: any) => ({
      ...s,
      timeline: timelineBySession[s.session_id] || [],
    }));

    // Summary stats
    const [{ total_events }] = await sql`SELECT COUNT(*)::int as total_events FROM analytics_events`;
    const [{ signups }] = await sql`SELECT COUNT(*)::int as signups FROM analytics_events WHERE event = 'signup_complete'`;

    return NextResponse.json({
      sessions: result,
      summary: {
        total_events,
        signups,
        tracked_sessions: sessions.length,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
