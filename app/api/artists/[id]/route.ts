import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const artists = await sql`
      SELECT u.id, u.display_name, u.bio, u.genres, u.tiktok_handle, u.instagram_handle, u.youtube_handle,
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
      WHERE u.id = ${params.id} AND u.user_type = 'artist'
      GROUP BY u.id, u.display_name, u.bio, u.genres, u.tiktok_handle, u.instagram_handle, u.youtube_handle
    `;

    if (artists.length === 0) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

    const artist = artists[0];

    // Get active campaigns
    const campaigns = await sql`
      SELECT id, track_title, cpm_rate_cents, total_budget_cents, budget_remaining_cents, cover_art_url, platforms, status, recommended_hashtags
      FROM campaigns WHERE artist_id = ${params.id} AND status = 'active'
      ORDER BY created_at DESC LIMIT 10
    `;

    return NextResponse.json({ ...artist, campaigns });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
