import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /artist/[slug]/embed — Server-rendered embed widget iframe
 * Returns lightweight HTML with artist card for embedding on external sites.
 */
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const [artist] = await sql`
      SELECT da.artist_name, da.genres, da.monthly_listeners,
             ap.slug, ap.spotify_image_url,
             COUNT(DISTINCT c.id)::int as track_count
      FROM discovered_artists da
      JOIN artist_profiles ap ON ap.artist_id = da.id
      LEFT JOIN campaign_claims cc ON cc.discovered_artist_id = da.id
      LEFT JOIN campaigns c ON c.id = cc.campaign_id AND c.status = 'active'
      WHERE ap.slug = ${params.slug}
      GROUP BY da.id, ap.slug, ap.spotify_image_url
      LIMIT 1
    `;

    if (!artist) {
      return new NextResponse('Artist not found', { status: 404 });
    }

    const genres = artist.genres
      ? (Array.isArray(artist.genres) ? artist.genres.slice(0, 2) : [artist.genres])
      : [];
    const imageUrl = artist.spotify_image_url || '';
    const name = artist.artist_name || '';
    const trackLabel = artist.track_count === 1 ? '1 track' : `${artist.track_count} tracks`;
    const listeners = artist.monthly_listeners
      ? `${artist.monthly_listeners >= 1000 ? (artist.monthly_listeners / 1000).toFixed(1) + 'K' : artist.monthly_listeners} monthly listeners`
      : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support ${name} on Selah.fm</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0F0F23;
      color: #F0F0F0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      overflow: hidden;
      width: 300px;
      text-align: center;
    }
    .image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      background: linear-gradient(135deg, rgba(67,56,202,0.1), rgba(34,197,94,0.05));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      color: rgba(255,255,255,0.1);
      font-weight: bold;
    }
    .body { padding: 20px; }
    .name { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    .genre { font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .stats { font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 16px; }
    .cta {
      display: inline-block;
      padding: 12px 24px;
      background: linear-gradient(135deg, #4338CA, #3730A3);
      color: white;
      text-decoration: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      transition: opacity 0.2s;
    }
    .cta:hover { opacity: 0.9; }
    .footer {
      margin-top: 16px;
      font-size: 10px;
      color: rgba(255,255,255,0.2);
    }
    .footer a { color: rgba(255,255,255,0.3); text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    ${imageUrl
      ? `<img class="image" src="${imageUrl}" alt="${name}" loading="lazy">`
      : `<div class="image">${name[0]?.toUpperCase() || '?'}</div>`
    }
    <div class="body">
      <div class="name">${name}</div>
      ${genres.length > 0 ? `<div class="genre">${genres.join(' · ')}</div>` : ''}
      <div class="stats">${trackLabel}${listeners ? ' · ' + listeners : ''}</div>
      <a class="cta" href="https://selah.fm/artist/${params.slug}?utm_source=embed&utm_medium=artist_widget" target="_blank" rel="noopener">
        🎬 Make content & earn →
      </a>
      <div class="footer">
        Powered by <a href="https://selah.fm" target="_blank" rel="noopener">Selah.fm</a>
      </div>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (e: any) {
    return new NextResponse('Error loading artist', { status: 500 });
  }
}
