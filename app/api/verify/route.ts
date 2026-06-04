import { NextResponse } from 'next/server';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function extractTikTokId(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    /vm\.tiktok\.com\/(\w+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { url, platform } = await request.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    // ─── YouTube — public API, no OAuth needed ──────────────────────
    if (platform === 'youtube' || !platform) {
      const videoId = extractYouTubeId(url);
      if (!videoId) {
        return NextResponse.json({ platform: 'youtube', views: 0, note: 'Could not extract video ID', verified: false });
      }

      if (YOUTUBE_API_KEY) {
        try {
          const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
          const res = await fetch(apiUrl);
          const data = await res.json();
          
          if (data.items?.length > 0) {
            const views = parseInt(data.items[0].statistics?.viewCount || '0');
            return NextResponse.json({
              platform: 'youtube', videoId, views,
              title: data.items[0].snippet?.title || '',
              verified: true, autoVerified: true,
            });
          }
          return NextResponse.json({ platform: 'youtube', videoId, views: 0, note: 'Video not found', verified: false });
        } catch {
          return NextResponse.json({ platform: 'youtube', videoId, views: 0, note: 'API error — will retry', verified: false });
        }
      }

      return NextResponse.json({
        platform: 'youtube', videoId, views: 0,
        note: 'Set YOUTUBE_API_KEY in Railway for automatic verification',
        verified: false,
      });
    }

    // ─── TikTok — public oEmbed attempt ─────────────────────────────
    if (platform === 'tiktok') {
      const ttId = extractTikTokId(url);
      if (ttId) {
        try {
          // TikTok oEmbed — public, returns some metadata
          const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
          const res = await fetch(oembedUrl, { headers: { 'User-Agent': 'Selah.fm/1.0' } });
          if (res.ok) {
            const data = await res.json();
            return NextResponse.json({
              platform: 'tiktok', videoId: ttId,
              views: 0, // oEmbed doesn't return view count
              title: data.title || '',
              author: data.author_name || '',
              note: 'TikTok view count will be verified manually. Your submission is queued.',
              verified: false, pendingVerification: true,
            });
          }
        } catch (e: any) { console.error('Unhandled error in api/verify/route.ts:', e); }
      }
      return NextResponse.json({
        platform: 'tiktok', views: 0,
        note: 'TikTok view count will be verified during review. Your submission is queued.',
        verified: false, pendingVerification: true,
      });
    }

    // ─── Instagram — manual verification ────────────────────────────
    return NextResponse.json({
      platform, views: 0,
      note: 'Instagram view count will be verified during review.',
      verified: false, pendingVerification: true,
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
