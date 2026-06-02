import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';


export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
    }

    // Search users by name/email AND also find creators who submitted videos
    const rawUsers = await sql`
      SELECT DISTINCT u.id, u.display_name, u.profile_image_url, u.email
      FROM users u
      WHERE 
        u.display_name ILIKE ${'%' + q + '%'}
        OR u.email ILIKE ${'%' + q + '%'}
        OR u.id IN (
          SELECT s.creator_id FROM submissions s
          WHERE s.creator_id IS NOT NULL
            AND (u.display_name ILIKE ${'%' + q + '%'} OR u.email ILIKE ${'%' + q + '%'})
        )
      LIMIT 20
    `;

    // Mask emails: show only first 2 chars + domain
    const users = rawUsers.map((u: any) => ({
      ...u,
      email: u.email ? u.email.charAt(0) + '***@' + u.email.split('@')[1] : null,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
