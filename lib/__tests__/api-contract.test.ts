import { describe, it, expect } from 'vitest';

/**
 * API Contract Tests
 * 
 * These validate that our API routes return the expected shapes.
 * Only run when E2E_BASE_URL or CI env is set.
 */

const BASE = process.env.E2E_BASE_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
const shouldRun = !!process.env.E2E_BASE_URL || !!process.env.CI;

function apiTest(name: string, fn: () => void | Promise<void>) {
  if (shouldRun) {
    it(name, fn);
  } else {
    it.skip(name, fn);
  }
}

if (shouldRun) {
  describe('API Contract: Health', () => {
    apiTest('returns 200 with expected shape', async () => {
      const res = await fetch(`${BASE}/api/health`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('ok');
      expect(body.db).toBe('connected');
      expect(body.stats).toBeDefined();
      expect(typeof body.stats.users).toBe('number');
    });
  });

  describe('API Contract: Stats', () => {
    apiTest('returns aggregated platform metrics', async () => {
      const res = await fetch(`${BASE}/api/stats`);
      expect(res.ok).toBe(true);
      const body = await res.json();
      expect(typeof body.artists).toBe('number');
      expect(typeof body.creators).toBe('number');
      expect(typeof body.totalViews).toBe('number');
    });

    apiTest('returns Cache-Control header', async () => {
      const res = await fetch(`${BASE}/api/stats`);
      const cc = res.headers.get('cache-control');
      expect(cc).toContain('s-maxage=');
    });
  });

  describe('API Contract: Campaigns', () => {
    apiTest('returns array of campaigns', async () => {
      const res = await fetch(`${BASE}/api/campaigns?limit=3`);
      expect(res.ok).toBe(true);
      const body = await res.json();
      expect(Array.isArray(body.campaigns)).toBe(true);
    });

    apiTest('each campaign has required fields', async () => {
      const res = await fetch(`${BASE}/api/campaigns?limit=3`);
      const body = await res.json();
      for (const c of body.campaigns) {
        expect(c.id).toBeDefined();
        expect(typeof c.slug).toBe('string');
      }
    });
  });

  describe('API Contract: Artists', () => {
    apiTest('returns paginated artist list', async () => {
      const res = await fetch(`${BASE}/api/artists?limit=3`);
      expect(res.ok).toBe(true);
      const body = await res.json();
      expect(Array.isArray(body.artists)).toBe(true);
      expect(typeof body.total).toBe('number');
      expect(body.total).toBeGreaterThan(0);
    });

    apiTest('filters by genre', async () => {
      const res = await fetch(`${BASE}/api/artists?genre=electronic&limit=3`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body.artists)).toBe(true);
    });

    apiTest('searches by name', async () => {
      const res = await fetch(`${BASE}/api/artists?search=a&limit=3`);
      expect(res.ok).toBe(true);
    });
  });

  describe('API Contract: Discover', () => {
    apiTest('returns trending submissions', async () => {
      const res = await fetch(`${BASE}/api/discover?limit=5`);
      expect(res.ok).toBe(true);
      const body = await res.json();
      expect(Array.isArray(body.submissions)).toBe(true);
    });
  });

  describe('API Contract: Auth (unauthenticated)', () => {
    apiTest('returns 401 for unauthenticated export', async () => {
      const res = await fetch(`${BASE}/api/me/export`);
      expect(res.status).toBe(401);
    });

    apiTest('returns 401 for unauthenticated delete', async () => {
      const res = await fetch(`${BASE}/api/me/delete`, { method: 'POST' });
      expect(res.status).toBe(401);
    });
  });

  describe('API Contract: Auth-gated endpoints', () => {
    apiTest('collections requires auth', async () => {
      const res = await fetch(`${BASE}/api/collections`);
      expect(res.status).toBe(401);
    });

    apiTest('feed requires auth', async () => {
      const res = await fetch(`${BASE}/api/feed`);
      expect(res.status).toBe(401);
    });

    apiTest('referral code requires auth', async () => {
      const res = await fetch(`${BASE}/api/referral/code`);
      expect(res.status).toBe(401);
    });
  });
} else {
  describe('API Contract Tests', () => {
    it('skipped — set E2E_BASE_URL or CI to run', () => {
      expect(true).toBe(true);
    });
  });
}
