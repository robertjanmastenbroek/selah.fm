/**
 * Image sourcing for blog posts — Unsplash API (free tier).
 * Falls back to a default Selah.fm image if API is unavailable.
 *
 * Requires UNSPLASH_ACCESS_KEY in environment (optional).
 */

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

export async function fetchBlogImage(query: string): Promise<string> {
  // Default fallback image
  const fallback = 'https://selah.fm/images/hero-illustration.png';

  if (!UNSPLASH_ACCESS_KEY) return fallback;

  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&w=1200&h=630`,
      { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
    );

    if (!res.ok) return fallback;

    const data = await res.json();
    return data.urls?.regular || data.urls?.small || fallback;
  } catch {
    return fallback;
  }
}

export async function fetchBlogImages(queries: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  // Fetch each image (Unsplash free tier: 50 req/hour — fine for monthly batch)
  for (const query of queries.slice(0, 5)) { // Limit to 5 to stay within rate limits
    const url = await fetchBlogImage(query);
    results.set(query, url);
  }

  return results;
}
