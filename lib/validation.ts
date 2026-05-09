/**
 * Selah.fm — Input Validation Utilities
 * ======================================
 * Shared validation functions for API routes.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/.+/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateEmail(email: unknown): email is string {
  return typeof email === 'string' && EMAIL_REGEX.test(email) && email.length <= 254;
}

export function validatePassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= 6 && password.length <= 128;
}

export function validateName(name: unknown): name is string {
  return typeof name === 'string' && name.trim().length >= 1 && name.length <= 100;
}

export function validateUrl(url: unknown): url is string {
  return typeof url === 'string' && URL_REGEX.test(url) && url.length <= 2048;
}

export function validateUuid(id: unknown): id is string {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

export function validatePositiveNumber(n: unknown, max?: number): n is number {
  if (typeof n !== 'number' || isNaN(n) || n <= 0) return false;
  if (max !== undefined && n > max) return false;
  return true;
}

export function validatePlatform(p: unknown): p is 'tiktok' | 'instagram' | 'youtube' {
  return p === 'tiktok' || p === 'instagram' || p === 'youtube';
}

export function validateUserType(t: unknown): t is 'artist' | 'creator' {
  return t === 'artist' || t === 'creator';
}

/**
 * Sanitize a string for safe display — strip HTML tags.
 */
export function sanitizeText(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Validate and sanitize a create campaign request body.
 */
export function validateCampaignInput(body: any): {
  valid: boolean;
  errors: string[];
  sanitized?: {
    trackTitle: string;
    trackUrl: string;
    cpmRate: number;
    budget: number;
    maxPayout: number;
    requirements?: string;
    driveUrl?: string;
    hashtags?: string;
    coverArtUrl?: string;
  };
} {
  const errors: string[] = [];

  if (!body.trackTitle || typeof body.trackTitle !== 'string' || body.trackTitle.trim().length === 0) {
    errors.push('trackTitle is required');
  }
  if (!body.trackUrl || !validateUrl(body.trackUrl)) {
    errors.push('trackUrl must be a valid URL');
  }
  if (!validatePositiveNumber(body.cpmRate, 100)) {
    errors.push('cpmRate must be a positive number (max $100)');
  }
  if (!validatePositiveNumber(body.budget, 100000)) {
    errors.push('budget must be a positive number (max $100,000)');
  }
  if (!validatePositiveNumber(body.maxPayout, body.budget || 100000)) {
    errors.push('maxPayout must be a positive number within budget');
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    errors: [],
    sanitized: {
      trackTitle: sanitizeText(body.trackTitle).slice(0, 200),
      trackUrl: body.trackUrl.slice(0, 2048),
      cpmRate: body.cpmRate,
      budget: body.budget,
      maxPayout: body.maxPayout,
      requirements: body.requirements ? sanitizeText(body.requirements).slice(0, 2000) : undefined,
      driveUrl: body.driveUrl ? body.driveUrl.slice(0, 2048) : undefined,
      hashtags: body.hashtags ? sanitizeText(body.hashtags).slice(0, 500) : undefined,
      coverArtUrl: body.coverArtUrl ? body.coverArtUrl.slice(0, 2048) : undefined,
    },
  };
}
