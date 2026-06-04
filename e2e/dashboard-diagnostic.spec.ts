import { test, expect } from '@playwright/test';

const BASE = 'https://selah.fm';

// ════════════════════════════════════════════════════════════════
// DASHBOARD DIAGNOSTIC — checks for runtime errors
// ════════════════════════════════════════════════════════════════
test.describe('Dashboard Diagnostic', () => {
  test('dashboard loads without error when authenticated', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for uncaught exceptions
    const pageErrors: string[] = [];
    page.on('pageerror', err => {
      pageErrors.push(err.message);
    });

    await page.goto(`${BASE}/dashboard`);
    await page.waitForTimeout(3000);

    const url = page.url();
    const body = await page.locator('body').innerText();

    console.log('=== URL:', url);
    console.log('=== Page errors:', pageErrors.join(', '));
    console.log('=== Console errors:', consoleErrors.slice(0, 5).join(', '));
    console.log('=== Body contains "Something went sideways":', body.includes('Something went sideways'));
    console.log('=== Body contains "Dashboard":', body.includes('Dashboard'));
    console.log('=== Body contains "Login":', body.includes('Login'));

    // If there's a console error about a 500 or failed fetch, report it
    const fetchErrors = consoleErrors.filter(e => e.includes('500') || e.includes('Failed to load') || e.includes('NetworkError'));
    console.log('=== Fetch errors:', fetchErrors.join(', '));
  });
});
