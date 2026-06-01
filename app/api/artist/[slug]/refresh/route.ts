import { NextResponse } from 'next/server';
import { refreshArtistMetrics, getArtistCardData } from '@/lib/artist-metrics';
import sql from '@/lib/db';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/artist/[slug]/refresh
 * 
 * Refreshes metrics for a single artist live (Spotify + Deezer).
 * Rate-limited per IP: once per 5 minutes per artist.
 * Returns the updated card data.
 */
export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    // Rate limit: once per 5 min per artist per IP
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateKey = `${ip}:${params.slug}`;

    // Check last refresh time
    const [lastRefresh] = await sql`
      SELECT last_refreshed_at FROM artist_profiles ap
      WHERE ap.slug = ${params.slug} AND ap.last_refreshed_at > NOW() - INTERVAL '5 minutes'
    `;
    if (lastRefresh) {
      // Return cached data
      const [artist] = await sql`SELECT da.id, da.artist_name FROM artist_profiles ap JOIN discovered_artists da ON da.id = ap.artist_id WHERE ap.slug = ${params.slug} LIMIT 1`;
      if (!artist) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const data = await getArtistCardData(artist.id);
      return NextResponse.json({ ...data, cached: true, message: 'Refreshed recently. Try again in a few minutes.' });
    }

    // Fetch artist
    const [artist] = await sql`
      SELECT da.id, da.artist_name FROM artist_profiles ap
      JOIN discovered_artists da ON da.id = ap.artist_id
      WHERE ap.slug = ${params.slug} LIMIT 1
    `;
    if (!artist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Refresh metrics live
    await refreshArtistMetrics(artist.id, artist.artist_name);

    // Return updated card data
    const data = await getArtistCardData(artist.id);
    return NextResponse.json({ ...data, cached: false });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
