import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const artists = await sql`
      SELECT 
        u.id, u.display_name, u.bio,
        u.tiktok_handle, u.instagram_handle, u.youtube_handle,
        (SELECT c2.track_url FROM campaigns c2 WHERE c2.artist_id = u.id AND c2.track_url LIKE '%spotify%' ORDER BY c2.created_at DESC LIMIT 1) as spotify_url,
        COUNT(c.id) as total_campaigns,
        COUNT(c.id) FILTER (WHERE c.status = 'active') as active_campaigns,
        COALESCE(SUM(c.total_budget_cents), 0) as total_budget_cents,
        COALESCE(SUM(c.total_budget_cents - c.budget_remaining_cents), 0) as total_spent_cents,
        COALESCE(SUM(CAST(COALESCE(cs.approved_submissions, '0') AS INTEGER)), 0) as total_submissions,
        COALESCE(SUM(CAST(COALESCE(cs.total_verified_views, '0') AS INTEGER)), 0) as total_views
      FROM users u
      LEFT JOIN campaigns c ON c.artist_id = u.id
      LEFT JOIN campaign_stats cs ON cs.id = c.id
      WHERE u.is_artist = true
      GROUP BY u.id, u.display_name, u.bio, u.tiktok_handle, u.instagram_handle, u.youtube_handle
      HAVING COUNT(c.id) > 0
      ORDER BY total_spent_cents DESC
    `;

    let filtered = artists;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((a: any) =>
        a.display_name?.toLowerCase().includes(q) ||
        (a.bio || '').toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const page = filtered.slice(offset, offset + limit);

    return NextResponse.json({ artists: page, total, offset, limit });
  } catch (e: any) {
    return NextResponse.json({ artists: [], total: 0 });
  }
}
