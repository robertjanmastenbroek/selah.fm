// @ts-check
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // Simple interceptor
  await page.addInitScript(() => {
    window._gaEvents = [];
    var origDef = Object.getOwnPropertyDescriptor(window, 'dataLayer');
    var _dl = [];
    Object.defineProperty(window, 'dataLayer', {
      get() { return window.__dl || _dl; },
      set(v) {
        window.__dl = v;
        var orig = v.push.bind(v);
        v.push = function() {
          // Store ALL pushes regardless of format
          window._gaEvents.push({ args: JSON.stringify(Array.from(arguments)) });
          return orig.apply(this, arguments);
        };
      }
    });
  });

  console.log('Format test: verifying dataLayer.push formats\n');
  await page.goto('https://selah.fm/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Test array format (matching inline gtag)
  console.log('1. Array format: dataLayer.push(["event", "sign_up", {method:"email"}])');
  await page.evaluate(() => { window.dataLayer.push(['event', 'sign_up', { method: 'email' }]); });
  
  // Test object format
  console.log('2. Object format: dataLayer.push({event: "login", method: "email"})');
  await page.evaluate(() => { window.dataLayer.push({ event: 'login', method: 'email' }); });

  await page.waitForTimeout(1000);

  var events = await page.evaluate(() => window._gaEvents || []);
  console.log('\nAll captured pushes:');
  events.forEach(function(e, i) {
    console.log('  ' + i + ': ' + e.args);
  });

  // Filter non-GTM events
  var customEvents = events.filter(function(e) {
    var a = JSON.parse(e.args);
    return a[0] === 'event' || (typeof a[0] === 'object' && a[0].event);
  });
  console.log('\nCustom events found: ' + customEvents.length);
  customEvents.forEach(function(e) {
    var a = JSON.parse(e.args);
    var name = Array.isArray(a[0]) ? 'nested' : (a[0].event || a[1] || a[0]);
    console.log('  event=' + name + ' args=' + JSON.stringify(a).substring(0, 80));
  });

  console.log('\n✅ Both formats captured: ' + (customEvents.length >= 2));

  await browser.close();
})();
