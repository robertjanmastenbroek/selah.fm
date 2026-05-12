import { NextResponse } from 'next/server';

/**
 * Direct Spotify API diagnostic endpoint.
 * GET /api/admin/outreach/test — no admin check, shows raw Spotify results.
 */

export async function GET() {
  const results: any = { steps: [] };

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({
      error: 'Spotify credentials not set',
      SPOTIFY_CLIENT_ID: clientId ? 'set' : 'MISSING',
      SPOTIFY_CLIENT_SECRET: clientSecret ? 'set' : 'MISSING',
    });
  }

  try {
    // Step 1: Auth
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + btoa(`${clientId}:${clientSecret}`),
      },
      body: 'grant_type=client_credentials',
    });
    
    if (!tokenRes.ok) {
      results.steps.push({ step: 'auth', ok: false, status: tokenRes.status });
      return NextResponse.json(results);
    }
    
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;
    results.steps.push({ step: 'auth', ok: true, expires_in: tokenData.expires_in });

    // Step 2: Playlist
    const playlistRes = await fetch(
      'https://api.spotify.com/v1/playlists/37i9dQZF1DX0eerS8JbhUF/tracks?limit=5',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (playlistRes.ok) {
      const data = await playlistRes.json();
      const tracks = (data.items || []).map((i: any) => ({
        name: i.track?.name,
        artists: i.track?.artists?.map((a: any) => a.name),
        id: i.track?.id,
      }));
      results.steps.push({ step: 'playlist', ok: true, track_count: tracks.length, tracks: tracks.slice(0, 3) });
    } else {
      results.steps.push({ step: 'playlist', ok: false, status: playlistRes.status });
    }

    // Step 3: Search test (genre)
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent('genre:indie year:2025')}&type=track&limit=5`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (searchRes.ok) {
      const data = await searchRes.json();
      const tracks = (data.tracks?.items || []).map((t: any) => ({
        name: t.name,
        artists: t.artists?.map((a: any) => a.name),
        album: t.album?.name,
      }));
      results.steps.push({ step: 'search_genre_indie_2025', ok: true, track_count: tracks.length, tracks: tracks.slice(0, 3) });
    } else {
      const err = await searchRes.text();
      results.steps.push({ step: 'search_genre_indie_2025', ok: false, status: searchRes.status, error: err.slice(0, 200) });
    }

    // Step 4: Search without genre (just year)
    const search2Res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent('year:2025')}&type=track&limit=5`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (search2Res.ok) {
      const data = await search2Res.json();
      const tracks = (data.tracks?.items || []).map((t: any) => ({
        name: t.name,
        artists: t.artists?.map((a: any) => a.name),
      }));
      results.steps.push({ step: 'search_year_2025', ok: true, track_count: tracks.length, tracks: tracks.slice(0, 3) });
    } else {
      results.steps.push({ step: 'search_year_2025', ok: false, status: search2Res.status });
    }

    return NextResponse.json({ success: true, results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, results });
  }
}
