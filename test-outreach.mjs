/**
 * Direct Spotify API test — no Next.js, no admin guard, no dashboard.
 * Run: railway run "node test-outreach.mjs"
 * 
 * Tests: auth → playlist fetch → artist lookup → filter logic
 */

async function main() {
  const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

  console.log('=== Spotify API Test ===\n');
  console.log('SPOTIFY_CLIENT_ID:', SPOTIFY_CLIENT_ID ? '✅ set (' + SPOTIFY_CLIENT_ID.slice(0, 10) + '...)' : '❌ MISSING');
  console.log('SPOTIFY_CLIENT_SECRET:', SPOTIFY_CLIENT_SECRET ? '✅ set' : '❌ MISSING');

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.log('\n❌ Spotify credentials not set. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in Railway.');
    process.exit(1);
  }

  // Step 1: Get token
  console.log('\n1. Authenticating...');
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.log('❌ Auth failed:', tokenRes.status, err.slice(0, 200));
    process.exit(1);
  }

  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;
  console.log('✅ Authenticated. Token expires in', tokenData.expires_in, 'seconds');

  // Step 2: Try playlist fetch
  console.log('\n2. Fetching Fresh Finds playlist...');
  const playlistRes = await fetch(
    'https://api.spotify.com/v1/playlists/37i9dQZF1DX0eerS8JbhUF/tracks?limit=5',
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!playlistRes.ok) {
    const err = await playlistRes.text();
    console.log('❌ Playlist fetch failed:', playlistRes.status, err.slice(0, 200));
    process.exit(1);
  }

  const playlistData = await playlistRes.json();
  const tracks = playlistData.items?.map((i: any) => i.track).filter(Boolean) || [];
  console.log(`✅ Got ${tracks.length} tracks from Fresh Finds`);
  for (const t of tracks.slice(0, 3)) {
    console.log(`   "${t.name}" by ${t.artists?.map((a: any) => a.name).join(', ')}`);
  }

  // Step 3: Look up first artist
  if (tracks.length > 0) {
    const firstArtist = tracks[0].artists[0];
    console.log(`\n3. Looking up artist: ${firstArtist.name} (${firstArtist.id})...`);

    const artistRes = await fetch(
      `https://api.spotify.com/v1/artists/${firstArtist.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!artistRes.ok) {
      console.log('❌ Artist lookup failed:', artistRes.status);
    } else {
      const artist = await artistRes.json();
      console.log(`✅ ${artist.name}`);
      console.log(`   Followers: ${artist.followers?.total?.toLocaleString()}`);
      console.log(`   Genres: ${artist.genres?.join(', ') || 'none'}`);
      console.log(`   Popularity: ${artist.popularity}/100`);
      console.log(`   Images: ${artist.images?.length || 0}`);

      // Step 4: Check top tracks
      console.log(`\n4. Top tracks...`);
      const topRes = await fetch(
        `https://api.spotify.com/v1/artists/${firstArtist.id}/top-tracks?market=US`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (topRes.ok) {
        const topData = await topRes.json();
        console.log(`✅ ${topData.tracks?.length || 0} top tracks`);
        for (const t of (topData.tracks || []).slice(0, 3)) {
          console.log(`   "${t.name}" — album: ${t.album?.name} (${t.album?.release_date})`);
        }
      }
    }
  }

  // Step 5: Test the discover function logic (search for tracks)
  console.log('\n5. Testing search: genre:indie year:2025');
  const searchRes = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent('genre:indie year:2025')}&type=track&limit=5`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (searchRes.ok) {
    const searchData = await searchRes.json();
    console.log(`✅ ${searchData.tracks?.items?.length || 0} tracks found`);
    for (const t of (searchData.tracks?.items || []).slice(0, 3)) {
      const artists = t.artists?.map((a: any) => a.name).join(', ');
      console.log(`   "${t.name}" by ${artists}`);
    }
  } else {
    const err = await searchRes.text();
    console.log(`❌ Search failed: ${searchRes.status} — ${err.slice(0, 100)}`);
  }

  console.log('\n=== Test complete ===');
  console.log('Spotify API is working. The issue is in how our code calls it from the admin route.');
}

main().catch(e => {
  console.error('Test crashed:', e.message);
  process.exit(1);
});
