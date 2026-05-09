import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
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
      WHERE u.user_type = 'creator' OR u.user_type IS NULL
      ORDER BY COALESCE(cs.total_earned_cents, 0) DESC
      LIMIT 50
    `;
    return NextResponse.json(creators);
  } catch (e: any) {
    return NextResponse.json([], { status: 200 });
  }
}
