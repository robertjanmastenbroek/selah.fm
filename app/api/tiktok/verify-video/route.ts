/**
 * POST /api/tiktok/verify-video
 * Verifies a TikTok video's view count in real-time using the creator's
 * connected TikTok access token.
 * 
 * Body: { url: string }
 * Response: { ok: boolean, viewCount: number, videoId: string, error?: string }
 */
import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

/** Extract TikTok video ID from various URL formats */
function extractVideoId(url: string): string | null {
  // https://www.tiktok.com/@user/video/123456789
  const match = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
  if (match) return match[1];
  
  // https://vm.tiktok.com/abc123/
  const short = url.match(/vm\.tiktok\.com\/([\w-]+)/);
  if (short) return short[1];
  
  // Just digits (raw ID)
  if (/^\d+$/.test(url.trim())) return url.trim();
  
  return null;
}

/** Refresh an expired TikTok token */
async function refreshAccessToken(connection: any): Promise<string> {
  try {
    const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY || '',
        client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
        grant_type: 'refresh_token',
        refresh_token: connection.refresh_token,
      }),
    });
    const data = await res.json();
    
    if (data.access_token) {
      // Update stored token
      await sql`
        UPDATE platform_connections 
        SET access_token = ${data.access_token}, 
            refresh_token = ${data.refresh_token || connection.refresh_token},
            token_expires_at = ${new Date(Date.now() + (data.expires_in || 86400) * 1000).toISOString()},
            updated_at = NOW()
        WHERE id = ${connection.id}
      `;
      return data.access_token;
    }
  } catch {}
  return connection.access_token; // fallback to current token
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'Video URL required' }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Could not extract TikTok video ID from URL' }, { status: 400 });
    }

    // Get user's connected TikTok account
    const [connection] = await sql`
      SELECT id, access_token, refresh_token, token_expires_at, platform_user_id
      FROM platform_connections
      WHERE user_id = ${user.id} AND platform = 'tiktok'
    `;

    if (!connection) {
      return NextResponse.json({ 
        error: 'No TikTok account connected. Connect TikTok first in your dashboard.',
        needsConnect: true 
      }, { status: 400 });
    }

    // Refresh token if expired
    let token = connection.access_token;
    if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
      token = await refreshAccessToken(connection);
    }

    // Call TikTok video query API
    // Using the /video/query/ endpoint which returns video data including view count
    const tiktokRes = await fetch('https://open.tiktokapis.com/v2/video/query/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filters: { video_ids: [videoId] },
        fields: ['id', 'view_count', 'create_time', 'share_url', 'embed_link'],
      }),
    });

    if (!tiktokRes.ok) {
      const errText = await tiktokRes.text();
      console.error('[TikTok verify] API error:', tiktokRes.status, errText.slice(0, 200));
      
      // Handle token issues
      if (tiktokRes.status === 401) {
        return NextResponse.json({ error: 'TikTok session expired. Reconnect your account.' }, { status: 401 });
      }
      return NextResponse.json({ error: `TikTok API error: ${tiktokRes.status}` }, { status: 502 });
    }

    const data = await tiktokRes.json();
    const video = data?.data?.videos?.[0];

    if (!video) {
      return NextResponse.json({ error: 'Video not found or not accessible' }, { status: 404 });
    }

    const viewCount = parseInt(video.view_count || '0');
    
    return NextResponse.json({
      ok: true,
      viewCount,
      videoId: video.id,
      url: video.share_url || url,
      verified: true,
    });

  } catch (e: any) {
    console.error('[TikTok verify] Error:', e.message);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
