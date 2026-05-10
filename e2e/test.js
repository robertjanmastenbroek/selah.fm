// @ts-check
const { chromium } = require('playwright');
const BASE = process.env.TEST_URL || 'https://selah.fm';

/**
 * Selah.fm — Full E2E Test Suite (v13)
 */
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  let pass = 0, fail = 0;
  const check = async (name, fn) => {
    try { await fn(); console.log(`  ✅ ${name}`); pass++; }
    catch(e) { console.log(`  ❌ ${name}: ${e.message}`); fail++; }
  };

  console.log('\n🧪 Selah.fm E2E Test Suite v13\n');
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
    await page.waitForSelector("text=I'm an artist", { timeout: 3000 });
  });

  await check('1.4 Landing has trust text', async () => {
    await page.waitForSelector('text=Trusted by', { timeout: 3000 });
  });

  // All public pages
  for (const [path, label] of [
    ['/browse', 'Campaigns'], ['/artists', 'Artists'], ['/creators', 'Creators'],
    ['/login', 'Login'], ['/tos', 'Terms'], ['/privacy', 'Privacy'],
    ['/content-guidelines', 'Content Guidelines'], ['/open-source', 'Open Source']
  ]) {
    await check(`1.5 ${label} page (${path}) loads`, async () => {
      const res = await page.goto(BASE + path);
      if (res.status() !== 200) throw new Error(`Status ${res.status()}`);
    });
  }

  // Welcome landing pages
  for (const [path, label] of [['/welcome-artists', 'Artist Welcome'], ['/welcome-creators', 'Creator Welcome']]) {
    await check(`1.6 ${label} (${path}) loads`, async () => {
      const res = await page.goto(BASE + path);
      if (res.status() !== 200) throw new Error(`Status ${res.status()}`);
    });
  }

  // ─── 2. Navigation ─────────────────────────────────────────────────────────

  await check('2.1 Nav shows Campaigns', async () => {
    await page.goto(BASE + '/browse');
    await page.waitForSelector('text=Campaigns', { timeout: 3000 });
  });

  await check('2.2 Nav shows Artists', async () => {
    await page.goto(BASE + '/artists');
    await page.waitForSelector('text=Artists', { timeout: 3000 });
  });

  await check('2.3 Nav shows Creators', async () => {
    await page.goto(BASE + '/creators');
    await page.waitForSelector('text=Creators', { timeout: 3000 });
  });

  await check('2.4 Logo links to home or browse', async () => {
    await page.goto(BASE + '/browse');
    await page.click('text=Selah');
    // Logo links to / for unauthenticated users, /browse for logged-in — both are valid
    await page.waitForURL(/selah\.fm(\/browse|\/)?$/, { timeout: 5000 });
  });

  // ─── 3. Browse Page ────────────────────────────────────────────────────────

  await check('3.1 Browse page loads', async () => {
    await page.goto(BASE + '/browse');
    await page.waitForSelector('text=Discover campaigns', { timeout: 5000 });
  });

  await check('3.2 Browse shows campaign count', async () => {
    await page.waitForSelector('text=campaigns available', { timeout: 5000 });
  });

  await check('3.3 Browse has create campaign button', async () => {
    await page.waitForSelector('text=Create campaign', { timeout: 3000 });
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

  await check('6.4 Signup has role selector', async () => {
    await page.waitForSelector('text=🎵 Artist', { timeout: 3000 });
    await page.waitForSelector('text=📱 Creator', { timeout: 3000 });
  });

  // ─── 7. Auth-protected pages (should return 200 even unauthenticated) ──────

  for (const [path, label] of [
    ['/dashboard', 'Dashboard'], ['/review', 'Review'],
    ['/earnings', 'Earnings'], ['/settings', 'Settings'],
    ['/analytics', 'Analytics'], ['/onboarding', 'Onboarding'],
  ]) {
    await check(`7.1 ${label} page (${path}) loads 200`, async () => {
      const res = await page.goto(BASE + path);
      if (res.status() !== 200) throw new Error(`Status ${res.status()}`);
    });
  }

  // ─── 8. Campaign Detail (404 handling) ─────────────────────────────────────

  await check('8.1 Campaign detail handles missing ID', async () => {
    await page.goto(BASE + '/c/nonexistent-id');
    await page.waitForSelector('text=Campaign not found', { timeout: 5000 });
  });

  // ─── 9. 404 Page ──────────────────────────────────────────────────────────

  await check('9.1 Custom 404 page renders', async () => {
    await page.goto(BASE + '/this-page-does-not-exist-ever');
    await page.waitForSelector('text=Page not found', { timeout: 5000 });
  });

  // ─── 10. Mobile Viewport ───────────────────────────────────────────────────

  await check('10.1 Mobile (375px) renders landing page', async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForSelector('text=Get your music', { timeout: 5000 });
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  await check('10.2 Mobile browse works', async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE + '/browse');
    await page.waitForSelector('text=Discover', { timeout: 5000 });
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  await check('10.3 Mobile login works', async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE + '/login');
    await page.waitForSelector('text=Continue with Google', { timeout: 5000 });
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  // ─── 11. SEO ───────────────────────────────────────────────────────────────

  await check('11.1 Sitemap returns XML', async () => {
    const res = await page.goto(BASE + '/sitemap.xml');
    if (res.status() !== 200) throw new Error(`Status ${res.status()}`);
    const body = await res.text();
    if (!body.includes('<urlset')) throw new Error('Not valid XML sitemap');
  });

  await check('11.2 Robots.txt loads', async () => {
    const res = await page.goto(BASE + '/robots.txt');
    if (res.status() !== 200) throw new Error(`Status ${res.status()}`);
  });

  // ─── 12. API Health ────────────────────────────────────────────────────────

  await check('12.1 Health check returns 200', async () => {
    const res = await page.goto(BASE + '/api/health');
    if (res.status() !== 200) throw new Error(`Status ${res.status()}`);
    const body = await res.json();
    if (body.status !== 'ok') throw new Error('Health check failed: ' + JSON.stringify(body));
  });

  await check('12.2 Stats API returns data', async () => {
    const res = await page.goto(BASE + '/api/stats');
    if (res.status() !== 200) throw new Error(`Status ${res.status()}`);
    const body = await res.json();
    if (typeof body.artists !== 'number' || typeof body.creators !== 'number') {
      throw new Error('Stats API missing fields');
    }
  });

  // ─── 13. Skip-to-content accessibility ─────────────────────────────────────

  await check('13.1 Skip-to-content link exists', async () => {
    await page.goto(BASE);
    const skipLink = await page.$('a[href="#main-content"]');
    if (!skipLink) throw new Error('Skip-to-content link not found');
  });

  await check('13.2 Main content landmark exists', async () => {
    const main = await page.$('main#main-content');
    if (!main) throw new Error('Main content landmark not found');
  });

  // ─── Summary ───────────────────────────────────────────────────────────────

  console.log(`\n${'='.repeat(50)}`);
  console.log(`  Results: ${pass} passed, ${fail} failed  (${pass + fail} total)`);
  console.log(`  Score:   ${Math.round(pass / (pass + fail) * 100)}%`);
  console.log(`${'='.repeat(50)}\n`);

  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})();
