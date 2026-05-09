// @ts-check
const { chromium } = require('playwright');
const BASE = process.env.TEST_URL || 'https://selah.fm';

/**
 * Selah.fm — Full E2E Test Suite (v12)
 */
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  let pass = 0, fail = 0;
  const check = async (name, fn) => {
    try { await fn(); console.log(`  ✅ ${name}`); pass++; }
    catch(e) { console.log(`  ❌ ${name}: ${e.message}`); fail++; }
  };

  const timestamp = Date.now().toString(36);

  console.log('\n🧪 Selah.fm E2E Test Suite v12\n');
  console.log(`  🌐 Target: ${BASE}\n`);

  // ─── 1. Public Pages ───────────────────────────────────────────────────────

  await check('1.1 Landing page loads (200)', async () => {
    const res = await page.goto(BASE);
    if (res.status() !== 200) throw new Error(`Status ${res.status()}`);
  });

  await check('1.2 Landing has hero', async () => {
    await page.waitForSelector('text=Get your music', { timeout: 5000 });
  });

  await check('1.3 Landing has CTA cards', async () => {
    await page.waitForSelector('text=Start a campaign', { timeout: 3000 });
  });

  await check('1.4 Landing has trust badges', async () => {
    await page.waitForSelector('text=100% real views', { timeout: 3000 });
  });

  // All public pages
  for (const [path, label] of [['/browse', 'Campaigns'], ['/artists', 'Artists'], ['/creators', 'Creators'], ['/login', 'Login'], ['/tos', 'Terms'], ['/privacy', 'Privacy']]) {
    await check(`1.5 ${label} page (${path}) loads`, async () => {
      const res = await page.goto(BASE + path);
      if (res.status() !== 200) throw new Error(`Status ${res.status()}`);
    });
  }

  // ─── 2. Navigation ─────────────────────────────────────────────────────────

  await check('2.1 Nav shows Campaigns', async () => {
    await page.goto(BASE);
    await page.waitForSelector('text=Campaigns', { timeout: 3000 });
  });

  await check('2.2 Nav shows Artists', async () => {
    await page.waitForSelector('text=Artists', { timeout: 3000 });
  });

  await check('2.3 Nav shows Creators', async () => {
    await page.waitForSelector('text=Creators', { timeout: 3000 });
  });

  await check('2.4 Logo links to home', async () => {
    await page.goto(BASE + '/browse');
    await page.click('text=Selah');
    await page.waitForURL(BASE + '/', { timeout: 5000 });
  });

  // ─── 3. Browse Page ────────────────────────────────────────────────────────

  await check('3.1 Browse page loads', async () => {
    await page.goto(BASE + '/browse');
    await page.waitForSelector('text=Discover campaigns', { timeout: 5000 });
  });

  await check('3.2 Browse shows campaign count', async () => {
    await page.waitForSelector('text=campaigns available', { timeout: 5000 });
  });

  await check('3.3 Campaign cards have content', async () => {
    // Either campaign cards or empty state should be visible
    const cards = await page.$$('text=CPM');
    const empty = await page.$('text=No campaigns yet');
    if (!cards.length && !empty) throw new Error('No content on browse page');
  });

  // ─── 4. Artists Page ───────────────────────────────────────────────────────

  await check('4.1 Artists page loads', async () => {
    await page.goto(BASE + '/artists');
    await page.waitForSelector('text=Artists', { timeout: 5000 });
  });

  // ─── 5. Creators Page ──────────────────────────────────────────────────────

  await check('5.1 Creators page loads', async () => {
    await page.goto(BASE + '/creators');
    await page.waitForSelector('text=Creators', { timeout: 5000 });
  });

  // ─── 6. Auth Pages ─────────────────────────────────────────────────────────

  await check('6.1 Login page has Google button', async () => {
    await page.goto(BASE + '/login');
    await page.waitForSelector('text=Continue with Google', { timeout: 3000 });
  });

  await check('6.2 Login page has email form', async () => {
    await page.waitForSelector('input[placeholder="Email"]', { timeout: 3000 });
  });

  await check('6.3 Can switch to signup', async () => {
    await page.click('text=No account? Sign up');
    await page.waitForSelector('input[placeholder="Display name"]', { timeout: 3000 });
  });

  // ─── 7. Dashboard (requires auth — verify redirect) ────────────────────────

  await check('7.1 Dashboard loads', async () => {
    const res = await page.goto(BASE + '/dashboard');
    if (res.status() !== 200) throw new Error(`Status ${res.status()}`);
  });

  // ─── 8. Review Page ─────────────────────────────────────────────────────────

  await check('8.1 Review page loads', async () => {
    const res = await page.goto(BASE + '/review');
    if (res.status() !== 200) throw new Error(`Status ${res.status()}`);
  });

  // ─── 9. Earnings Page ──────────────────────────────────────────────────────

  await check('9.1 Earnings page loads', async () => {
    const res = await page.goto(BASE + '/earnings');
    if (res.status() !== 200) throw new Error(`Status ${res.status()}`);
  });

  // ─── 10. Settings Page ─────────────────────────────────────────────────────

  await check('10.1 Settings page loads', async () => {
    const res = await page.goto(BASE + '/settings');
    if (res.status() !== 200) throw new Error(`Status ${res.status()}`);
  });

  // ─── 11. Analytics Page ────────────────────────────────────────────────────

  await check('11.1 Analytics page loads', async () => {
    const res = await page.goto(BASE + '/analytics');
    if (res.status() !== 200) throw new Error(`Status ${res.status()}`);
  });

  // ─── 12. Content Guidelines Page ───────────────────────────────────────────

  await check('12.1 Content guidelines page loads', async () => {
    const res = await page.goto(BASE + '/content-guidelines');
    if (res.status() !== 200) throw new Error(`Status ${res.status()}`);
  });

  // ─── 13. Campaign Detail (404 handling) ────────────────────────────────────

  await check('13.1 Campaign detail handles missing ID', async () => {
    await page.goto(BASE + '/c/nonexistent-id');
    await page.waitForSelector('text=not found', { timeout: 5000 });
  });

  // ─── 14. Onboarding Page ───────────────────────────────────────────────────

  await check('14.1 Onboarding page loads', async () => {
    const res = await page.goto(BASE + '/onboarding');
    if (res.status() !== 200) throw new Error(`Status ${res.status()}`);
  });

  // ─── 15. Mobile Viewport ───────────────────────────────────────────────────

  await check('15.1 Mobile (375px) renders landing page', async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForSelector('text=Get your music', { timeout: 5000 });
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  await check('15.2 Mobile browse works', async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE + '/browse');
    await page.waitForSelector('text=Campaigns', { timeout: 5000 });
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  // ─── 16. SEO ───────────────────────────────────────────────────────────────

  await check('16.1 Sitemap returns XML', async () => {
    const res = await page.goto(BASE + '/sitemap.xml');
    if (res.status() !== 200) throw new Error(`Status ${res.status()}`);
    const body = await res.text();
    if (!body.includes('<urlset')) throw new Error('Not valid XML sitemap');
  });

  await check('16.2 Robots.txt loads', async () => {
    const res = await page.goto(BASE + '/robots.txt');
    if (res.status() !== 200) throw new Error(`Status ${res.status()}`);
  });

  // ─── Summary ───────────────────────────────────────────────────────────────

  console.log(`\n${'='.repeat(50)}`);
  console.log(`  Results: ${pass} passed, ${fail} failed  (${pass + fail} total)`);
  console.log(`  Score:   ${Math.round(pass / (pass + fail) * 100)}%`);
  console.log(`${'='.repeat(50)}\n`);

  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})();
