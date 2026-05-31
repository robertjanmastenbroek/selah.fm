/**
 * URL normalization for dedup — strips tracking params, resolves short URLs,
 * normalizes mobile variants, extracts video IDs for cross-URL dedup.
 */

export function normalizeUrl(url: string): string {
  if (!url) return url;
  let u = url.trim();
  
  // Remove trailing colon (copy-paste artifact)
  u = u.replace(/:+$/, '');
  
  // Convert protocol-relative
  if (u.startsWith('//')) u = 'https:' + u;
  
  // Ensure https
  u = u.replace(/^http:\/\//, 'https://');
  
  try {
    const parsed = new URL(u);
    
    // Remove tracking params
    const stripParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      'si', 'fbclid', 'gclid', '_r', '_t', 'igsh', 'igshid', 'ref', 'source', 'feature', 'ab_channel'];
    for (const p of stripParams) parsed.searchParams.delete(p);
    
    // Normalize host
    parsed.host = parsed.host
      .replace(/^www\./, '')
      .replace(/^m\./, '')
      .replace(/^mobile\./, '');
    
    // Normalize YouTube
    if (parsed.host === 'youtube.com' || parsed.host === 'youtu.be') {
      parsed.host = 'youtube.com';
      if (parsed.pathname === '/shorts/' + parsed.pathname.slice(8)) {
        // Already a shorts URL
      }
      const v = parsed.searchParams.get('v');
      if (v) {
        parsed.search = '';
        parsed.pathname = '/watch';
        parsed.searchParams.set('v', v);
      }
    }
    
    // Normalize TikTok
    if (parsed.host === 'tiktok.com' || parsed.host === 'vm.tiktok.com') {
      parsed.host = 'tiktok.com';
    }
    
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return u;
  }
}

/**
 * Extract unique video identifier for cross-URL dedup.
 * Returns { platform, id } where id is the unique video identifier.
 */
export function extractVideoId(url: string, platform?: string): { platform: string; id: string } {
  const u = normalizeUrl(url);
  
  // YouTube: extract video ID from v= param
  const ytMatch = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { platform: 'youtube', id: ytMatch[1] };
  
  // TikTok: extract video ID from path (long numeric ID)
  const ttMatch = u.match(/tiktok\.com\/@[^\/]+\/video\/(\d+)/);
  if (ttMatch) return { platform: 'tiktok', id: ttMatch[1] };
  
  // TikTok short link — can't extract ID from URL alone, use normalized URL
  if (u.includes('tiktok.com')) {
    // Extract whatever unique part we can
    const shortMatch = u.match(/tiktok\.com\/([a-zA-Z0-9]+)/);
    if (shortMatch) return { platform: 'tiktok', id: shortMatch[1] };
  }
  
  // Instagram: extract post ID
  const igMatch = u.match(/instagram\.com\/(?:reel|p|tv)\/([a-zA-Z0-9_-]+)/);
  if (igMatch) return { platform: 'instagram', id: igMatch[1] };
  
  return { platform: 'unknown', id: u };
}

/**
 * Check if two URLs point to the same video.
 */
export function isSameVideo(url1: string, url2: string, platform1?: string, platform2?: string): boolean {
  const v1 = extractVideoId(url1, platform1);
  const v2 = extractVideoId(url2, platform2);
  
  if (v1.platform !== 'unknown' && v2.platform !== 'unknown' && v1.platform === v2.platform) {
    return v1.id === v2.id;
  }
  
  return normalizeUrl(url1) === normalizeUrl(url2);
}
