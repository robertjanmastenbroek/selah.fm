/**
 * Image sourcing for blog posts — Pexels API → DB binary storage.
 * 
 * Images are downloaded and stored in the blog_images table as BYTEA.
 * Served via /api/images/blog/[id] endpoint.
 * 
 * Fallback chain: DB binary → Pexels CDN → /images/og-image.jpg
 * 
 * Requires PEXELS_API_KEY in environment.
 */

import sql from '@/lib/db';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const FALLBACK_IMAGE = '/images/og-image.jpg';

/** Fetch and store a blog image — downloads from Pexels, stores in DB, returns API URL */
export async function fetchBlogImage(query: string, blogPostId?: string): Promise<string> {
  if (!PEXELS_API_KEY) return FALLBACK_IMAGE;

  try {
    // 1. Search Pexels
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape&size=large`,
      { headers: { Authorization: PEXELS_API_KEY }, signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) return FALLBACK_IMAGE;

    const data = await res.json();
    if (!data.photos?.length) return FALLBACK_IMAGE;

    // Pick a random photo from top results
    const photo = data.photos[Math.floor(Math.random() * Math.min(data.photos.length, 5))];
    const pexelsUrl = photo.src?.large2x || photo.src?.large || photo.src?.original;
    if (!pexelsUrl) return FALLBACK_IMAGE;

    // 2. Download the image bytes
    const imageRes = await fetch(pexelsUrl, { signal: AbortSignal.timeout(15000) });
    if (!imageRes.ok) {
      // Download failed — use Pexels CDN as fallback
      console.warn(`[blog-images] Download failed for ${query}, using Pexels CDN`);
      return pexelsUrl;
    }

    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
    const contentType = imageRes.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';

    // 3. Store in database
    const [row] = await sql`
      INSERT INTO blog_images (blog_post_id, image_data, mime_type, source_url, source_type)
      VALUES (${blogPostId || null}, ${imageBuffer}, ${contentType}, ${pexelsUrl}, 'pexels')
      RETURNING id
    `;

    // Return short, clean URL: /api/images/blog/[short-id].[ext]
    const shortId = row.id.replace(/-/g, '').slice(0, 12);
    return `/api/images/blog/${shortId}.${ext}`;
  } catch (e) {
    console.error('[blog-images] Error:', (e as Error).message);
    return FALLBACK_IMAGE;
  }
}

/** Fetch multiple images — returns a map of query → image URL */
export async function fetchBlogImages(queries: string[], blogPostId?: string): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  for (const query of queries.slice(0, 5)) {
    results.set(query, await fetchBlogImage(query, blogPostId));
  }
  return results;
}

/** Update a blog post's featured image after the post is created */
export async function attachImageToPost(imageUrl: string, blogPostId: string): Promise<void> {
  // Extract short ID from URL: /api/images/blog/[shortId].[ext]
  const match = imageUrl.match(/\/api\/images\/blog\/([a-f0-9]{12})\.\w+/);
  if (!match) return;

  try {
    // Find the blog_images row whose UUID starts with this short ID
    await sql`
      UPDATE blog_images SET blog_post_id = ${blogPostId}
      WHERE REPLACE(id::text, '-', '') LIKE ${match[1] + '%'}
    `;
  } catch {
    // Best effort — image is stored, just not linked
  }
}
