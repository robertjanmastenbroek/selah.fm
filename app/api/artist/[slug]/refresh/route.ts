import { NextResponse } from 'next/server';
import { refreshArtistMetrics, getArtistMetricsTimeline } from '@/lib/artist-metrics';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const [lastRefresh] = await sql`
      SELECT last_refreshed_at FROM artist_profiles ap
      WHERE ap.slug = ${params.slug} AND ap.last_refreshed_at > NOW() - INTERVAL '5 minutes'
    `;
    if (lastRefresh) {
      const [artist] = await sql`SELECT da.id FROM artist_profiles ap JOIN discovered_artists da ON da.id = ap.artist_id WHERE ap.slug = ${params.slug} LIMIT 1`;
      if (!artist) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const data = await getArtistMetricsTimeline(artist.id);
      return NextResponse.json({ ...data, cached: true });
    }

    const [artist] = await sql`SELECT da.id, da.artist_name FROM artist_profiles ap JOIN discovered_artists da ON da.id = ap.artist_id WHERE ap.slug = ${params.slug} LIMIT 1`;
    if (!artist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await refreshArtistMetrics(artist.id, artist.artist_name);
    const data = await getArtistMetricsTimeline(artist.id);
    return NextResponse.json({ ...data, cached: false });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
