import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const creators = await sql`
      SELECT u.id, u.display_name, u.bio, u.genres, u.preferred_cpm_cents,
        u.tiktok_handle, u.instagram_handle, u.youtube_handle,
        u.profile_image_url,
        COALESCE(cs.total_submissions, 0) as total_submissions,
        COALESCE(cs.approved_submissions, 0) as approved_submissions,
        COALESCE(cs.acceptance_rate, 0) as acceptance_rate,
        COALESCE(cs.total_earned_cents, 0) as total_earned_cents,
        COALESCE(cs.total_verified_views, 0) as total_verified_views
      FROM users u
      LEFT JOIN creator_stats cs ON cs.creator_id = u.id
      WHERE u.id = ${params.id} AND u.user_type = 'creator'
    `;

    if (creators.length === 0) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    return NextResponse.json(creators[0]);
  } catch (e: any) {
    console.error('Creator GET error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
