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
    // 0. Get already-used Pexels URLs to avoid duplicates
    const usedUrls = await sql`
      SELECT DISTINCT source_url FROM blog_images WHERE source_type = 'pexels' AND source_url IS NOT NULL
    `;
    const usedUrlSet = new Set(usedUrls.map((r: any) => r.source_url));

    // 1. Search Pexels — get more results for better dedup
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape&size=large`,
      { headers: { Authorization: PEXELS_API_KEY }, signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) return FALLBACK_IMAGE;

    const data = await res.json();
    if (!data.photos?.length) return FALLBACK_IMAGE;

    // Filter out already-used photos, then pick random from unused ones
    const unused = data.photos.filter((p: any) => {
      const url = p.src?.large2x || p.src?.large || p.src?.original;
      return url && !usedUrlSet.has(url);
    });
    
    // If all photos have been used, pick a random one anyway (better than fallback)
    const pool = unused.length > 0 ? unused : data.photos;
    const photo = pool[Math.floor(Math.random() * pool.length)];
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
    
    // Compute image hash for byte-level dedup
    const crypto = await import('crypto');
    const imageHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
    
    // Check if this exact image was already used
    const existingImage = await sql`
      SELECT id FROM blog_images WHERE image_hash = ${imageHash} LIMIT 1
    `;
    if (existingImage.length > 0) {
      // Reuse the existing image — just link it
      const shortId = existingImage[0].id.replace(/-/g, '').slice(0, 12);
      const existingExt = existingImage[0].mime_type?.includes('png') ? 'png' : 'jpg';
      return `/api/images/blog/${shortId}.${existingExt}`;
    }

    // 3. Store in database
    const [row] = await sql`
      INSERT INTO blog_images (blog_post_id, image_data, mime_type, source_url, source_type, image_hash)
      VALUES (${blogPostId || null}, ${imageBuffer}, ${contentType}, ${pexelsUrl}, 'pexels', ${imageHash})
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
