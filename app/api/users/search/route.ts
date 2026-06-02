import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
    }

    const users = await sql`
      SELECT id, display_name, profile_image_url, email
      FROM users
      WHERE 
        display_name ILIKE ${'%' + q + '%'}
        OR email ILIKE ${'%' + q + '%'}
      LIMIT 10
    `;

    return NextResponse.json({ users });
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
