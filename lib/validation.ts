/**
 * URL validation for video submissions.
 * Only accepts links from approved content platforms.
 */

const ALLOWLIST: { pattern: RegExp; platform: string }[] = [
  // TikTok
  { pattern: /^https?:\/\/(www\.)?tiktok\.com\/.+/i, platform: 'tiktok' },
  { pattern: /^https?:\/\/(vm|vt|m)\.tiktok\.com\/.+/i, platform: 'tiktok' },
  // Instagram
  { pattern: /^https?:\/\/(www\.)?instagram\.com\/(reel|p|tv|share)\/.+/i, platform: 'instagram' },
  { pattern: /^https?:\/\/(www\.)?instagram\.com\/.+/i, platform: 'instagram' },
  // YouTube
  { pattern: /^https?:\/\/(www\.)?youtube\.com\/watch\?.+/i, platform: 'youtube' },
  { pattern: /^https?:\/\/(www\.)?youtube\.com\/shorts\/.+/i, platform: 'youtube' },
  { pattern: /^https?:\/\/(www\.)?youtube\.com\/.+/i, platform: 'youtube' },
  { pattern: /^https?:\/\/(youtu\.be|m\.youtube\.com)\/.+/i, platform: 'youtube' },
  // Facebook
  { pattern: /^https?:\/\/(www\.)?facebook\.com\/(reel|share|watch|video)\/.+/i, platform: 'facebook' },
  { pattern: /^https?:\/\/(www\.)?facebook\.com\/.+/i, platform: 'facebook' },
  { pattern: /^https?:\/\/(fb\.watch|fb\.com)\/.+/i, platform: 'facebook' },
];

export function isValidSubmissionUrl(url: string): { valid: false; error: string } | { valid: true; platform: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const trimmed = url.trim();

  // Basic URL structure check
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { valid: false, error: 'URL must start with https://' };
  }

  if (trimmed.length > 2048) {
    return { valid: false, error: 'URL is too long' };
  }

  if (trimmed.length < 15) {
    return { valid: false, error: 'URL is too short to be valid' };
  }

  // Check against allowlist
  for (const { pattern, platform } of ALLOWLIST) {
    if (pattern.test(trimmed)) {
      return { valid: true, platform };
    }
  }

  return {
    valid: false,
    error: 'Only links from TikTok, Instagram Reels, YouTube Shorts, and Facebook are accepted. Please paste a direct link to your video.',
  };
}

// ── Existing validation helpers ──────────────────────────────

export function sanitizeInput(input: string, maxLength: number = 500): string {
  return input.trim().slice(0, maxLength).replace(/[<>]/g, '');
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

/**
 * Validate campaign input for creation.
 */
export function validateCampaignInput(body: any): { valid: false; errors: string[] } | { valid: true; sanitized: any } {
  const errors: string[] = [];

  if (!body.trackTitle || typeof body.trackTitle !== 'string' || body.trackTitle.trim().length === 0) {
    errors.push('trackTitle is required');
  }
  if (!body.trackUrl || !isValidUrl(body.trackUrl)) {
    errors.push('trackUrl must be a valid URL');
  }
  const cpmRate = parseFloat(body.cpmRate);
  if (isNaN(cpmRate) || cpmRate <= 0 || cpmRate > 100) {
    errors.push('cpmRate must be a positive number (max $100)');
  }
  const budget = parseInt(body.budget);
  if (isNaN(budget) || budget <= 0 || budget > 100000) {
    errors.push('budget must be a positive number (max $100,000)');
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    sanitized: {
      trackTitle: sanitizeInput(body.trackTitle, 200),
      trackUrl: body.trackUrl.slice(0, 2048),
      cpmRate,
      budget,
      maxPayout: parseInt(body.maxPayout) || budget,
      requirements: body.requirements ? sanitizeInput(body.requirements, 2000) : undefined,
      driveUrl: body.driveUrl || undefined,
      hashtags: body.hashtags ? sanitizeInput(body.hashtags, 500) : undefined,
      coverArtUrl: body.coverArtUrl || undefined,
      requiredHashtags: body.requiredHashtags || undefined,
      requireFtc: !!body.requireFtc,
      minVideoLength: body.minVideoLength ? parseInt(body.minVideoLength) : null,
      captionRequirements: body.captionRequirements || undefined,
      platforms: body.platforms || undefined,
    },
  };
}
