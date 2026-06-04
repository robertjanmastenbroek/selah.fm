import { Pool } from 'pg';

const DB = 'postgresql://postgres.jxniwtzbkthrgmyrslno:GDGSL9tAOLSRLTbn@aws-1-us-west-2.pooler.supabase.com:5432/postgres';
const pool = new Pool({
  connectionString: DB + '?pgbouncer=true',
  ssl: { rejectUnauthorized: false },
  max: 3,
});

let found = 0, failed = 0, skipped = 0;

async function fetchArtistImage(name) {
  const clean = name.replace(/^\[.*?\]\s*/i, '').trim();
  if (!clean || clean.length < 2) return null;
  try {
    const res = await fetch(
      `https://api.deezer.com/search/artist?q=${encodeURIComponent(clean)}&limit=3`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.data?.[0]) {
        return data.data[0].picture_medium || data.data[0].picture_big || data.data[0].picture_xl || null;
      }
    }
  } catch {}
  return null;
}

async function processBatch(artists, start) {
  for (let i = 0; i < artists.length; i++) {
    const a = artists[i];
    // Skip Deezer images — they're already good
    if (a.spotify_image_url && a.spotify_image_url.includes('dzcdn')) {
      skipped++;
      continue;
    }
    const img = await fetchArtistImage(a.artist_name);
    if (img) {
      await pool.query('UPDATE artist_profiles SET spotify_image_url=$1 WHERE artist_id=$2', [img, a.id]);
      found++;
      process.stdout.write(`\r  ✅ ${found} found · ${failed} failed · ${skipped} skipped · ${start + i + 1}/${artists.length + start}`);
    } else {
      failed++;
    }
    // Rate limit: max 5 req/s
    await new Promise(r => setTimeout(r, 250));
  }
}

const bandcamp = await pool.query(`
  SELECT da.id, da.artist_name, ap.spotify_image_url
  FROM artist_profiles ap
  JOIN discovered_artists da ON da.id = ap.artist_id
  WHERE (ap.spotify_image_url IS NULL OR ap.spotify_image_url = '' OR ap.spotify_image_url ILIKE '%bcbits%')
    AND da.artist_name IS NOT NULL
  ORDER BY ap.spotify_image_url ILIKE '%bcbits%' DESC, da.monthly_listeners DESC NULLS LAST
`);
console.log(`Found ${bandcamp.rows.length} artists needing images. Processing...`);
console.time('Done');

// Process in chunks to avoid memory issues
const CHUNK = 50;
for (let i = 0; i < bandcamp.rows.length; i += CHUNK) {
  const chunk = bandcamp.rows.slice(i, i + CHUNK);
  await processBatch(chunk, i);
  // Log progress per chunk
  console.log(`\n  Chunk ${Math.floor(i/CHUNK) + 1}/${Math.ceil(bandcamp.rows.length/CHUNK)} done`);
}

console.timeEnd('Done');
console.log(`\nFinal: ${found} updated, ${failed} not found, ${skipped} skipped`);

// Verify
const remaining = await pool.query("SELECT COUNT(*)::int as c FROM artist_profiles WHERE spotify_image_url ILIKE '%bcbits%'");
console.log(`Remaining bandcamp images: ${remaining.rows[0].c}`);
await pool.end();
