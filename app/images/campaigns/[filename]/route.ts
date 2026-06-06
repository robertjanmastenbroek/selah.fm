import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Redirect old /images/campaigns/{filename} requests to Storage or fallback */
export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;
  if (!filename) return new NextResponse('Not found', { status: 404 });

  try {
    const [campaign] = await sql`
      SELECT cover_art_url FROM campaigns
      WHERE cover_art_url LIKE ${'%' + filename}
      LIMIT 1
    `;

    if (campaign?.cover_art_url?.startsWith('http')) {
      return NextResponse.redirect(campaign.cover_art_url, 308);
    }
  } catch {
    // Fall through to og-image
  }

  return NextResponse.redirect('https://selah.fm/images/og-image.jpg', 308);
}
