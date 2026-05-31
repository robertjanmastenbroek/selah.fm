import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tools/playlist-analyze
 * Analyzes a Spotify playlist for bot/fake stream indicators.
 */
export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 });

    // Extract playlist ID
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (!match) return NextResponse.json({ error: 'Invalid Spotify playlist URL' }, { status: 400 });

    const playlistId = match[1];

    // Strategy 1: Spotify oEmbed API (returns follower count for public playlists)
    let followers = 0;
    let trackCount = 0;
    let title = '';

    try {
      const oembedRes = await fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/playlist/${playlistId}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (oembedRes.ok) {
        const oembed = await oembedRes.json();
        title = oembed.title || '';
        // oEmbed doesn't include follower/track count — try page scraping
      }
    } catch {}

    // Strategy 2: Scrape the public playlist page for embedded JSON-LD data
    const pageRes = await fetch(`https://open.spotify.com/playlist/${playlistId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SelahFM/1.0)' },
      signal: AbortSignal.timeout(10000),
    });

    if (!pageRes.ok) {
      return NextResponse.json({ error: 'Could not access this playlist. It may be private.' }, { status: 404 });
    }

    const html = await pageRes.text();

    // Extract from JSON-LD structured data
    const ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([^<]+)<\/script>/);
    if (ldMatch) {
      try {
        const ld = JSON.parse(ldMatch[1]);
        if (ld.numTracks) trackCount = ld.numTracks;
        if (ld.numFollowers) followers = ld.numFollowers;
      } catch {}
    }

    // Fallback: look for follower count in page text
    if (followers === 0) {
      const followerMatch = html.match(/([\d,]+)\s*(?:likes|followers|saves)/i);
      followers = followerMatch ? parseInt(followerMatch[1].replace(/,/g, '')) : 0;
    }

    // Fallback: look for track count
    if (trackCount === 0) {
      const trackMatches = html.match(/"numTracks":(\d+)/) || html.match(/(\d+)\s*(?:songs|tracks)/i);
      if (trackMatches) trackCount = parseInt(trackMatches[1]);
    }

    if (!title) {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      title = titleMatch ? titleMatch[1].replace(' - playlist by', '').trim() : 'Unknown Playlist';
    }

    // Bot detection heuristics
    const flags: string[] = [];
    let botScore = 0;

    // Suspicious follower-to-track ratio (bots often have high followers, few tracks)
    if (followers > 1000 && trackCount > 0 && followers / trackCount > 500) {
      flags.push(`Very high follower-to-track ratio (${Math.round(followers / trackCount)}:1). Organic playlists rarely exceed 100:1.`);
      botScore += 30;
    }

    // Check for playlist name red flags
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1] : '';
    if (/bot|fake|stream|buy|follow|click/i.test(title)) {
      flags.push('Playlist name contains suspicious keywords commonly associated with stream manipulation.');
      botScore += 20;
    }

    // Check if description mentions guaranteed streams/placement
    if (/guaranteed|instant|24.?hour|buy|purchase/i.test(html)) {
      flags.push('Description mentions guaranteed or instant results — common in paid bot services.');
      botScore += 25;
    }

    // Low track count with high followers = likely bot aggregator
    if (followers > 5000 && trackCount < 30) {
      flags.push('High follower count with very few tracks — typical of bot-farmed playlists.');
      botScore += 15;
    }

    // No flags = clean
    if (flags.length === 0) {
      flags.push('No red flags detected. This playlist appears organic.');
    }

    const risk = botScore >= 50 ? 'high' : botScore >= 20 ? 'medium' : 'low';

    return NextResponse.json({
      playlistId,
      title,
      followers,
      trackCount,
      botScore: Math.min(botScore, 100),
      risk,
      flags,
      analyzedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Analysis failed. The playlist may be private or unavailable.' }, { status: 500 });
  }
}
