/**
 * URL Normalization — prevents submission gaming via URL variants.
 * 
 * Handles:
 * - Short URLs → canonical (vm.tiktok.com → tiktok.com, youtu.be → youtube.com)
 * - Mobile variants (m.youtube.com → youtube.com)
 * - Tracking params stripped (utm_*, si, fbclid, ref, _r, _t, etc.)
 * - Trailing slashes, www prefix normalization
 * - Extracts canonical video ID for dedup
 */

// ── Canonical URL normalization ─────────────────────────────────

const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'si', 'fbclid', 'gclid', 'ref', 'source', '_r', '_t', 'feature',
  'igsh', 'igshid', 'utm_source', 'utm_medium',
];

export function normalizeUrl(url: string): string {
  if (!url) return '';
  
  let u = url.trim();
  
  // Ensure https
  if (u.startsWith('http://')) u = u.replace('http://', 'https://');
  if (!u.startsWith('https://')) u = 'https://' + u;
  
  try {
    const parsed = new URL(u);
    
    // ── Platform-specific short URL resolution ──
    // TikTok: vm.tiktok.com → www.tiktok.com (keep path)
    if (parsed.hostname === 'vm.tiktok.com') {
      parsed.hostname = 'www.tiktok.com';
    }
    // TikTok: vt.tiktok.com → www.tiktok.com
    if (parsed.hostname === 'vt.tiktok.com') {
      parsed.hostname = 'www.tiktok.com';
    }
    // TikTok: m.tiktok.com → www.tiktok.com
    if (parsed.hostname === 'm.tiktok.com') {
      parsed.hostname = 'www.tiktok.com';
    }
    
    // YouTube: youtu.be → www.youtube.com
    if (parsed.hostname === 'youtu.be') {
      const videoId = parsed.pathname.replace(/^\//, '');
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    // YouTube: m.youtube.com → www.youtube.com
    if (parsed.hostname === 'm.youtube.com') {
      parsed.hostname = 'www.youtube.com';
    }
    // YouTube shorts: youtube.com/shorts/VIDEOID → youtube.com/watch?v=VIDEOID
    const shortsMatch = parsed.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) {
      return `https://www.youtube.com/watch?v=${shortsMatch[1]}`;
    }
    
    // Instagram: remove /?utm_... and /?igsh=... params
    if (parsed.hostname.includes('instagram.com')) {
      // Strip reel tracking: /reel/CODE/?utm... → /reel/CODE/
      parsed.search = '';
      parsed.hash = '';
    }
    
    // ── Universal normalization ──
    // Remove www. prefix
    if (parsed.hostname.startsWith('www.')) {
      parsed.hostname = parsed.hostname.replace('www.', '');
    }
    
    // Strip all tracking params
    for (const param of TRACKING_PARAMS) {
      parsed.searchParams.delete(param);
    }
    
    // Remove trailing slash
    let pathname = parsed.pathname.replace(/\/$/, '');
    parsed.pathname = pathname;
    
    // Remove hash
    parsed.hash = '';
    
    return parsed.toString();
  } catch {
    return u;
  }
}

// ── Video ID extraction for dedup ───────────────────────────────

export interface VideoId {
  platform: 'tiktok' | 'youtube' | 'instagram' | 'facebook' | 'unknown';
  id: string;
}

/**
 * Extract a platform-specific unique video ID.
 * This is the strongest dedup — two different URLs pointing to the same
 * video will have the same ID even if URLs differ.
 */
export function extractVideoId(url: string, platform?: string): VideoId {
  const u = url.trim();
  
  // TikTok: /@user/video/123456789 or /video/123456789
  const ttMatch = u.match(/tiktok\.com\/@?[\w.-]+\/video\/(\d+)/i);
  if (ttMatch) return { platform: 'tiktok', id: ttMatch[1] };
  
  // YouTube: watch?v=VIDEOID or /shorts/VIDEOID or youtu.be/VIDEOID
  const ytMatch = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch) return { platform: 'youtube', id: ytMatch[1] };
  
  // Instagram: /reel/CODE/ or /p/CODE/
  const igMatch = u.match(/instagram\.com\/(?:reel|p|tv)\/([a-zA-Z0-9_-]+)/i);
  if (igMatch) return { platform: 'instagram', id: igMatch[1] };
  
  // Facebook: /reel/ID or /watch/?v=ID or /share/v/ID
  const fbMatch = u.match(/facebook\.com\/(?:reel\/(\d+)|watch\/?\?v=(\d+)|share\/v\/([a-zA-Z0-9]+))/i);
  if (fbMatch) {
    const fbId = fbMatch[1] || fbMatch[2] || fbMatch[3];
    return { platform: 'facebook', id: fbId };
  }
  
  // Fallback: hash the normalized URL as the ID
  return { 
    platform: platform as any || 'unknown', 
    id: normalizeUrl(u)
  };
}

/**
 * Check if two URLs point to the same video.
 * Uses both normalization + video ID extraction for robustness.
 */
export function isSameVideo(url1: string, url2: string, platform?: string): boolean {
  const id1 = extractVideoId(url1, platform);
  const id2 = extractVideoId(url2, platform);
  
  if (id1.platform === id2.platform && id1.id === id2.id) {
    return true;
  }
  
  return normalizeUrl(url1) === normalizeUrl(url2);
}
