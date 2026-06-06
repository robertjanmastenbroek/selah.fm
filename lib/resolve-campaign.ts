/**
 * Resolve a track identifier (UUID or slug) to a campaign UUID.
 * Track pages use campaign data internally, so API routes that accept
 * campaign IDs should also accept track IDs.
 */
import sql from '@/lib/db';

export async function resolveCampaignId(input: string | undefined | null): Promise<string | null> {
  if (!input) return null;

  // Check if it's a UUID (campaign or track — try to find the campaign)
  const isUuid = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(input);

  if (isUuid) {
    // First try as campaign ID directly
    const [campaign] = await sql`SELECT id FROM campaigns WHERE id = ${input}::uuid LIMIT 1`;
    if (campaign) return campaign.id;

    // Try as artist_tracks ID → resolve to campaign via campaign_claims
    const [track] = await sql`
      SELECT cc.campaign_id FROM artist_tracks at
      JOIN campaign_claims cc ON cc.discovered_artist_id = at.artist_id
      WHERE at.id = ${input}::uuid
      LIMIT 1
    `;
    if (track) return track.campaign_id;

    return null;
  }

  // Try as campaign slug
  const [bySlug] = await sql`SELECT id FROM campaigns WHERE slug = ${input} LIMIT 1`;
  if (bySlug) return bySlug.id;

  return null;
}
