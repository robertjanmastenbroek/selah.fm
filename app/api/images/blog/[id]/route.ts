import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Serve blog images from database — matches short IDs (12 hex chars) or full UUIDs */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // id can be either:
    // - "a1b2c3d4e5f6.jpg" (short 12-char hex + ext)
    // - "a1b2c3d4-e5f6-..." (full UUID)
    const rawId = params.id.replace(/\.[a-z]+$/i, ''); // strip extension
    const isShort = /^[a-f0-9]{12}$/i.test(rawId);
    
    const [image] = isShort
      ? await sql`SELECT image_data, mime_type FROM blog_images WHERE REPLACE(id::text, '-', '') LIKE ${rawId + '%'} LIMIT 1`
      : await sql`SELECT image_data, mime_type FROM blog_images WHERE id = ${rawId}`;

    if (!image?.image_data) {
      return NextResponse.redirect('https://selah.fm/images/og-image.jpg');
    }

    const ext = params.id.includes('.png') ? 'png' : params.id.includes('.webp') ? 'webp' : 'jpeg';
    const mime = image.mime_type || `image/${ext}`;

    return new NextResponse(image.image_data, {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
        'CDN-Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.redirect('https://selah.fm/images/og-image.jpg');
  }
}
