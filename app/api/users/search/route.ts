import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/search?q=...
 * Live autocomplete for messaging — searches real users (including creators).
 * Artists from discovered_artists are NOT included — they don't have accounts.
 */
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim();
    const id = request.nextUrl.searchParams.get('id')?.trim();

    // Direct ID lookup — for preselected user in messages
    if (id) {
      const users = await sql`
        SELECT u.id, u.display_name, u.profile_image_url, u.email
        FROM users u
        WHERE u.id = ${id}
        LIMIT 1
      `;
      const results = users.map((u: any) => ({
        id: u.id,
        display_name: u.display_name,
        profile_image_url: u.profile_image_url,
        _type: 'user' as const,
      }));
      return NextResponse.json({ users: results });
    }
    // No query = return all users (so New Message dialog shows everyone)
    // With query = filter by name/email with prefix matching
    const users = !q || q.length < 1 ? await sql`
      SELECT DISTINCT u.id, u.display_name, u.profile_image_url, u.email,
        CASE WHEN EXISTS (SELECT 1 FROM submissions s WHERE s.creator_id = u.id) THEN 0 ELSE 1 END AS is_creator
      FROM users u
      ORDER BY is_creator ASC, u.display_name ASC
      LIMIT 50
    ` : await sql`
      SELECT DISTINCT u.id, u.display_name, u.profile_image_url, u.email,
        CASE WHEN EXISTS (SELECT 1 FROM submissions s WHERE s.creator_id = u.id) THEN 0 ELSE 1 END AS is_creator
      FROM users u
      WHERE u.display_name ILIKE ${'%' + q + '%'}
         OR u.email ILIKE ${'%' + q + '%'}
      ORDER BY 
        is_creator ASC,
        CASE 
          WHEN u.display_name ILIKE ${q + '%'} THEN 0
          WHEN u.display_name ILIKE ${'%' + q + '%'} THEN 1
          ELSE 2
        END,
        u.display_name ASC
      LIMIT 15
    `;

    // Mask emails and add type label
    const results = users.map((u: any) => ({
      id: u.id,
      display_name: u.display_name + (u.is_creator === 0 ? ' 📹' : ''),
      profile_image_url: u.profile_image_url,
      email: u.email ? u.email.charAt(0) + '***@' + u.email.split('@')[1] : null,
      _type: 'user' as const,
    }));

    return NextResponse.json({ users: results });
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
