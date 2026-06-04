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
    await expect(page.locator('text=Tracks').first()).toBeVisible();
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
  test('campaign redirect or page loads', async ({ page }) => {
    // Campaign URLs should either redirect to track page or show not found
    await page.goto(`${BASE}/c/robert-jan-mastenbroek-merhav-yah-b3a3`);
    await page.waitForTimeout(3000);
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });
});

// ─── ARTIST PAGE ─────────────────────────────────────────────
test.describe('Artist Page', () => {
  test('existing artist loads with content', async ({ page }) => {
    // Get a real artist slug from the API
    const res = await page.request.get(`${BASE}/api/artists?limit=1`);
    const body = await res.json();
    const artist = body.artists?.[0];
    test.skip(!artist?.slug, 'No artists available');

    await page.goto(`${BASE}/artist/${artist.slug}`);
    await page.waitForTimeout(5000);

    // Check the page actually rendered artist content, not an error
    const pageText = await page.locator('body').innerText();
    expect(pageText.toLowerCase()).not.toContain('something went sideways');
    expect(pageText.toLowerCase()).not.toContain('page not found');
    expect(pageText.toLowerCase()).toContain(artist.artist_name.toLowerCase());
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
