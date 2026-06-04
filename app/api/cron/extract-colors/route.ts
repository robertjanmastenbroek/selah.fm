import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { extractDominantColor } from '@/lib/color-extract';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * GET /api/cron/extract-colors?limit=50&secret=...
 * Extracts dominant colors from artist cover art for dynamic gradients.
 * Processes artists without a dominant_color set.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

  try {
    const artists = await sql`
      SELECT ap.id, ap.slug, ap.spotify_image_url
      FROM artist_profiles ap
      WHERE (ap.dominant_color IS NULL OR ap.dominant_color = '')
        AND ap.spotify_image_url IS NOT NULL
      LIMIT ${limit}
    `;

    let processed = 0;
    let errors = 0;

    for (const artist of artists) {
      try {
        const color = await extractDominantColor(artist.spotify_image_url);
        if (color) {
          await sql`
            UPDATE artist_profiles SET dominant_color = ${color.rgb}
            WHERE id = ${artist.id}
          `;
          processed++;
        } else {
          // No color extracted — set a default based on name hash
          const hash = artist.slug?.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0) || 100;
          const hue = hash % 360;
          await sql`
            UPDATE artist_profiles SET dominant_color = ${`hsl(${hue}, 30%, 15%)`}
            WHERE id = ${artist.id}
          `;
          processed++;
        }
      } catch {
        errors++;
      }
    }

    return NextResponse.json({ processed, errors, remaining: artists.length - processed });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
