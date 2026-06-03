import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/search?q=...
 * Live autocomplete for messaging — searches users, artists, and creators.
 * Shows suggestions after 1 character typed.
 */
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim();
    if (!q || q.length < 1) {
      return NextResponse.json({ users: [] });
    }

    const pattern = '%' + q + '%';

    // Search users by name/email
    const users = await sql`
      SELECT DISTINCT u.id, u.display_name, u.profile_image_url, u.email
      FROM users u
      WHERE u.display_name ILIKE ${pattern}
         OR u.email ILIKE ${pattern}
      ORDER BY 
        CASE 
          WHEN u.display_name ILIKE ${q + '%'} THEN 0
          WHEN u.display_name ILIKE ${'%' + q + '%'} THEN 1
          ELSE 2
        END,
        u.display_name ASC
      LIMIT 10
    `;

    // Also search discovered_artists for artist names (in case someone wants to message an artist)
    const artists = await sql`
      SELECT da.id, da.artist_name, ap.spotify_image_url
      FROM discovered_artists da
      LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
      WHERE da.artist_name ILIKE ${pattern}
      ORDER BY 
        CASE 
          WHEN da.artist_name ILIKE ${q + '%'} THEN 0
          ELSE 1
        END,
        da.monthly_listeners DESC NULLS LAST
      LIMIT 5
    `;

    // Mask emails
    const maskedUsers = users.map((u: any) => ({
      ...u,
      email: u.email ? u.email.charAt(0) + '***@' + u.email.split('@')[1] : null,
      _type: 'user' as const,
    }));

    // Add artist suggestions as virtual "users" (no real user account — they link to artist page)
    const artistResults = artists.map((a: any) => ({
      id: a.id,
      display_name: a.artist_name + ' 🎵',
      profile_image_url: a.spotify_image_url,
      email: null,
      _type: 'artist' as const,
      _slug: null as string | null,
    }));

    return NextResponse.json({ users: [...maskedUsers, ...artistResults] });
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
