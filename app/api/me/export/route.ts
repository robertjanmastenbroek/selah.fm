import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

/**
 * GET /api/me/export
 * 
 * GDPR Article 15+20: Data Subject Access Request.
 * Returns all user data in a machine-readable JSON format.
 * Covers: profile, campaigns, submissions, earnings, messages, notifications.
 */
export async function GET() {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = user.id;

    // Fetch all user data in parallel
    const [
      profile,
      campaigns,
      submissions,
      earnings,
      messages,
      notifications,
      donations,
      referrals,
      analytics,
    ] = await Promise.all([
      // Profile
      sql`SELECT id, email, display_name, user_type, is_artist, is_creator,
                 bio, genres, preferred_cpm_cents, profile_image_url,
                 stripe_connect_id, referred_by, referral_code,
                 onboarded_at, created_at, updated_at
          FROM users WHERE id = ${userId}`,
      // Campaigns (as artist)
      sql`SELECT id, track_title, slug, track_url, cpm_rate_cents,
                 total_budget_cents, budget_remaining_cents, max_payout_per_submission_cents,
                 requirements, status, is_unclaimed, is_pinned,
                 created_at, updated_at
          FROM campaigns WHERE artist_id = ${userId}`,
      // Submissions (as creator)
      sql`SELECT id, campaign_id, content_url, platform,
                 review_status, payout_status, payout_amount_cents,
                 views_verified, feedback, rejection_reason,
                 submitted_at, reviewed_at
          FROM submissions WHERE creator_id = ${userId}`,
      // Earnings
      sql`SELECT id, campaign_id, submission_id, amount_cents, type,
                 status, stripe_transfer_id,
                 created_at
          FROM earnings WHERE user_id = ${userId}`,
      // Messages
      sql`SELECT id, campaign_id, sender_id, content,
                 created_at, edited_at
          FROM messages WHERE sender_id = ${userId} OR recipient_id = ${userId}`,
      // Notifications
      sql`SELECT id, type, message, link, read,
                 created_at
          FROM notifications WHERE user_id = ${userId}`,
      // Donations made
      sql`SELECT id, campaign_id, amount_cents, donor_name, donor_message,
                 created_at
          FROM campaign_donations WHERE donor_id = ${userId}`,
      // Referral info
      sql`SELECT id, referred_by, referral_code, created_at
          FROM users WHERE id = ${userId}`,
      // Analytics events (anonymized — no personal data in events)
      sql`SELECT event, path, created_at
          FROM analytics_events WHERE user_id = ${userId}
          ORDER BY created_at DESC LIMIT 1000`,
    ]);

    return NextResponse.json({
      exported_at: new Date().toISOString(),
      data: {
        profile: profile[0] || null,
        campaigns,
        submissions,
        earnings,
        messages,
        notifications,
        donations,
        referrals: referrals[0] || null,
        analytics_events: analytics,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
