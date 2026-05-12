/**
 * Image sourcing for blog posts — Unsplash API (free tier).
 * Falls back to a default Selah.fm image if API is unavailable.
 * All URLs are validated before use to prevent broken images.
 *
 * Requires UNSPLASH_ACCESS_KEY in environment (optional).
 */

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const FALLBACK_IMAGE = 'https://selah.fm/images/hero-illustration.png';

/** Validate that a URL actually loads (HEAD request, follows redirects) */
export async function validateImageUrl(url: string): Promise<string> {
  if (!url || url.startsWith('data:')) return FALLBACK_IMAGE;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) return url;
    return FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE;
  }
}

export async function fetchBlogImage(query: string): Promise<string> {
  if (!UNSPLASH_ACCESS_KEY) return FALLBACK_IMAGE;

  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&w=1200&h=630`,
      { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
    );

    if (!res.ok) return FALLBACK_IMAGE;

    const data = await res.json();
    const url = data.urls?.regular || data.urls?.small || FALLBACK_IMAGE;
    // Validate the returned URL actually loads
    return validateImageUrl(url);
  } catch {
    return FALLBACK_IMAGE;
  }
}

export async function fetchBlogImages(queries: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  for (const query of queries.slice(0, 5)) {
    const url = await fetchBlogImage(query);
    results.set(query, url);
  }
  return results;
}

/** Sanitize post content: replace any broken <img> tags with the fallback image */
export function sanitizePostImages(html: string): string {
  if (!html) return html;
  // Replace src attributes that point to known-broken patterns with fallback
  // Also ensure every <img> has an onerror fallback
  return html.replace(
    /<img([^>]*?)src="([^"]*?)"([^>]*?)>/g,
    (match, before, src, after) => {
      // If src is empty or a data URL that's too long (base64), replace
      if (!src || src.startsWith('data:') || src.length < 10) {
        return `<img${before}src="${FALLBACK_IMAGE}"${after} onerror="this.src='${FALLBACK_IMAGE}'">`;
      }
      // Add onerror fallback to every image
      if (!match.includes('onerror')) {
        return `<img${before}src="${src}"${after} onerror="this.src='${FALLBACK_IMAGE}'">`;
      }
      return match;
    }
  );
}
