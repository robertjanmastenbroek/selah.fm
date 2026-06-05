import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/me/delete
 * 
 * GDPR Article 17: Right to Erasure ("Right to be Forgotten").
 * Soft-deletes user data: anonymizes PII, sets deleted_at timestamp.
 * 
 * Data preserved (anonymized):
 * - Submissions, campaigns, earnings, messages — kept for platform integrity
 *   but disassociated from the anonymized user record
 * 
 * Data removed:
 * - Email, display name, profile image, social handles, Stripe IDs
 * - Session is invalidated after deletion
 */
export async function POST() {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = user.id;
    const now = new Date().toISOString();
    const anonymizedEmail = `deleted-${userId.slice(0, 8)}@selah.fm`;
    const anonymizedName = `Deleted User ${userId.slice(0, 8)}`;

    // Anonymize user profile
    await sql`
      UPDATE users SET
        email = ${anonymizedEmail},
        display_name = ${anonymizedName},
        profile_image_url = NULL,
        bio = NULL,
        genres = NULL,
        stripe_connect_id = NULL,
        stripe_account_id = NULL,
        stripe_onboarding_complete = false,
        tiktok_handle = NULL,
        instagram_handle = NULL,
        youtube_handle = NULL,
        facebook_handle = NULL,
        deleted_at = ${now},
        updated_at = ${now}
      WHERE id = ${userId}
    `;

    // Anonymize user's messages
    await sql`
      UPDATE messages SET
        content = '[deleted]'
      WHERE sender_id = ${userId} OR recipient_id = ${userId}
    `;

    // Delete notifications
    await sql`
      DELETE FROM notifications WHERE user_id = ${userId}
    `;

    // Anonymize creator stats
    await sql`
      UPDATE creator_stats SET
        top_platforms = NULL
      WHERE creator_id = ${userId}
    `;

    // Sign out from Supabase
    const supabase = await createClient();
    await supabase.auth.signOut();

    return NextResponse.json({
      deleted: true,
      message: 'Your account has been scheduled for deletion. Your PII has been anonymized.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
