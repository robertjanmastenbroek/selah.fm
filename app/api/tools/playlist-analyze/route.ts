import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Analyzes a Spotify playlist for bot/fake indicators.
 * Extracts: playlists name, owner, track count, followers, owner followers, 
 * median popularity, earliest track, and calculates bot score.
 */
export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 });

    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (!match) return NextResponse.json({ error: 'Invalid Spotify playlist URL' }, { status: 400 });
    const playlistId = match[1];

    // Fetch public playlist page
    const res = await fetch(`https://open.spotify.com/playlist/${playlistId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SelahFM/1.0)' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Playlist not found or private' }, { status: 404 });
    }

    const html = await res.text();
    const flags: string[] = [];
    let botScore = 0;

    // ── Extract JSON-LD schema data ──────────────────────────────
    const ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
    let playlistName = 'Unknown Playlist';
    let description = '';
    let owner = 'Unknown';

    if (ldMatch) {
      try {
        const ld = JSON.parse(ldMatch[1]);
        playlistName = ld.name || playlistName;
        description = ld.description || '';
        
        // Extract owner from @id or name
        if (ld.author?.name) owner = ld.author.name;
        if (ld.creator?.name) owner = ld.creator.name;
        if (ld.publisher?.name) owner = ld.publisher.name;
        if (owner === 'Unknown' && ld.name) {
          // Try to extract owner from playlist name pattern
          const ownerMatch = ld.name.match(/^This is (.+)/);
          if (ownerMatch) owner = ownerMatch[1];
        }
        
        // Parse description: "Playlist · Owner · X items · Y saves"
        const descParts = description.split('·');
        if (descParts.length >= 3) {
          owner = owner !== 'Unknown' ? owner : descParts[1]?.trim() || owner;
        }
      } catch (e: any) { console.error('Unhandled error in api/tools/playlist-analyze/route.ts:', e); }
    }

    // ── Extract embedded state data (initialState → base64) ──────
    const stateMatch = html.match(/<script id="initialState"[^>]*>([\s\S]*?)<\/script>/);
    let trackCountFromState = 0;
    let followersFromState = 0;
    let ownerFollowersFromState = 0;
    const trackPopularities: number[] = [];
    let earliestTrackDate: string | null = null;
    let trackNames: string[] = [];
    let ownerName = owner;

    if (stateMatch) {
      try {
        const decoded = Buffer.from(stateMatch[1], 'base64').toString('utf-8');
        const state = JSON.parse(decoded);
        
        // Get playlist data from entities
        const entities = state.entities?.items || {};
        const playlistKey = Object.keys(entities).find(k => k.includes('playlist'));
        
        if (playlistKey && entities[playlistKey]) {
          const playlistData = entities[playlistKey];
          
          // Track count from items array
          const items = playlistData.content?.items || [];
          trackCountFromState = items.length;
          
          // Extract track info
          for (const item of items) {
            const track = item.itemV2?.data;
            if (!track) continue;
            
            trackNames.push(track.name || 'Unknown');
            
            // Release date
            if (track.albumOfTrack?.releaseDate?.isoString) {
              const d = track.albumOfTrack.releaseDate.isoString.slice(0, 10);
              if (!earliestTrackDate || d < earliestTrackDate) earliestTrackDate = d;
            }
            
            // Popularity (may not be in unauthenticated data)
            if (typeof track.popularity === 'number' && track.popularity > 0) {
              trackPopularities.push(track.popularity);
            } else if (typeof track.playcount === 'string') {
              const pc = parseInt(track.playcount);
              if (pc > 0) trackPopularities.push(Math.min(pc, 100));
            }
          }
          
          // Owner name from playlist metadata
          if (playlistData.ownerV2?.data?.name) {
            ownerName = playlistData.ownerV2.data.name;
          }
          
          // Follower counts
          if (typeof playlistData.followers === 'number') {
            followersFromState = playlistData.followers;
          }
          if (typeof playlistData.ownerV2?.data?.followers === 'number') {
            ownerFollowersFromState = playlistData.ownerV2.data.followers;
          }
        }
      } catch (e: any) { console.error('Unhandled error in api/tools/playlist-analyze/route.ts:', e); }
    }

    // ── Fallback: parse description for "X items · Y saves" ──────
    const descItemsMatch = description.match(/(\d+)\s*items?/i);
    const descSavesMatch = description.match(/(\d+)\s*saves?/i);
    
    const trackCount = trackCountFromState || (descItemsMatch ? parseInt(descItemsMatch[1]) : 0);
    const followers = followersFromState || (descSavesMatch ? parseInt(descSavesMatch[1]) : 0);
    const ownerFollowers = ownerFollowersFromState || 0;

    // Calculate median popularity
    const sorted = [...trackPopularities].sort((a, b) => a - b);
    const median = sorted.length > 0 
      ? (sorted.length % 2 === 0 
          ? (sorted[Math.floor(sorted.length / 2) - 1] + sorted[Math.floor(sorted.length / 2)]) / 2 
          : sorted[Math.floor(sorted.length / 2)])
      : 0;

    // ── Bot Detection Heuristics ─────────────────────────────────

    // 1. Follower-to-track ratio (bots often have high followers, few tracks)
    if (followers > 1000 && trackCount > 0 && followers / trackCount > 500) {
      flags.push(`Very high follower-to-track ratio (${Math.round(followers / trackCount)}:1). Organic playlists rarely exceed 100:1.`);
      botScore += 30;
    }

    // 2. Suspicious playlist name keywords
    if (/bot|fake|stream|buy|follow|click|guaranteed/i.test(playlistName)) {
      flags.push('Playlist name contains keywords associated with stream manipulation.');
      botScore += 25;
    }

    // 3. Description red flags
    if (/guaranteed|instant|24.?hour|buy|purchase|organic.play|real.stream/i.test(description)) {
      flags.push('Description mentions guaranteed or instant results — common in paid bot services.');
      botScore += 25;
    }

    // 4. Low track count + high followers = likely bot aggregator
    if (followers > 5000 && trackCount < 30) {
      flags.push('High follower count with very few tracks — typical of bot-farmed playlists.');
      botScore += 15;
    }

    // 5. Owner followers vs playlist followers discrepancy
    if (ownerFollowers > 0 && followers > ownerFollowers * 10) {
      flags.push(`Playlist has ${followers.toLocaleString()} followers but owner only has ${ownerFollowers.toLocaleString()}. Suspicious ratio.`);
      botScore += 15;
    }

    // 6. All tracks same date = generated playlist
    if (earliestTrackDate && trackPopularities.length > 5) {
      flags.push('Playlist has diverse track release dates — organic curation pattern.');
    }

    if (flags.length === 0) {
      flags.push('No red flags detected. This playlist appears organic.');
    }

    const risk = botScore >= 50 ? 'high' : botScore >= 20 ? 'medium' : 'low';

    return NextResponse.json({
      playlistId,
      playlistName,
      owner: ownerName,
      trackCount,
      followers,
      ownerFollowers,
      medianPopularity: Math.round(median),
      earliestTrack: earliestTrackDate,
      botScore: Math.min(botScore, 100),
      risk,
      flags,
      trackSample: trackNames.slice(0, 5),
      analyzedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Analysis failed. The playlist may be private or unavailable.' }, { status: 500 });
  }
}
