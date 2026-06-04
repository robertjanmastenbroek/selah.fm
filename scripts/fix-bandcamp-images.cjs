const {Pool}=require('pg');
const p=new Pool({connectionString:process.env.SUPABASE_DATABASE_URL+'?pgbouncer=true',ssl:{rejectUnauthorized:false},max:3});

async function fetchArtistImage(artistName) {
  const cleanName = artistName.replace(/^\[.*?\]\s*/i, '').trim();
  if (!cleanName || cleanName.length < 2) return null;
  try {
    const res = await fetch(
      `https://api.deezer.com/search/artist?q=${encodeURIComponent(cleanName)}&limit=3`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const best = data.data[0];
        return best.picture_xl || best.picture_big || best.picture_medium || null;
      }
    }
  } catch {}
  return null;
}

(async()=>{
  // Find all artists with Bandcamp images
  const artists=await p.query(`
    SELECT da.id, da.artist_name
    FROM artist_profiles ap
    JOIN discovered_artists da ON da.id=ap.artist_id
    WHERE ap.spotify_image_url ILIKE '%bcbits%'
    ORDER BY da.monthly_listeners DESC NULLS LAST
  `);
  console.log('Artists with Bandcamp images: '+artists.rows.length);

  let found=0, failed=0;
  for(const a of artists.rows){
    const img=await fetchArtistImage(a.artist_name);
    if(img){
      await p.query('UPDATE artist_profiles SET spotify_image_url=$1 WHERE artist_id=$2',[img,a.id]);
      found++;
      if(found<=5||found%100===0) console.log(`  ✅ [${found}] ${(a.artist_name||'').substring(0,40)}`);
    } else {
      failed++;
      if(failed<=3) console.log(`  ❌ ${(a.artist_name||'').substring(0,40)}`);
    }
    await new Promise(r=>setTimeout(r,200)); // 5 req/s rate limit
  }

  console.log(`\nDone: ${found} updated, ${failed} not found`);
  await p.end();
})();
