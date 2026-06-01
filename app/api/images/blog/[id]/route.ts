import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Serve blog images from database with proper caching headers */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [image] = await sql`
      SELECT image_data, mime_type FROM blog_images WHERE id = ${params.id}
    `;

    if (!image?.image_data) {
      return NextResponse.redirect('https://selah.fm/images/og-image.jpg');
    }

    return new NextResponse(image.image_data, {
      headers: {
        'Content-Type': image.mime_type || 'image/jpeg',
        'Cache-Control': 'public, max-age=604800, immutable', // 7 days
        'CDN-Cache-Control': 'public, max-age=86400', // 1 day for CDN
      },
    });
  } catch {
    return NextResponse.redirect('https://selah.fm/images/og-image.jpg');
  }
}
