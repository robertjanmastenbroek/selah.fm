/**
 * Image sourcing for blog posts — Pexels API → local cache.
 * Downloads images to /public/images/blog/ so they're served from our domain.
 * Includes deduplication and optional Pexels attribution.
 *
 * Requires PEXELS_API_KEY in environment.
 * Get a free key: https://www.pexels.com/api/
 */

import fs from 'fs';
import path from 'path';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const FALLBACK_IMAGE = '/images/og-image.jpg';
const CACHE_DIR = path.join(process.cwd(), 'public/images/blog');

// Ensure cache directory exists
try { fs.mkdirSync(CACHE_DIR, { recursive: true }); } catch {}

// Track used images + their Pexels source URLs for attribution
const usedImageUrls = new Set<string>();
const imageAttribution = new Map<string, string>(); // localUrl → pexelsUrl

/** Load previously used image URLs from DB */
export async function loadUsedImages(sql: any) {
  try {
    const rows = await sql`
      SELECT DISTINCT featured_image, pexels_source_url FROM blog_posts
      WHERE featured_image IS NOT NULL AND featured_image != ${FALLBACK_IMAGE}
    `;
    for (const row of rows) {
      if (row.featured_image) usedImageUrls.add(row.featured_image);
    }
  } catch {}
}

/** Mark an image URL as used */
export function markImageUsed(url: string) {
  if (url && url !== FALLBACK_IMAGE) usedImageUrls.add(url);
}

/** Get the original Pexels source URL for a cached image */
export function getAttribution(localUrl: string): string | undefined {
  return imageAttribution.get(localUrl);
}

/** Download a Pexels image to our /public/images/blog/ directory */
async function downloadToCache(pexelsUrl: string, query: string): Promise<string | null> {
  try {
    const res = await fetch(pexelsUrl);
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = pexelsUrl.match(/\.(jpe?g|png|webp)/)?.[1] || 'jpg';
    const filename = `blog-${query.replace(/[^a-z0-9]+/g, '-').slice(0, 50)}-${Date.now().toString(36)}.${ext}`;
    const filepath = path.join(CACHE_DIR, filename);

    fs.writeFileSync(filepath, buffer);

    const localUrl = `/images/blog/${filename}`;
    imageAttribution.set(localUrl, pexelsUrl); // store attribution

    return localUrl;
  } catch (e) {
    console.error('Failed to download image:', (e as Error).message);
    return null;
  }
}

/** Pick first unused photo from Pexels results */
function pickUnusedPhoto(photos: any[]): any {
  for (const photo of photos) {
    const url = photo.src?.large2x || photo.src?.large || photo.src?.original;
    if (url && !usedImageUrls.has(url)) return photo;
  }
  return photos[Math.floor(Math.random() * photos.length)];
}

/** Fetch and cache a single image from Pexels */
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

    const photo = pickUnusedPhoto(data.photos);
    const pexelsUrl = photo.src?.large2x || photo.src?.large || photo.src?.original;
    if (!pexelsUrl) return FALLBACK_IMAGE;

    // Download to our server
    const localUrl = await downloadToCache(pexelsUrl, query);
    if (localUrl) {
      markImageUsed(localUrl);
      return localUrl;
    }

    return FALLBACK_IMAGE;
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
