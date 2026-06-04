import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const INDEXNOW_URL = 'https://api.indexnow.org/indexnow';

/**
 * IndexNow submission endpoint.
 *
 * POST /api/indexnow
 * Body: { urls: string[], secret: string }
 *
 * Submits URLs to Bing IndexNow API for immediate indexing.
 * Requires CRON_SECRET for auth and INDEXNOW_KEY env var for the API key.
 * Max 10,000 URLs per submission (IndexNow limit).
 */
export async function POST(request: NextRequest) {
  // Auth: body secret or Authorization header
  let body: { urls?: string[]; secret?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const secret = body.secret || request.headers.get('authorization')?.replace('Bearer ', '') || '';
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate input
  if (!body.urls || !Array.isArray(body.urls) || body.urls.length === 0) {
    return NextResponse.json({ error: 'urls must be a non-empty array of strings' }, { status: 400 });
  }

  const apiKey = process.env.INDEXNOW_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'INDEXNOW_KEY not configured' }, { status: 500 });
  }

  const siteUrl = 'https://selah.fm';

  // IndexNow accepts max 10,000 URLs per request
  const urls = body.urls.slice(0, 10_000);

  const payload = {
    host: siteUrl.replace(/^https?:\/\//, ''),
    key: apiKey,
    keyLocation: `${siteUrl}/INDEXNOW_KEY.txt`,
    urlList: urls,
  };

  try {
    const response = await fetch(INDEXNOW_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });

    // IndexNow returns 200 on success, non-200 on failure
    // Some implementations return 202 Accepted
    if (response.ok || response.status === 202) {
      return NextResponse.json({
        submitted: urls.length,
        total: body.urls.length,
        truncated: body.urls.length > 10_000,
        status: 'accepted',
      });
    }

    const errorText = await response.text().catch(() => 'unknown error');
    console.error(`IndexNow API error (${response.status}):`, errorText.slice(0, 500));

    return NextResponse.json({
      submitted: 0,
      total: body.urls.length,
      error: `IndexNow API returned ${response.status}: ${errorText.slice(0, 200)}`,
      status: 'failed',
    }, { status: 502 });
  } catch (e: any) {
    console.error('IndexNow fetch error:', e.message);
    return NextResponse.json({
      submitted: 0,
      total: body.urls.length,
      error: e.message,
      status: 'failed',
    }, { status: 502 });
  }
}
