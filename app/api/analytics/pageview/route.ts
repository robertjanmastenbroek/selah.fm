import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { headers } from 'next/headers';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * POST /api/analytics/pageview
 * 
 * Records a page view with referrer and UTM attribution.
 * Called client-side on every page load (fire-and-forget).
 * 
 * Body: { path: string, referrer?: string }
 * UTM params read from query string or referrer.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const headersList = headers();

    let path = body.path || '/';
    // Normalize — strip trailing slash, lowercase
    if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1);
    path = path.toLowerCase();

    const referrer = body.referrer || headersList.get('referer') || null;
    const userAgent = headersList.get('user-agent')?.slice(0, 500) || null;

    // Hash IP for privacy (one-way hash, not reversible)
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() 
            || headersList.get('x-real-ip') 
            || 'unknown';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32);

    // Parse UTM from referrer or query params
    let utmSource = body.utm_source || null;
    let utmMedium = body.utm_medium || null;
    let utmCampaign = body.utm_campaign || null;

    // Parse UTM from referrer URL if not explicitly provided
    if (!utmSource && referrer) {
      try {
        const refUrl = new URL(referrer);
        utmSource = refUrl.searchParams.get('utm_source');
        utmMedium = refUrl.searchParams.get('utm_medium');
        utmCampaign = refUrl.searchParams.get('utm_campaign');
      } catch {}
    }

    // Skip obvious bots
    if (userAgent && /bot|crawler|spider|scraper|curl|wget/i.test(userAgent)) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'bot' });
    }

    // Skip self-referrals
    if (referrer && (referrer.includes('selah.fm') || referrer.includes('localhost'))) {
      utmSource = utmSource || '(internal)';
    }

    await sql`
      INSERT INTO page_views (path, referrer, utm_source, utm_medium, utm_campaign, user_agent, ip_hash)
      VALUES (${path}, ${referrer?.slice(0, 500) || null}, ${utmSource?.slice(0, 100) || null}, ${utmMedium?.slice(0, 100) || null}, ${utmCampaign?.slice(0, 100) || null}, ${userAgent}, ${ipHash})
    `;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[analytics] pageview error:', e.message);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

/**
 * GET /api/analytics/pageview
 * 
 * Admin dashboard: returns aggregated stats.
 * Protected in production — add auth check before deploying.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '7');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    // Top pages (last N days)
    const topPages = await sql`
      SELECT path, COUNT(*)::int as views 
      FROM page_views 
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY path 
      ORDER BY views DESC 
      LIMIT ${limit}
    `;

    // Blog posts only (top N)
    const topBlogs = await sql`
      SELECT path, COUNT(*)::int as views 
      FROM page_views 
      WHERE path LIKE '/blog/%' AND created_at > NOW() - INTERVAL '${days} days'
      GROUP BY path 
      ORDER BY views DESC 
      LIMIT ${limit}
    `;

    // Traffic by UTM source
    const utmSources = await sql`
      SELECT 
        COALESCE(utm_source, '(direct/none)') as source,
        COUNT(*)::int as views
      FROM page_views 
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY COALESCE(utm_source, '(direct/none)')
      ORDER BY views DESC 
      LIMIT 10
    `;

    // Traffic by UTM medium
    const utmMediums = await sql`
      SELECT 
        COALESCE(utm_medium, '(direct/none)') as medium,
        COUNT(*)::int as views
      FROM page_views 
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY COALESCE(utm_medium, '(direct/none)')
      ORDER BY views DESC 
      LIMIT 10
    `;

    // Traffic by UTM campaign
    const utmCampaigns = await sql`
      SELECT 
        utm_campaign,
        COUNT(*)::int as views
      FROM page_views 
      WHERE utm_campaign IS NOT NULL 
        AND created_at > NOW() - INTERVAL '${days} days'
      GROUP BY utm_campaign
      ORDER BY views DESC 
      LIMIT 10
    `;

    // Hourly breakdown (last 48 hours)
    const hourlyRaw = await sql`
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*)::int as views
      FROM page_views 
      WHERE created_at > NOW() - INTERVAL '48 hours'
      GROUP BY hour
      ORDER BY hour DESC
    `;
    const hourly = hourlyRaw.map((r: any) => ({
      ...r,
      hour: r.hour instanceof Date ? r.hour.toISOString() : r.hour,
    }));

    // Total views in period
    const [{ total }] = await sql`
      SELECT COUNT(*)::int as total FROM page_views 
      WHERE created_at > NOW() - INTERVAL '${days} days'
    `;

    return NextResponse.json({
      total,
      days,
      top_pages: topPages,
      top_blogs: topBlogs,
      utm_sources: utmSources,
      utm_mediums: utmMediums,
      utm_campaigns: utmCampaigns,
      hourly: hourly.slice(0, 48),
    });
  } catch (e: any) {
    console.error('[analytics] GET error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
