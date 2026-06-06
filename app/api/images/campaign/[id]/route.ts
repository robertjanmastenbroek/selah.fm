import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Redirect campaign image requests to Storage URL or fallback */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rawId = params.id.replace(/\.[a-z]+$/i, '');
    const isShort = /^[a-f0-9]{12}$/i.test(rawId);

    const [campaign] = isShort
      ? await sql`SELECT cover_art_url FROM campaigns WHERE REPLACE(id::text, '-', '') LIKE ${rawId + '%'} LIMIT 1`
      : await sql`SELECT cover_art_url FROM campaigns WHERE id = ${rawId}::uuid LIMIT 1`;

    if (campaign?.cover_art_url?.startsWith('http')) {
      return NextResponse.redirect(campaign.cover_art_url, 308);
    }
  } catch {
    // Fall through to og-image
  }

  return NextResponse.redirect('https://selah.fm/images/og-image.jpg', 308);
}
