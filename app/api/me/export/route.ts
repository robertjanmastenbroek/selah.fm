import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/me/export
 * 
 * Returns all data associated with the authenticated user (GDPR Article 20).
 * Data portability: JSON dump of user's profile, campaigns, submissions,
 * messages, notifications, earnings, and activity.
 */
export async function GET() {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = user.id;

    // Gather all data in parallel
    const [
      profile,
      campaigns,
      submissions,
      messages,
      notifications,
      referrals,
      reviews,
      activity,
    ] = await Promise.all([
      // Profile data
      sql`SELECT * FROM users WHERE id = ${userId}`,
      // Campaigns
      sql`SELECT * FROM campaigns WHERE artist_id = ${userId}`,
      // Submissions
      sql`
        SELECT s.*, c.track_title 
        FROM submissions s 
        LEFT JOIN campaigns c ON c.id = s.campaign_id 
        WHERE s.creator_id = ${userId}
      `,
      // Messages
      sql`
        SELECT id, content, created_at, 
               CASE WHEN sender_id = ${userId} THEN 'sent' ELSE 'received' END as direction
        FROM messages 
        WHERE sender_id = ${userId} OR receiver_id = ${userId}
      `,
      // Notifications
      sql`SELECT id, type, message, link, read, created_at FROM notifications WHERE user_id = ${userId}`,
      // Referrals
      sql`SELECT id, referral_code, referred_by, referral_earnings_cents FROM users WHERE id = ${userId}`,
      // Reviews written
      sql`SELECT id, rating, review_text, created_at FROM fan_reviews WHERE user_id = ${userId}`,
      // Activity events
      sql`SELECT id, event, path, metadata, created_at FROM analytics_events WHERE user_id = ${userId}`,
    ]);

    // Sanitize sensitive fields
    const sanitizedProfile = profile[0] ? {
      id: profile[0].id,
      email: profile[0].email,
      display_name: profile[0].display_name,
      user_type: profile[0].user_type,
      is_artist: profile[0].is_artist,
      is_creator: profile[0].is_creator,
      created_at: profile[0].created_at,
      onboarded_at: profile[0].onboarded_at,
    } : null;

    return NextResponse.json({
      exported_at: new Date().toISOString(),
      user_id: userId,
      profile: sanitizedProfile,
      campaigns: campaigns.map((c: any) => ({
        id: c.id,
        title: c.title,
        track_title: c.track_title,
        status: c.status,
        cpm_rate_cents: c.cpm_rate_cents,
        total_budget_cents: c.total_budget_cents,
        created_at: c.created_at,
      })),
      submissions: submissions.map((s: any) => ({
        id: s.id,
        campaign_track: s.track_title,
        content_url: s.content_url,
        platform: s.platform,
        review_status: s.review_status,
        payout_status: s.payout_status,
        views_verified: s.views_verified,
        created_at: s.created_at,
      })),
      messages: messages.map((m: any) => ({
        id: m.id,
        direction: m.direction,
        created_at: m.created_at,
      })) as any[],
      notifications: notifications.map((n: any) => ({
        id: n.id,
        type: n.type,
        message: n.message,
        read: n.read,
        created_at: n.created_at,
      })),
      referrals: referrals[0] ? {
        referral_code: referrals[0].referral_code,
        referred_by: referrals[0].referred_by,
        earnings_cents: referrals[0].referral_earnings_cents,
      } : null,
      reviews: reviews.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        review_text: r.review_text,
        created_at: r.created_at,
      })),
      activity_event_count: activity.length,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
