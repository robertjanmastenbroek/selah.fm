import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/spotify?q=Danny+Vera
 * 
 * Returns the RAW Spotify API response for debugging.
 * Shows: token status, search results, artist data.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || 'Danny Vera';

  const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

  const result: any = {
    credentials: {
      clientId: SPOTIFY_CLIENT_ID ? `${SPOTIFY_CLIENT_ID.slice(0, 8)}...` : 'NOT SET',
      secret: SPOTIFY_CLIENT_SECRET ? 'SET (hidden)' : 'NOT SET',
    },
    query: q,
  };

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    result.error = 'Spotify credentials not set in Railway env vars';
    return NextResponse.json(result, { status: 500 });
  }

  // Step 1: Get token
  try {
    const auth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${auth}` },
      body: 'grant_type=client_credentials',
    });

    const tokenData = await tokenRes.json();
    result.token = {
      status: tokenRes.status,
      hasAccessToken: !!tokenData.access_token,
      error: tokenData.error || null,
      errorDescription: tokenData.error_description || null,
    };

    if (!tokenData.access_token) {
      return NextResponse.json(result);
    }

    // Step 2: Search for artist
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=artist&limit=5`,
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );

    const searchData = await searchRes.json();
    result.searchRaw = searchData;
    result.search = {
      status: searchRes.status,
      totalResults: searchData.artists?.total || 0,
      items: (searchData.artists?.items || []).map((a: any) => ({
        name: a.name,
        id: a.id,
        followers: a.followers?.total,
        popularity: a.popularity,
        genres: a.genres?.slice(0, 3),
        image: a.images?.[0]?.url?.slice(0, 50),
      })),
    };

    // Step 3: If first result has an ID, get full artist details
    if (searchData.artists?.items?.[0]?.id) {
      const artistRes = await fetch(
        `https://api.spotify.com/v1/artists?ids=${searchData.artists.items[0].id}`,
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
      );
      const bulkData = await artistRes.json();
      result.artistDetailRaw = bulkData;
    }

    return NextResponse.json(result);
  } catch (e: any) {
    result.error = e.message;
    return NextResponse.json(result, { status: 500 });
  }
}
