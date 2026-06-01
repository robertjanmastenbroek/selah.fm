/**
 * Backfill existing blog post images from Pexels CDN to DB storage.
 * Downloads each Pexels image, stores as BYTEA in blog_images,
 * and updates blog_posts.featured_image to /api/images/blog/[id].
 * 
 * Usage: node --env-file=.env.local scripts/backfill-blog-images.mjs
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log('🔍 Finding blog posts with Pexels images...\n');

  const { rows: posts } = await pool.query(
    `SELECT id, title, featured_image FROM blog_posts 
     WHERE featured_image LIKE '%pexels.com%' 
     ORDER BY published_at DESC`
  );

  console.log(`Found ${posts.length} posts with Pexels images\n`);

  let backfilled = 0;
  let skipped = 0;
  let failed = 0;

  for (const post of posts) {
    const pexelsUrl = post.featured_image;
    console.log(`  📥 ${post.title?.slice(0, 60)}...`);

    try {
      // Download from Pexels CDN
      const res = await fetch(pexelsUrl, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) {
        console.log(`    ⚠️  Download failed (HTTP ${res.status}), keeping Pexels URL`);
        skipped++;
        continue;
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get('content-type') || 'image/jpeg';

      // Store in blog_images
      const { rows: [img] } = await pool.query(
        `INSERT INTO blog_images (blog_post_id, image_data, mime_type, source_url, source_type)
         VALUES ($1, $2, $3, $4, 'pexels') RETURNING id`,
        [post.id, buffer, contentType, pexelsUrl]
      );

      // Update blog post to point to DB image
      const apiUrl = `/api/images/blog/${img.id}`;
      await pool.query(
        `UPDATE blog_posts SET featured_image = $1 WHERE id = $2`,
        [apiUrl, post.id]
      );

      console.log(`    ✅ Backfilled → ${apiUrl}`);
      backfilled++;
    } catch (e) {
      console.log(`    ❌ ${e.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Backfilled: ${backfilled} | Skipped: ${skipped} | Failed: ${failed}`);
  await pool.end();
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
