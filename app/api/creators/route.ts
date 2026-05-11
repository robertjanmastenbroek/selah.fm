import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const creators = await sql`
      SELECT u.id, u.display_name, u.bio, u.genres, u.preferred_cpm_cents,
        u.tiktok_handle, u.instagram_handle, u.youtube_handle,
        u.profile_image_url,
        COALESCE(cs.total_submissions, 0) as total_submissions,
        COALESCE(cs.approved_submissions, 0) as approved_submissions,
        COALESCE(cs.acceptance_rate, 0) as acceptance_rate,
        COALESCE(cs.total_earned_cents, 0) as total_earned_cents
      FROM users u
      LEFT JOIN creator_stats cs ON cs.creator_id = u.id
      WHERE u.is_creator = true
      ORDER BY COALESCE(cs.total_earned_cents, 0) DESC
    `;

    let filtered = creators;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((c: any) =>
        c.display_name?.toLowerCase().includes(q) ||
        (c.genres || '').toLowerCase().includes(q) ||
        (c.bio || '').toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const page = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      creators: page,
      total,
      offset,
      limit,
    });
  } catch (e: any) {
    return NextResponse.json({ creators: [], total: 0 });
  }
}
