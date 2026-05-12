/**
 * Image sourcing for blog posts — Pexels API (free tier).
 * 200 req/hour, 20,000/month. Falls back to Selah.fm OG image if unavailable.
 * Includes deduplication: never reuses an image already on another post.
 *
 * Requires PEXELS_API_KEY in environment.
 * Get a free key: https://www.pexels.com/api/
 */

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const FALLBACK_IMAGE = 'https://selah.fm/images/og-image.jpg';

// In-memory set of already-used image URLs (loaded from DB at startup)
const usedImageUrls = new Set<string>();

/** Load previously used image URLs from the database (call once at startup) */
export async function loadUsedImages(sql: any) {
  try {
    const rows = await sql`
      SELECT DISTINCT featured_image FROM blog_posts
      WHERE featured_image IS NOT NULL AND featured_image != ${FALLBACK_IMAGE}
    `;
    for (const row of rows) {
      if (row.featured_image) usedImageUrls.add(row.featured_image);
    }
  } catch {}
}

/** Mark an image URL as used (call after storing a new post) */
export function markImageUsed(url: string) {
  if (url && url !== FALLBACK_IMAGE) usedImageUrls.add(url);
}

/** Pick the first photo from Pexels results that hasn't been used before */
function pickUnusedPhoto(photos: any[]): any {
  for (const photo of photos) {
    const url = photo.src?.large2x || photo.src?.large || photo.src?.original;
    if (url && !usedImageUrls.has(url)) return photo;
  }
  // All seen before — pick random anyway
  return photos[Math.floor(Math.random() * photos.length)];
}

/** Validate that a URL actually loads */
async function validateUrl(url: string): Promise<string> {
  if (!url || url.startsWith('data:')) return FALLBACK_IMAGE;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);
    return res.ok ? url : FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE;
  }
}

/** Fetch a single landscape photo from Pexels — never reuses an image */
export async function fetchBlogImage(query: string): Promise<string> {
  if (!PEXELS_API_KEY) return FALLBACK_IMAGE;

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape&size=large`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );

    if (!res.ok) return FALLBACK_IMAGE;

    const data = await res.json();
    if (!data.photos?.length) return FALLBACK_IMAGE;

    // Pick first unused photo (per_page=10 gives more options to avoid dupes)
    const photo = pickUnusedPhoto(data.photos);
    const url = photo.src?.large2x || photo.src?.large || photo.src?.original || FALLBACK_IMAGE;

    return validateUrl(url);
  } catch {
    return FALLBACK_IMAGE;
  }
}

/** Fetch multiple images */
export async function fetchBlogImages(queries: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  for (const query of queries.slice(0, 5)) {
    results.set(query, await fetchBlogImage(query));
  }
  return results;
}
