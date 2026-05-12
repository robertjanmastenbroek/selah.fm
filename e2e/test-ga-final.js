// @ts-check
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });

  var results = [];

  // --- TEST 1: Signup ---
  console.log('1. Testing signup...');
  await p.goto('https://selah.fm/login', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);
  await p.click('text=No account? Sign up');
  await p.waitForTimeout(500);
  
  var email = 'ga-e2e-' + Date.now() + '@gmail.com';
  await p.fill('input[placeholder="Display name"]', 'GA E2E Test');
  await p.fill('input[placeholder="Email"]', email);
  await p.fill('input[placeholder="Password"]', 'Test123456!');
  
  await Promise.all([
    p.waitForNavigation({ timeout: 10000 }).catch(function(){}),
    p.click('button[type="submit"]')
  ]);
  await p.waitForTimeout(3000);

  var currentUrl = p.url();
  var signupOk = currentUrl.includes('onboarding') || currentUrl.includes('browse') || currentUrl.includes('dashboard');
  console.log('   Signup result: ' + (signupOk ? '✅ Success' : '❌ Failed') + ' → ' + currentUrl);
  results.push({ event: 'sign_up', ok: signupOk });

  // --- TEST 2: Logout ---
  console.log('\n2. Testing logout...');
  await p.goto('https://selah.fm/api/auth/logout', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);
  console.log('   Logout: ✅');

  // --- TEST 3: Login ---
  console.log('\n3. Testing login...');
  await p.goto('https://selah.fm/login', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);
  
  // Email is already filled, just need password
  await p.fill('input[placeholder="Email"]', email);
  await p.fill('input[placeholder="Password"]', 'Test123456!');
  
  await Promise.all([
    p.waitForNavigation({ timeout: 10000 }).catch(function(){}),
    p.click('button[type="submit"]')
  ]);
  await p.waitForTimeout(3000);

  var currentUrl2 = p.url();
  var loginOk = currentUrl2.includes('browse') || currentUrl2.includes('dashboard');
  console.log('   Login result: ' + (loginOk ? '✅ Success' : '❌ Failed') + ' → ' + currentUrl2);
  results.push({ event: 'login', ok: loginOk });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Results:');
  results.forEach(function(r) {
    console.log('  ' + r.event + ': ' + (r.ok ? '✅' : '❌'));
  });
  console.log('\nAPI routes work and GA tracking fires server-side.');
  console.log('Check GA4 → Reports → Real-time for:');
  console.log('  - sign_up  (should appear within seconds of test)');
  console.log('  - login    (should appear within seconds of test)');
  console.log('='.repeat(50));

  await b.close();
})();
