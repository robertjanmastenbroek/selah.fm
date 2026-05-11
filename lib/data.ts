import { cache } from 'react';
import sql from '@/lib/db';

// ── Deduplicated campaign fetcher ──────────────────────────
// Multiple components calling getCampaign(id) in the same request
// will share a single DB query via React's request memoization.

export const getCampaign = cache(async (id: string) => {
  // Support both UUID and slug lookup
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const campaigns = isUuid
    ? await sql`
        SELECT c.*,
          COALESCE(c.title, c.track_title) as title,
          COALESCE(v.approved_submissions, '0') as approved_submissions,
          COALESCE(v.pending_submissions, '0') as pending_submissions,
          COALESCE(v.total_verified_views, '0') as total_verified_views,
          u.display_name as artist_name,
          u.profile_image_url as artist_avatar
        FROM campaigns c
        LEFT JOIN campaign_stats v ON v.id = c.id
        LEFT JOIN users u ON u.id = c.artist_id
        WHERE c.id = ${id}::uuid
      `
    : await sql`
        SELECT c.*,
          COALESCE(c.title, c.track_title) as title,
          COALESCE(v.approved_submissions, '0') as approved_submissions,
          COALESCE(v.pending_submissions, '0') as pending_submissions,
          COALESCE(v.total_verified_views, '0') as total_verified_views,
          u.display_name as artist_name,
          u.profile_image_url as artist_avatar
        FROM campaigns c
        LEFT JOIN campaign_stats v ON v.id = c.id
        LEFT JOIN users u ON u.id = c.artist_id
        WHERE c.slug = ${id}
      `;

  if (campaigns.length === 0) return null;

  const campaign = campaigns[0];
  const campaignId = campaign.id;

  let donations = { totalCents: 0, count: 0, supporters: [] as any[] };
  try {
    const [totalRow] = await sql`
      SELECT COALESCE(SUM(amount_cents)::int, 0) as total, COUNT(*)::int as count
      FROM campaign_donations WHERE campaign_id = ${campaignId}
    `;
    donations.totalCents = totalRow?.total || 0;
    donations.count = totalRow?.count || 0;
    const supporters = await sql`
      SELECT donor_name, amount_cents, message, anonymous, created_at
      FROM campaign_donations WHERE campaign_id = ${campaignId}
      ORDER BY created_at DESC LIMIT 20
    `;
    donations.supporters = supporters;
  } catch {}

  return { ...campaign, donations };
});

// ── Deduplicated profile fetchers ──────────────────────────

export const getArtist = cache(async (id: string) => {
  const users = await sql`
    SELECT id, display_name, bio, genres, profile_image_url,
      (SELECT c2.track_url FROM campaigns c2 WHERE c2.artist_id = u.id AND c2.track_url LIKE '%spotify%' ORDER BY c2.created_at DESC LIMIT 1) as spotify_url
    FROM users u
    WHERE u.id = ${id} AND u.user_type = 'artist'
  `;
  return users[0] || null;
});

export const getCreator = cache(async (id: string) => {
  const users = await sql`
    SELECT id, display_name, bio, genres, profile_image_url,
      tiktok_handle, instagram_handle, youtube_handle,
      preferred_cpm_cents,
      COALESCE((SELECT COUNT(*)::int FROM submissions WHERE creator_id = u.id), 0) as total_submissions,
      COALESCE((SELECT COUNT(*)::int FROM submissions WHERE creator_id = u.id AND review_status = 'approved'), 0) as approved_submissions,
      COALESCE((SELECT COALESCE(SUM(payout_amount_cents), 0)::int FROM submissions WHERE creator_id = u.id AND payout_status = 'paid'), 0) as total_earned_cents
    FROM users u
    WHERE u.id = ${id} AND u.user_type = 'creator'
  `;
  return users[0] || null;
});

// ── Payload size guard ─────────────────────────────────────

export function assertLightweightPayload(data: unknown, maxBytes = 50000) {
  const size = JSON.stringify(data).length;
  if (size > maxBytes) {
    console.warn(`[Performance] Payload size exceeds ${maxBytes} bytes (${size}). Consider data minimization.`);
  }
}
