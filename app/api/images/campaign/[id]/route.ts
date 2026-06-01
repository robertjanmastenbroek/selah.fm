import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Serve campaign cover images from database — matches campaign ID (full UUID or short hex) */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // id can be: full UUID, short 12-char hex (with optional .ext)
    const rawId = params.id.replace(/\.[a-z]+$/i, '');
    const isShort = /^[a-f0-9]{12}$/i.test(rawId);

    const [image] = isShort
      ? await sql`
          SELECT ci.data, ci.mime_type
          FROM campaign_images ci
          WHERE REPLACE(ci.campaign_id::text, '-', '') LIKE ${rawId + '%'}
          LIMIT 1
        `
      : await sql`
          SELECT ci.data, ci.mime_type
          FROM campaign_images ci
          WHERE ci.campaign_id = ${rawId}::uuid
          LIMIT 1
        `;

    if (!image?.data) {
      // Fallback to OG image
      return NextResponse.redirect('https://selah.fm/images/og-image.jpg');
    }

    const ext = params.id.includes('.png') ? 'png' : params.id.includes('.webp') ? 'webp' : 'jpeg';
    const mime = image.mime_type || `image/${ext}`;

    return new NextResponse(image.data, {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.redirect('https://selah.fm/images/og-image.jpg');
  }
}
