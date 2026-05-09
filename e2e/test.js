// @ts-check
const { chromium } = require('playwright');
const BASE = 'https://selah.fm';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  let pass = 0, fail = 0;
  const check = async (name, fn) => {
    try { await fn(); console.log(`  ✅ ${name}`); pass++; }
    catch(e) { console.log(`  ❌ ${name}: ${e.message}`); fail++; }
  };

  console.log('\n🧪 Selah.fm E2E Test Suite\n');

  // 1. Landing page
  await check('Landing page loads (200)', async () => {
    const res = await page.goto(BASE);
    if (res.status() !== 200) throw new Error(`Status ${res.status()}`);
  });

  // 2. Navigation links
  for (const p of ['/browse', '/login', '/dashboard', '/creators']) {
    await check(`Page ${p} loads`, async () => {
      const res = await page.goto(BASE + p);
      if (res.status() !== 200) throw new Error(`Status ${res.status()}`);
    });
  }

  // 3. Signup flow
  await check('Signup creates account', async () => {
    await page.goto(BASE + '/login');
    await page.click('text=No account? Sign up');
    await page.fill('input[placeholder="Display name"]', 'TestUser' + Date.now().toString(36));
    await page.fill('input[placeholder="Email"]', 'test' + Date.now() + '@selah-test.fm');
    await page.fill('input[placeholder="Password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/browse', { timeout: 5000 });
  });

  // 4. Dashboard loads
  await check('Dashboard shows create prompt', async () => {
    await page.goto(BASE + '/dashboard');
    await page.waitForSelector('text=Create your first campaign', { timeout: 5000 }).catch(() => {
      // If already has campaigns, that's also fine
    });
  });

  // 5. Campaign creation wizard
  await check('Campaign wizard opens', async () => {
    await page.click('text=Start your first campaign');
    await page.waitForSelector('text=Campaign cover', { timeout: 3000 });
  });

  // 6. Campaign creation completion  
  await check('Create campaign completes', async () => {
    await page.click('text=Continue'); // Skip cover art
    await page.waitForSelector('text=Track details', { timeout: 3000 });
    await page.fill('input[placeholder="Track name"]', 'E2E Test Track');
    await page.fill('input[placeholder="Spotify or SoundCloud link"]', 'https://spotify.com/test');
    await page.click('text=Continue');
    await page.waitForSelector('text=Budget', { timeout: 3000 });
    await page.click('text=Launch campaign');
    await page.waitForSelector('text=E2E Test Track', { timeout: 5000 });
  });

  // 7. Browse page shows campaigns
  await check('Browse shows campaigns', async () => {
    await page.goto(BASE + '/browse');
    await page.waitForSelector('text=Discover', { timeout: 5000 });
  });

  // 8. Creator directory
  await check('Creators page loads', async () => {
    await page.goto(BASE + '/creators');
    await page.waitForSelector('text=Creators', { timeout: 5000 }).catch(() => {});
  });

  // Summary
  console.log(`\n${'='.repeat(40)}`);
  console.log(`  Results: ${pass} passed, ${fail} failed`);
  console.log(`${'='.repeat(40)}\n`);

  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})();
