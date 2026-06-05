/**
 * lib/upload-campaign-image.ts
 * Uploads a campaign cover image to Supabase Storage and returns the public URL.
 * Replaces the old campaign_images BYTEA pattern.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function uploadCampaignImage(
  buffer: Buffer,
  mimeType: string,
  campaignId: string,
): Promise<string> {
  const filename = `${campaignId}.webp`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/campaign-covers/${filename}`;

  const contentType = mimeType.includes('png') ? 'image/png'
    : mimeType.includes('webp') ? 'image/webp'
    : 'image/jpeg';

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': contentType,
        },
        body: buffer as unknown as BodyInit,
      });
      if (res.ok) {
        return `${SUPABASE_URL}/storage/v1/object/public/campaign-covers/${filename}`;
      }
      // Wait before retry
      await new Promise(r => setTimeout(r, 500));
    } catch {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Fallback — should not happen in practice
  return '/images/og-image.jpg';
}
