import { describe, it, expect } from 'vitest';

/**
 * API Contract Tests
 * 
 * These validate that our API routes return the expected shapes.
 * They run against a real server (local or production).
 * Skip if no E2E_BASE_URL is set (these are integration tests, not unit).
 */

const BASE = process.env.E2E_BASE_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
const runIntegration = !!process.env.E2E_BASE_URL || !!process.env.CI;

describe.runIf(runIntegration)('API Contract: Health', () => {
  it('returns 200 with expected shape', async () => {
    const res = await fetch(`${BASE}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.db).toBe('connected');
    expect(body.stats).toBeDefined();
    expect(typeof body.stats.users).toBe('number');
  });
});

describe.runIf(runIntegration)('API Contract: Stats', () => {
  it('returns aggregated platform metrics', async () => {
    const res = await fetch(`${BASE}/api/stats`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(typeof body.artists).toBe('number');
    expect(typeof body.creators).toBe('number');
    expect(typeof body.totalViews).toBe('number');
  });

  it('returns Cache-Control header', async () => {
    const res = await fetch(`${BASE}/api/stats`);
    const cc = res.headers.get('cache-control');
    expect(cc).toContain('s-maxage=');
  });
});

describe.runIf(runIntegration)('API Contract: Campaigns', () => {
  it('returns array of campaigns', async () => {
    const res = await fetch(`${BASE}/api/campaigns?limit=3`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.campaigns)).toBe(true);
  });

  it('each campaign has required fields', async () => {
    const res = await fetch(`${BASE}/api/campaigns?limit=3`);
    const body = await res.json();
    for (const c of body.campaigns) {
      expect(c.id).toBeDefined();
      expect(typeof c.slug).toBe('string');
    }
  });
});

describe.runIf(runIntegration)('API Contract: Artists', () => {
  it('returns paginated artist list', async () => {
    const res = await fetch(`${BASE}/api/artists?limit=3`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.artists)).toBe(true);
    expect(typeof body.total).toBe('number');
    expect(body.total).toBeGreaterThan(0);
  });

  it('filters by genre', async () => {
    const res = await fetch(`${BASE}/api/artists?genre=electronic&limit=3`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.artists)).toBe(true);
  });

  it('searches by name', async () => {
    const res = await fetch(`${BASE}/api/artists?search=a&limit=3`);
    expect(res.ok()).toBeTruthy();
  });
});

describe.runIf(runIntegration)('API Contract: Discover', () => {
  it('returns trending submissions', async () => {
    const res = await fetch(`${BASE}/api/discover?limit=5`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.submissions)).toBe(true);
  });
});

describe.runIf(runIntegration)('API Contract: Auth', () => {
  it('returns 401 for unauthenticated export', async () => {
    const res = await fetch(`${BASE}/api/me/export`);
    expect(res.status).toBe(401);
  });

  it('returns 401 for unauthenticated delete', async () => {
    const res = await fetch(`${BASE}/api/me/delete`, { method: 'POST' });
    expect(res.status).toBe(401);
  });
});

describe.runIf(runIntegration)('API Contract: Collections (auth-gated)', () => {
  it('requires auth', async () => {
    const res = await fetch(`${BASE}/api/collections`);
    expect(res.status).toBe(401);
  });
});

describe.runIf(runIntegration)('API Contract: Feed (auth-gated)', () => {
  it('requires auth', async () => {
    const res = await fetch(`${BASE}/api/feed`);
    expect(res.status).toBe(401);
  });
});

describe.runIf(runIntegration)('API Contract: Referral', () => {
  it('requires auth for code endpoint', async () => {
    const res = await fetch(`${BASE}/api/referral/code`);
    expect(res.status).toBe(401);
  });
});
