import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

// Simple in-memory cache with 5-minute TTL
let cache: { data: any; ts: number } | null = null;

export async function GET() {
  try {
    const now = Date.now();
    if (cache && (now - cache.ts) < 300_000) {
      return NextResponse.json(cache.data);
    }

    // Total submissions
    const [subRow] = await sql`SELECT COUNT(*)::int as c FROM submissions`;
    // Total donations
    const [donRow] = await sql`SELECT COALESCE(SUM(amount_cents),0)::int as c FROM campaign_donations`;

    const data = {
      total_videos: subRow?.c || 0,
      total_donations: Math.round((donRow?.c || 0) / 100),
    };

    cache = { data, ts: now };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ total_videos: 0, total_donations: 0 });
  }
}
