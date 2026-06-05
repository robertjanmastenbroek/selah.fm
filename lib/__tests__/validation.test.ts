import { describe, it, expect } from 'vitest';
import {
  isValidSubmissionUrl,
  sanitizeInput,
  isValidEmail,
  isValidUrl,
  validateCampaignInput,
} from '../validation';

describe('validation.ts — URL Validation', () => {
  // ── isValidSubmissionUrl ─────────────────────────────────
  describe('isValidSubmissionUrl', () => {
    it('accepts TikTok video URLs', () => {
      const urls = [
        'https://tiktok.com/@user/video/1234567890',
        'https://www.tiktok.com/@user/video/1234567890',
        'https://vm.tiktok.com/abc123/',
        'https://vt.tiktok.com/abc123/',
        'https://m.tiktok.com/v/1234567890',
      ];
      for (const url of urls) {
        expect(isValidSubmissionUrl(url)).toEqual({ valid: true, platform: 'tiktok' });
      }
    });

    it('accepts Instagram Reel URLs', () => {
      const urls = [
        'https://instagram.com/reel/abc123/',
        'https://www.instagram.com/reel/abc123/',
        'https://instagram.com/p/abc123/',
        'https://www.instagram.com/tv/abc123/',
        'https://www.instagram.com/share/abc123/',
      ];
      for (const url of urls) {
        expect(isValidSubmissionUrl(url)).toEqual({ valid: true, platform: 'instagram' });
      }
    });

    it('accepts YouTube Shorts and watch URLs', () => {
      const urls = [
        'https://youtube.com/watch?v=abc123',
        'https://www.youtube.com/watch?v=abc123',
        'https://youtube.com/shorts/abc123',
        'https://www.youtube.com/shorts/abc123',
        'https://youtu.be/abc123',
        'https://m.youtube.com/watch?v=abc123',
      ];
      for (const url of urls) {
        expect(isValidSubmissionUrl(url)).toEqual({ valid: true, platform: 'youtube' });
      }
    });

    it('accepts Facebook video URLs', () => {
      const urls = [
        'https://facebook.com/reel/abc123',
        'https://www.facebook.com/reel/abc123',
        'https://facebook.com/watch?v=abc123',
        'https://fb.watch/abc123',
        'https://www.facebook.com/video/abc123',
      ];
      for (const url of urls) {
        expect(isValidSubmissionUrl(url)).toEqual({ valid: true, platform: 'facebook' });
      }
    });

    it('rejects non-https URLs', () => {
      expect(isValidSubmissionUrl('http://tiktok.com/@user/video/1')).toEqual({
        valid: false,
        error: 'URL must start with https://',
      });
    });

    it('rejects empty or missing URLs', () => {
      expect(isValidSubmissionUrl('').valid).toBe(false);
      expect(isValidSubmissionUrl('   ').valid).toBe(false);
      expect((isValidSubmissionUrl as any)().valid).toBe(false);
    });

    it('rejects unsupported platforms', () => {
      expect(isValidSubmissionUrl('https://twitter.com/video/1').valid).toBe(false);
      expect(isValidSubmissionUrl('https://vimeo.com/123').valid).toBe(false);
      expect(isValidSubmissionUrl('https://rumble.com/video').valid).toBe(false);
    });

    it('rejects URLs that are too short', () => {
      expect(isValidSubmissionUrl('https://a.co').valid).toBe(false);
    });
  });

  // ── sanitizeInput ────────────────────────────────────────
  describe('sanitizeInput', () => {
    it('trims whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('strips HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).not.toContain('<');
      expect(sanitizeInput('<b>bold</b>')).not.toContain('<');
    });

    it('truncates to max length', () => {
      expect(sanitizeInput('abcdefghij', 5)).toBe('abcde');
    });

    it('handles empty input', () => {
      expect(sanitizeInput('')).toBe('');
    });
  });

  // ── isValidEmail ─────────────────────────────────────────
  describe('isValidEmail', () => {
    it('accepts valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user+tag@domain.co.uk')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  // ── isValidUrl ───────────────────────────────────────────
  describe('isValidUrl', () => {
    it('accepts valid https URLs', () => {
      expect(isValidUrl('https://selah.fm')).toBe(true);
      expect(isValidUrl('https://example.com/path?q=1')).toBe(true);
    });

    it('rejects non-http protocols', () => {
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
    });

    it('rejects empty strings', () => {
      expect(isValidUrl('')).toBe(false);
    });
  });

  // ── validateCampaignInput ────────────────────────────────
  describe('validateCampaignInput', () => {
    it('validates a correct input', () => {
      const result = validateCampaignInput({
        trackTitle: 'My Song',
        trackUrl: 'https://open.spotify.com/track/abc',
        cpmRate: '5',
        budget: '100',
      });
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.sanitized.trackTitle).toBe('My Song');
        expect(result.sanitized.cpmRate).toBe(5);
        expect(result.sanitized.budget).toBe(100);
      }
    });

    it('rejects missing track title', () => {
      const result = validateCampaignInput({
        trackUrl: 'https://spotify.com/track/abc',
        cpmRate: '5',
        budget: '100',
      });
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects invalid CPM', () => {
      const result = validateCampaignInput({
        trackTitle: 'Song',
        trackUrl: 'https://spotify.com/track/abc',
        cpmRate: '-1',
        budget: '100',
      });
      expect(result.valid).toBe(false);
    });

    it('rejects CPM over $100', () => {
      const result = validateCampaignInput({
        trackTitle: 'Song',
        trackUrl: 'https://spotify.com/track/abc',
        cpmRate: '200',
        budget: '100',
      });
      expect(result.valid).toBe(false);
    });

    it('rejects missing URL', () => {
      const result = validateCampaignInput({
        trackTitle: 'Song',
        cpmRate: '5',
        budget: '100',
      });
      expect(result.valid).toBe(false);
    });

    it('rejects budget over $100,000', () => {
      const result = validateCampaignInput({
        trackTitle: 'Song',
        trackUrl: 'https://spotify.com/track/abc',
        cpmRate: '5',
        budget: '200000',
      });
      expect(result.valid).toBe(false);
    });

    it('sanitizes HTML in track title', () => {
      const result = validateCampaignInput({
        trackTitle: '<script>alert(1)</script>My Song',
        trackUrl: 'https://spotify.com/track/abc',
        cpmRate: '5',
        budget: '100',
      });
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.sanitized.trackTitle).not.toContain('<');
      }
    });

    it('handles optional fields gracefully', () => {
      const result = validateCampaignInput({
        trackTitle: 'Song',
        trackUrl: 'https://spotify.com/track/abc',
        cpmRate: '5',
        budget: '100',
        requirements: 'Be creative!',
        hashtags: '#music',
      });
      expect(result.valid).toBe(true);
    });
  });
});
