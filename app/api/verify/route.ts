import { NextResponse } from 'next/server';

// YouTube Data API v3 — no OAuth needed for public video stats
// Get key: https://console.cloud.google.com/apis/credentials
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,  // raw video ID
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

    // YouTube verification
    if (platform === 'youtube' || !platform) {
      const videoId = extractYouTubeId(url);
      if (!videoId) {
        return NextResponse.json({ 
          platform: 'youtube',
          views: 0,
          note: 'Could not extract YouTube video ID. For TikTok/Instagram, paste the URL and we will verify manually.',
        });
      }

      if (YOUTUBE_API_KEY) {
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        
        const views = parseInt(data.items?.[0]?.statistics?.viewCount || '0');
        return NextResponse.json({
          platform: 'youtube',
          videoId,
          views,
          title: data.items?.[0]?.snippet?.title || '',
          verified: true,
        });
      }

      // Fallback: return mock for testing
      return NextResponse.json({
        platform: 'youtube',
        videoId,
        views: 'YouTube API key not configured',
        note: 'Set YOUTUBE_API_KEY in Railway to enable automatic verification',
        verified: false,
      });
    }

    // TikTok / Instagram — manual verification for now
    return NextResponse.json({
      platform,
      views: 'pending',
      note: `${platform} verification will be available soon. Your submission is queued for manual review.`,
      verified: false,
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
