import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;
  if (!filename) return new NextResponse('Not found', { status: 404 });

  try {
    const [row] = await sql`
      SELECT ci.data, ci.mime FROM campaign_images ci
      JOIN campaigns c ON c.id = ci.campaign_id
      WHERE c.cover_art_url LIKE ${'%' + filename}
      LIMIT 1
    `;

    if (!row?.data) {
      return new NextResponse('Not found', { status: 404 });
    }

    const mime = row.mime || 'image/jpeg';

    return new NextResponse(row.data, {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Server error', { status: 500 });
  }
}
