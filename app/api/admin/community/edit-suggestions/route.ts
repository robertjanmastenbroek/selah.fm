import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/community/edit-suggestions
 * Lists edit suggestions filtered by status.
 * Requires admin authentication (email-based).
 */
export async function GET(request: Request) {
  try {
    // Admin check
    const cookies = request.headers.get('cookie') || '';
    const sessionMatch = cookies.match(/sb-[^=]+=([^;]+)/);
    if (!sessionMatch) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const [user] = await sql`SELECT email FROM auth.users WHERE id::text = ${sessionMatch[1]} LIMIT 1`;
    if (!user || user.email !== 'motomotosings@gmail.com') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '50'));

    const suggestions = await sql`
      SELECT aes.id, aes.user_id, aes.artist_id, aes.field_name,
             aes.current_value, aes.suggested_value, aes.reason,
             aes.status, aes.created_at,
             ap.slug as artist_slug
      FROM artist_edit_suggestions aes
      LEFT JOIN artist_profiles ap ON ap.artist_id = aes.artist_id
      WHERE aes.status = ${status}
      ORDER BY aes.created_at ASC
      LIMIT ${limit}
    `;

    return NextResponse.json({ suggestions });
  } catch (e: any) {
    console.error('[ADMIN COMMUNITY] Error listing suggestions:', e.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
