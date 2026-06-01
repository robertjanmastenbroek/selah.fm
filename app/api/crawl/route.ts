import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CRAWL4AI_URL = process.env.CRAWL4AI_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, extract_selectors, wait_for_selector, js_code } = body;
    if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

    const res = await fetch(`${CRAWL4AI_URL}/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        urls: [url],
        extract_config: extract_selectors ? { type: 'css', params: { selectors: extract_selectors } } : undefined,
        wait_for: wait_for_selector,
        js_code: js_code,
        stealth_mode: true,
        magic: true,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return NextResponse.json({ error: `crawl4ai ${res.status}` }, { status: 502 });
    return NextResponse.json(await res.json());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const res = await fetch(`${CRAWL4AI_URL}/health`, { signal: AbortSignal.timeout(5000) });
    return NextResponse.json({ ok: res.ok, status: res.status });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}
