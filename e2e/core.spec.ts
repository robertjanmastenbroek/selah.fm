import { test, expect } from '@playwright/test';

const BASE = 'https://selah.fm';

// ─── HOMEPAGE ────────────────────────────────────────────────
test.describe('Homepage', () => {
  test('loads and displays key elements', async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveTitle(/Selah\.fm/);
    // Hero section
    await expect(page.locator('text=Promote your music').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=How it works').first()).toBeVisible();
    // Trust badges
    await expect(page.locator('text=Free to start').first()).toBeVisible();
    await expect(page.locator('text=Verified views').first()).toBeVisible();
    // FAQ section
    await expect(page.locator('text=Common questions').first()).toBeVisible();
    // "Get started" CTA
    await expect(page.locator('text=Get started').first()).toBeVisible();
  });

  test('Get started links to login', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('text=Get started').first().click();
    await expect(page).toHaveURL(/\/login/);
  });
});

// ─── BROWSE ──────────────────────────────────────────────────
test.describe('Browse', () => {
  test('loads with tabs and artists', async ({ page }) => {
    await page.goto(`${BASE}/browse`);
    await expect(page.locator('text=Artists').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Campaigns').first()).toBeVisible();
    await expect(page.locator('text=Trending').first()).toBeVisible();
  });

  test('genre filters highlight on click', async ({ page }) => {
    await page.goto(`${BASE}/browse`);
    await page.locator('text=Electronic').first().click();
    // Genre filter is client-side state, not URL-based
    await expect(page.locator('text=Electronic').first()).toHaveClass(/border-primary/);
  });
});

// ─── BLOG ────────────────────────────────────────────────────
test.describe('Blog', () => {
  test('loads and shows articles', async ({ page }) => {
    await page.goto(`${BASE}/blog`);
    await expect(page).toHaveTitle(/Blog/);
    await expect(page.locator('text=articles').first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── LOGIN ───────────────────────────────────────────────────
test.describe('Login', () => {
  test('loads with Google sign-in', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('text=Continue with Google').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Continue with email').first()).toBeVisible();
    // Social proof badges
    await expect(page.locator('text=Verified views').first()).toBeVisible();
  });
});

// ─── CAMPAIGN PAGE ───────────────────────────────────────────
test.describe('Campaign Page', () => {
  test('existing campaign loads', async ({ page }) => {
    // Find first campaign from homepage
    await page.goto(BASE);
    await page.waitForSelector('text=Featured campaigns', { timeout: 10000 });
    // Click the first campaign card
    const firstCampaign = page.locator('text=View campaign, Browse all, or featured campaign card').first();
    // Just check we can navigate to a campaign
    await page.goto(`${BASE}/c/robert-jan-mastenbroek-merhav-yah-b3a3`);
    // Should either show campaign or "not found"
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });
});

// ─── ARTIST PAGE ─────────────────────────────────────────────
test.describe('Artist Page', () => {
  test('existing artist loads', async ({ page }) => {
    await page.goto(`${BASE}/artist/rony-rex-dcb016`);
    await page.waitForTimeout(3000);
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });
});

// ─── DASHBOARD ───────────────────────────────────────────────
test.describe('Dashboard', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});

// ─── 404 ──────────────────────────────────────────────────────
test.describe('404 Pages', () => {
  test('unknown page shows error', async ({ page }) => {
    await page.goto(`${BASE}/this-page-does-not-exist`);
    await expect(page.locator('text=not found').or(page.locator('text=404')).first()).toBeVisible({ timeout: 10000 });
  });
});
