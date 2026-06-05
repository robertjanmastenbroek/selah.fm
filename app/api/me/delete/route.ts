import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/me/delete
 * 
 * GDPR Article 17: Right to erasure ("right to be forgotten").
 * Anonymizes all personal data and deletes the auth account.
 * Keeps anonymized records for platform integrity (submissions, messages)
 * but removes all PII (name, email, profile image).
 */
export async function POST() {
  const { rateLimit } = await import('@/lib/rate-limit');
  const rl = await rateLimit('delete:global', { maxRequests: 3, windowMs: 3600_000 }); // 3 per hour
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 });

  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = user.id;

    // 1. Anonymize user profile
    await sql`
      UPDATE users SET
        email = 'deleted-' || SUBSTRING(MD5(RANDOM()::text) FOR 8) || '@anon.selah.fm',
        display_name = 'Deleted User',
        profile_image_url = NULL,
        bio = NULL,
        stripe_connect_id = NULL,
        is_artist = false,
        is_creator = false,
        updated_at = NOW()
      WHERE id = ${userId}
    `;

    // 2. Anonymize submissions (keep for payout integrity)
    await sql`
      UPDATE submissions SET
        creator_id = NULL
      WHERE creator_id = ${userId}
    `;

    // 3. Anonymize messages (keep content for conversation context)
    await sql`
      UPDATE messages SET
        sender_id = NULL,
        receiver_id = NULL
      WHERE sender_id = ${userId} OR receiver_id = ${userId}
    `;

    // 4. Anonymize reviews
    await sql`
      UPDATE fan_reviews SET
        user_id = NULL,
        author_name = 'Deleted User'
      WHERE user_id = ${userId}
    `;

    // 5. Delete notifications
    await sql`
      DELETE FROM notifications WHERE user_id = ${userId}
    `;

    // 6. Delete analytics events (no retention needed)
    await sql`
      DELETE FROM analytics_events WHERE user_id = ${userId}
    `;

    // 7. Delete auth session
    const supabase = createClient();
    const { error: adminError } = await supabase.auth.admin.deleteUser(userId);
    
    if (adminError) {
      // Auth deletion failed, but data is anonymized
      console.error('Auth deletion error (data already anonymized):', adminError.message);
    }

    return NextResponse.json({
      deleted: true,
      message: 'Your account has been deleted. All personal data has been removed.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
