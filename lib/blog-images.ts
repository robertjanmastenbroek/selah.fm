/**
 * Image sourcing for blog posts — Pexels API (free tier).
 * 200 req/hour, 20,000/month — more than enough for our blog system.
 * Falls back to the Selah.fm OG image if unavailable.
 *
 * Requires PEXELS_API_KEY in environment.
 * Get a free key: https://www.pexels.com/api/
 */

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const FALLBACK_IMAGE = 'https://selah.fm/images/og-image.jpg';

/** Validate that a URL actually loads (HEAD request) */
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

/** Fetch a single landscape photo from Pexels matching the query */
export async function fetchBlogImage(query: string): Promise<string> {
  if (!PEXELS_API_KEY) return FALLBACK_IMAGE;

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape&size=large`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );

    if (!res.ok) return FALLBACK_IMAGE;

    const data = await res.json();
    if (!data.photos?.length) return FALLBACK_IMAGE;

    // Pick a random photo from the top 5 results for variety
    const photo = data.photos[Math.floor(Math.random() * Math.min(data.photos.length, 5))];
    const url = photo.src?.large2x || photo.src?.large || photo.src?.original || FALLBACK_IMAGE;

    return validateUrl(url);
  } catch {
    return FALLBACK_IMAGE;
  }
}

/** Fetch multiple images (uses rate limit efficiently) */
export async function fetchBlogImages(queries: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  for (const query of queries.slice(0, 5)) {
    results.set(query, await fetchBlogImage(query));
  }
  return results;
}
