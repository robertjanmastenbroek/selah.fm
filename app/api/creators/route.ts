import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // Count total matching creators (for pagination)
    let countQuery = sql`SELECT COUNT(*)::int as count FROM users u WHERE u.is_creator = true`;
    if (search) {
      const q = `%${search}%`;
      countQuery = sql`
        SELECT COUNT(*)::int as count FROM users u
        WHERE u.is_creator = true AND (
          u.display_name ILIKE ${q} OR u.genres ILIKE ${q} OR u.bio ILIKE ${q}
        )
      `;
    }
    const [{ count: total }] = await countQuery;

    // Fetch paginated results with search in SQL
    let query;
    if (search) {
      const q = `%${search}%`;
      query = sql`
        SELECT u.id, u.display_name, u.bio, u.genres, u.preferred_cpm_cents,
          u.tiktok_handle, u.instagram_handle, u.youtube_handle,
          u.profile_image_url,
          COALESCE(cs.total_submissions, 0) as total_submissions,
          COALESCE(cs.approved_submissions, 0) as approved_submissions,
          COALESCE(cs.acceptance_rate, 0) as acceptance_rate,
          COALESCE(cs.total_earned_cents, 0) as total_earned_cents
        FROM users u
        LEFT JOIN creator_stats cs ON cs.creator_id = u.id
        WHERE u.is_creator = true AND (
          u.display_name ILIKE ${q} OR u.genres ILIKE ${q} OR u.bio ILIKE ${q}
        )
        ORDER BY COALESCE(cs.total_earned_cents, 0) DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      query = sql`
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
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const page = await query;

    return NextResponse.json({
      creators: page,
      total,
      offset,
      limit,
    });
  } catch (e: any) {
    console.error('Creators GET error:', e.message);
    return NextResponse.json({ error: e.message, creators: [], total: 0 }, { status: 500 });
  }
}
