import { describe, it, expect } from 'vitest';
import {
  isValidSubmissionUrl,
  sanitizeInput,
  isValidEmail,
  isValidUrl,
  validateCampaignInput,
} from '../validation';

// ── isValidSubmissionUrl ────────────────────────────────────
describe('isValidSubmissionUrl', () => {
  describe('TikTok URLs', () => {
    it('accepts www.tiktok.com links', () => {
      const result = isValidSubmissionUrl('https://www.tiktok.com/@user/video/123456');
      expect(result).toEqual({ valid: true, platform: 'tiktok' });
    });

    it('accepts vm.tiktok.com short links', () => {
      const result = isValidSubmissionUrl('https://vm.tiktok.com/abc123/');
      expect(result).toEqual({ valid: true, platform: 'tiktok' });
    });

    it('accepts m.tiktok.com links', () => {
      const result = isValidSubmissionUrl('https://m.tiktok.com/v/123456');
      expect(result).toEqual({ valid: true, platform: 'tiktok' });
    });
  });

  describe('Instagram URLs', () => {
    it('accepts instagram.com/reel links', () => {
      const result = isValidSubmissionUrl('https://www.instagram.com/reel/abc123/');
      expect(result).toEqual({ valid: true, platform: 'instagram' });
    });

    it('accepts instagram.com/p links', () => {
      const result = isValidSubmissionUrl('https://www.instagram.com/p/abc123/');
      expect(result).toEqual({ valid: true, platform: 'instagram' });
    });
  });

  describe('YouTube URLs', () => {
    it('accepts youtube.com/watch links', () => {
      const result = isValidSubmissionUrl('https://www.youtube.com/watch?v=abc123');
      expect(result).toEqual({ valid: true, platform: 'youtube' });
    });

    it('accepts youtu.be short links', () => {
      const result = isValidSubmissionUrl('https://youtu.be/abc123');
      expect(result).toEqual({ valid: true, platform: 'youtube' });
    });

    it('accepts youtube.com/shorts links', () => {
      const result = isValidSubmissionUrl('https://www.youtube.com/shorts/abc123');
      expect(result).toEqual({ valid: true, platform: 'youtube' });
    });
  });

  describe('Facebook URLs', () => {
    it('accepts facebook.com/reel links', () => {
      const result = isValidSubmissionUrl('https://www.facebook.com/reel/abc123');
      expect(result).toEqual({ valid: true, platform: 'facebook' });
    });

    it('accepts fb.watch links', () => {
      const result = isValidSubmissionUrl('https://fb.watch/abc123');
      expect(result).toEqual({ valid: true, platform: 'facebook' });
    });
  });

  describe('rejection cases', () => {
    it('rejects non-https URLs', () => {
      const result = isValidSubmissionUrl('http://www.tiktok.com/@user/video/123');
      expect(result.valid).toBe(false);
    });

    it('rejects empty string', () => {
      const result = isValidSubmissionUrl('');
      expect(result.valid).toBe(false);
    });

    it('rejects non-string input', () => {
      const result = isValidSubmissionUrl(123 as any);
      expect(result.valid).toBe(false);
    });

    it('rejects URLs that are too short', () => {
      const result = isValidSubmissionUrl('https://a.co');
      expect(result.valid).toBe(false);
    });

    it('rejects URLs that are too long', () => {
      const longUrl = 'https://' + 'a'.repeat(2048);
      const result = isValidSubmissionUrl(longUrl);
      expect(result.valid).toBe(false);
    });

    it('rejects unsupported platforms', () => {
      const result = isValidSubmissionUrl('https://www.twitch.tv/video/123');
      expect(result.valid).toBe(false);
    });

    it('rejects plain text', () => {
      const result = isValidSubmissionUrl('not a url');
      expect(result.valid).toBe(false);
    });

    it('rejects null', () => {
      const result = isValidSubmissionUrl(null as any);
      expect(result.valid).toBe(false);
    });
  });
});

// ── sanitizeInput ───────────────────────────────────────────
describe('sanitizeInput', () => {
  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('strips HTML angle brackets', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
  });

  it('truncates to maxLength', () => {
    const long = 'a'.repeat(1000);
    expect(sanitizeInput(long, 100).length).toBe(100);
  });

  it('handles empty string', () => {
    expect(sanitizeInput('')).toBe('');
  });
});

// ── isValidEmail ────────────────────────────────────────────
describe('isValidEmail', () => {
  it('accepts valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user+tag@domain.co.uk')).toBe(true);
    expect(isValidEmail('a@b.co')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

// ── isValidUrl ──────────────────────────────────────────────
describe('isValidUrl', () => {
  it('accepts valid URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://example.com/path?q=1')).toBe(true);
  });

  it('rejects invalid URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
  });
});

// ── validateCampaignInput ───────────────────────────────────
describe('validateCampaignInput', () => {
  it('passes valid input with all fields', () => {
    const result = validateCampaignInput({
      trackTitle: 'My Song',
      trackUrl: 'https://open.spotify.com/track/123',
      cpmRate: '10',
      budget: '500',
      maxPayout: '100',
      requirements: 'Must be high quality',
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.sanitized.trackTitle).toBe('My Song');
      expect(result.sanitized.cpmRate).toBe(10);
      expect(result.sanitized.budget).toBe(500);
    }
  });

  it('rejects missing trackTitle', () => {
    const result = validateCampaignInput({
      trackUrl: 'https://open.spotify.com/track/123',
      cpmRate: '10',
      budget: '500',
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContain('trackTitle is required');
    }
  });

  it('rejects invalid trackUrl', () => {
    const result = validateCampaignInput({
      trackTitle: 'My Song',
      trackUrl: 'not-a-url',
      cpmRate: '10',
      budget: '500',
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContain('trackUrl must be a valid URL');
    }
  });

  it('rejects cpmRate <= 0', () => {
    const result = validateCampaignInput({
      trackTitle: 'My Song',
      trackUrl: 'https://spotify.com/track/123',
      cpmRate: '0',
      budget: '500',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects cpmRate > 100', () => {
    const result = validateCampaignInput({
      trackTitle: 'My Song',
      trackUrl: 'https://spotify.com/track/123',
      cpmRate: '101',
      budget: '500',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects budget <= 0', () => {
    const result = validateCampaignInput({
      trackTitle: 'My Song',
      trackUrl: 'https://spotify.com/track/123',
      cpmRate: '10',
      budget: '0',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects budget > 100000', () => {
    const result = validateCampaignInput({
      trackTitle: 'My Song',
      trackUrl: 'https://spotify.com/track/123',
      cpmRate: '10',
      budget: '100001',
    });
    expect(result.valid).toBe(false);
  });

  it('sanitizes HTML in text fields', () => {
    const result = validateCampaignInput({
      trackTitle: '<script>hack</script>',
      trackUrl: 'https://spotify.com/track/123',
      cpmRate: '10',
      budget: '500',
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.sanitized.trackTitle).not.toContain('<');
      expect(result.sanitized.trackTitle).not.toContain('>');
    }
  });

  it('handles optional fields gracefully', () => {
    const result = validateCampaignInput({
      trackTitle: 'My Song',
      trackUrl: 'https://spotify.com/track/123',
      cpmRate: '10',
      budget: '500',
    });
    expect(result.valid).toBe(true);
  });
});
