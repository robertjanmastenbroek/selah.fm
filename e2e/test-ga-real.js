// @ts-check
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  
  await p.addInitScript(() => {
    window._gaPushes = [];
    var dl = [];
    Object.defineProperty(window, 'dataLayer', {
      get() { return window._raw || dl; },
      set(v) {
        window._raw = v;
        var o = v.push.bind(v);
        v.push = function() { window._gaPushes.push(Array.from(arguments)); return o.apply(this, arguments); };
      }
    });
  });

  await p.goto('https://selah.fm/login', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  await p.click('text=No account? Sign up');
  await p.waitForTimeout(500);
  
  var email = 'realga' + Date.now() + '@gmail.com';
  await p.fill('input[placeholder="Display name"]', 'Real Signup Test');
  await p.fill('input[placeholder="Email"]', email);
  await p.fill('input[placeholder="Password"]', 'Test123456!');
  
  await Promise.all([
    p.waitForNavigation({ timeout: 10000 }).catch(function(){}),
    p.click('button[type="submit"]')
  ]);
  await p.waitForTimeout(2000);
  
  var pushes = await p.evaluate(() => window._gaPushes || []);
  var signUpPushes = pushes.filter(function(a) { return a[0] === 'event' && a[1] === 'sign_up'; });
  console.log('Total pushes: ' + pushes.length);
  console.log('sign_up from page: ' + signUpPushes.length);
  pushes.forEach(function(a,i) { console.log('  ' + i + ': ' + JSON.stringify(a).substring(0,100)); });
  
  if (signUpPushes.length > 0) {
    console.log('\n✅ sign_up IS firing from login page code');
  } else {
    console.log('\n❌ sign_up NOT firing — JS bundle may not have fix deployed yet');
  }
  await b.close();
})();
