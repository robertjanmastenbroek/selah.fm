/**
 * Shared OAuth helpers for TikTok, YouTube, Instagram.
 * Handles token exchange, refresh, and user info fetching.
 */

// ── Env helpers ───────────────────────────────────────────
const ENV = {
  tiktok: {
    clientKey: process.env.TIKTOK_CLIENT_KEY || '',
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
    redirect: `https://selah.fm/api/auth/tiktok/callback`,
  },
  youtube: {
    clientId: process.env.YOUTUBE_CLIENT_ID || '',
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
    redirect: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://selah.fm'}/api/auth/youtube/callback`,
  },
  instagram: {
    clientId: process.env.INSTAGRAM_CLIENT_ID || '',
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
    redirect: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://selah.fm'}/api/auth/instagram/callback`,
  },
};

// ── Scopes ──────────────────────────────────────────────
const SCOPES = {
  tiktok: ['user.info.profile', 'user.info.stats', 'video.list'],
  youtube: ['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/userinfo.profile'],
  instagram: ['user_profile', 'user_media'],
};

// ── Generate OAuth URL ──────────────────────────────────
export function getOAuthUrl(platform: 'tiktok' | 'youtube' | 'instagram', state: string): string {
  const baseUrls: Record<string, string> = {
    tiktok: `https://www.tiktok.com/v2/auth/authorize?client_key=${ENV.tiktok.clientKey}&response_type=code&scope=${SCOPES.tiktok.join(',')}&redirect_uri=${encodeURIComponent(ENV.tiktok.redirect)}&state=${state}`,
    youtube: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${ENV.youtube.clientId}&response_type=code&scope=${encodeURIComponent(SCOPES.youtube.join(' '))}&redirect_uri=${encodeURIComponent(ENV.youtube.redirect)}&state=${state}&access_type=offline&prompt=consent`,
    instagram: `https://api.instagram.com/oauth/authorize?client_id=${ENV.instagram.clientId}&redirect_uri=${encodeURIComponent(ENV.instagram.redirect)}&scope=${SCOPES.instagram.join(',')}&response_type=code&state=${state}`,
  };
  return baseUrls[platform] || '';
}

// ── Exchange code for tokens ────────────────────────────
export async function exchangeCode(
  platform: 'tiktok' | 'youtube' | 'instagram',
  code: string
): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date; platformUserId: string; platformUsername: string; avatarUrl?: string }> {
  switch (platform) {
    case 'tiktok': return exchangeTikTok(code);
    case 'youtube': return exchangeYouTube(code);
    case 'instagram': return exchangeInstagram(code);
    default: throw new Error(`Unknown platform: ${platform}`);
  }
}

// ── TikTok token exchange ──────────────────────────────
async function exchangeTikTok(code: string) {
  const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: ENV.tiktok.clientKey,
      client_secret: ENV.tiktok.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: ENV.tiktok.redirect,
    }),
  });
  if (!res.ok) { const e = await res.text(); throw new Error(`TikTok token exchange failed: ${e.slice(0, 200)}`); }
  const data = await res.json();

  // Fetch user info
  const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=display_name,username,avatar_url', {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  const userData = await userRes.json();
  const user = userData?.data?.user || {};

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + (data.expires_in || 86400) * 1000),
    platformUserId: user.open_id || data.open_id || '',
    platformUsername: user.username || user.display_name || '',
    avatarUrl: user.avatar_url,
  };
}

// ── YouTube token exchange ──────────────────────────────
async function exchangeYouTube(code: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: ENV.youtube.clientId,
      client_secret: ENV.youtube.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: ENV.youtube.redirect,
    }),
  });
  if (!res.ok) { const e = await res.text(); throw new Error(`YouTube token exchange failed: ${e.slice(0, 200)}`); }
  const data = await res.json();

  // Fetch user info
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  const user = await userRes.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
    platformUserId: user.id,
    platformUsername: user.name || user.email || '',
    avatarUrl: user.picture,
  };
}

// ── Instagram token exchange ────────────────────────────
async function exchangeInstagram(code: string) {
  // Step 1: short-lived token
  const res = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: ENV.instagram.clientId,
      client_secret: ENV.instagram.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: ENV.instagram.redirect,
    }),
  });
  if (!res.ok) { const e = await res.text(); throw new Error(`Instagram token exchange failed: ${e.slice(0, 200)}`); }
  const data = await res.json();

  // Step 2: exchange for long-lived token (60 days)
  const longRes = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${ENV.instagram.clientSecret}&access_token=${data.access_token}`);
  const longData = await longRes.json();

  // Fetch user info
  const userRes = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,profile_picture_url&access_token=${longData.access_token || data.access_token}`);
  const user = await userRes.json();

  return {
    accessToken: longData.access_token || data.access_token,
    expiresAt: new Date(Date.now() + (longData.expires_in || 60 * 86400) * 1000),
    platformUserId: user.id || data.user_id,
    platformUsername: user.username || '',
    avatarUrl: user.profile_picture_url,
  };
}

// ── Refresh expired token ──────────────────────────────
export async function refreshToken(
  platform: 'tiktok' | 'youtube' | 'instagram',
  currentRefreshToken: string
): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }> {
  switch (platform) {
    case 'tiktok': {
      const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_key: ENV.tiktok.clientKey,
          client_secret: ENV.tiktok.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: currentRefreshToken,
        }),
      });
      const data = await res.json();
      return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt: new Date(Date.now() + (data.expires_in || 86400) * 1000) };
    }
    case 'youtube': {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: ENV.youtube.clientId,
          client_secret: ENV.youtube.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: currentRefreshToken,
        }),
      });
      const data = await res.json();
      return { accessToken: data.access_token, refreshToken: currentRefreshToken, expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000) };
    }
    case 'instagram': {
      // Instagram long-lived tokens can't be refreshed — user reconnects
      throw new Error('Instagram tokens cannot be refreshed. Reconnect your account.');
    }
    default: throw new Error(`Unknown platform: ${platform}`);
  }
}

// ── Fetch recent videos (for creator view verification) ──
export async function fetchRecentVideos(
  platform: 'tiktok' | 'youtube' | 'instagram',
  accessToken: string,
  platformUserId: string,
  since?: Date
): Promise<{ id: string; url: string; title: string; viewCount: number; postedAt: Date }[]> {
  switch (platform) {
    case 'tiktok': return fetchTikTokVideos(accessToken, platformUserId, since);
    case 'youtube': return fetchYouTubeVideos(accessToken, since);
    case 'instagram': return fetchInstagramVideos(accessToken, platformUserId, since);
    default: return [];
  }
}

async function fetchTikTokVideos(token: string, userId: string, since?: Date) {
  const res = await fetch(`https://open.tiktokapis.com/v2/video/list/?fields=id,title,create_time,view_count,embed_link`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ max_count: 20 }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const videos = data?.data?.videos || [];
  return videos
    .filter((v: any) => !since || new Date(v.create_time) >= since)
    .map((v: any) => ({
      id: v.id,
      url: `https://www.tiktok.com/@${userId}/video/${v.id}`,
      title: v.title || '',
      viewCount: parseInt(v.view_count || '0'),
      postedAt: new Date(v.create_time),
    }));
}

async function fetchYouTubeVideos(token: string, since?: Date) {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=20&order=date`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const items = data?.items || [];

  // Get view counts
  const videoIds = items.map((i: any) => i.id.videoId).join(',');
  const statsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const statsData = await statsRes.json();
  const statsMap = new Map((statsData?.items || []).map((s: any) => [s.id, s.statistics?.viewCount || '0']));

  return items
    .filter((v: any) => !since || new Date(v.snippet.publishedAt) >= since)
    .map((v: any) => ({
      id: v.id.videoId,
      url: `https://www.youtube.com/watch?v=${v.id.videoId}`,
      title: v.snippet.title || '',
      viewCount: parseInt(String(statsMap.get(v.id.videoId) || '0')),
      postedAt: new Date(v.snippet.publishedAt),
    }));
}

async function fetchInstagramVideos(token: string, userId: string, since?: Date) {
  const res = await fetch(`https://graph.instagram.com/me/media?fields=id,media_type,media_url,thumbnail_url,caption,timestamp,permalink&access_token=${token}&limit=25`);
  if (!res.ok) return [];
  const data = await res.json();
  const items = data?.data || [];

  // Get insights for view counts
  const results: any[] = [];
  for (const item of items.slice(0, 20)) {
    if (item.media_type !== 'VIDEO' && item.media_type !== 'CAROUSEL') continue;
    if (since && new Date(item.timestamp) < since) continue;
    results.push({
      id: item.id,
      url: item.permalink || '',
      title: item.caption?.slice(0, 200) || '',
      viewCount: 0, // Instagram's API doesn't expose video views via Basic Display
      postedAt: new Date(item.timestamp),
    });
  }
  return results;
}
