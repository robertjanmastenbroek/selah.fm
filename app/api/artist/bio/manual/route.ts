/**
 * app/api/artist/bio/manual/route.ts
 * Dashboard "Generate Bio" button endpoint.
 * Authenticated — only the artist (or their claimer) can generate.
 * Generates immediately and saves to artist_audits.
 */

import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { artistId } = await request.json();
    if (!artistId) return NextResponse.json({ error: 'artistId required' }, { status: 400 });

    // Verify the user has claimed this artist
    const [claim] = await sql`
      SELECT cc.id FROM campaign_claims cc WHERE cc.discovered_artist_id = ${artistId} AND cc.claimed_by = ${user.id} LIMIT 1
    `;
    if (!claim) {
      const [profile] = await sql`
        SELECT id FROM artist_profiles WHERE artist_id = ${artistId} AND claimed_by_user_id = ${user.id} LIMIT 1
      `;
      if (!profile) {
        return NextResponse.json({ error: 'You have not claimed this artist' }, { status: 403 });
      }
    }

    // Call the bio generation endpoint
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://selah.fm';
    const res = await fetch(`${origin}/api/artist/bio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET || '',
      },
      body: JSON.stringify({ artistId }),
      signal: AbortSignal.timeout(90000),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err.slice(0, 200) }, { status: res.status });
    }

    const data = await res.json();

    return NextResponse.json({
      bio: data.bio,
      score: data.score,
      angle: data.angle,
      tone: data.tone,
      word_count: data.word_count,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
