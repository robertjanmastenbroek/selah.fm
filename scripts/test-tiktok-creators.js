// Test: TikTok Creator Email Discovery
// Scrapes hashtag pages → extracts creator usernames → visits profiles → extracts emails from bios
const puppeteer = require("puppeteer");

const HASHTAGS = [
  "contentcreator",
  "ugccreator", 
  "smallcreator",
  "musictok",
  "earnmoneyonline",
  "contentcreatortips",
  "sidehustle",
  "creatoreconomy",
];

async function scrapeTikTokCreators(limit = 50) {
  console.log("🚀 Starting TikTok creator discovery test...\n");
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
  });
  
  const allCreators = new Map(); // username → { bio, followers }
  let profilesScraped = 0;
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");
    
    for (const tag of HASHTAGS) {
      if (allCreators.size >= limit) break;
      
      console.log(`\n📱 Hashtag: #${tag}`);
      
      try {
        await page.goto(`https://www.tiktok.com/tag/${tag}`, {
          waitUntil: "networkidle2",
          timeout: 20000,
        });
        
        // Wait for content to load
        await new Promise(r => setTimeout(r, 2000));
        
        // Extract usernames
        const usernames = await page.evaluate(() => {
          const links = document.querySelectorAll("a[href*=\"/@\"]");
          const names = new Set();
          links.forEach(a => {
            const match = a.getAttribute("href")?.match(/@([a-zA-Z0-9._]+)/);
            if (match) names.add(match[1]);
          });
          return [...names];
        });
        
        console.log(`   Found ${usernames.length} creators`);
        
        // Scrape bios for new creators (max 10 per hashtag to stay fast)
        let scraped = 0;
        for (const username of usernames) {
          if (allCreators.size >= limit) break;
          if (allCreators.has(username)) continue;
          if (scraped >= 10) break;
          
          try {
            await page.goto(`https://www.tiktok.com/@${username}`, {
              waitUntil: "networkidle2",
              timeout: 10000,
            });
            await new Promise(r => setTimeout(r, 1000));
            
            const bio = await page.evaluate(() => {
              const el = document.querySelector("[data-e2e=\"user-bio\"]");
              return el?.textContent?.trim() || null;
            });
            
            const followers = await page.evaluate(() => {
              const el = document.querySelector("[data-e2e=\"followers-count\"]");
              return el?.textContent?.trim() || null;
            });
            
            if (bio) {
              allCreators.set(username, { bio, followers });
              profilesScraped++;
              scraped++;
            }
          } catch {
            // Profile page failed — skip
          }
          
          // Rate limit: delay between profile visits
          await new Promise(r => setTimeout(r, 1500));
        }
        
        console.log(`   Scraped ${scraped} bios (total unique: ${allCreators.size})`);
        
      } catch(e) {
        console.log(`   Error: ${e.message}`);
      }
      
      // Delay between hashtags
      await new Promise(r => setTimeout(r, 2000));
    }
    
    // Analyze results
    console.log(`\n\n📊 RESULTS`);
    console.log(`${"═".repeat(60)}`);
    console.log(`Total profiles scraped: ${profilesScraped}`);
    console.log(`Total unique creators: ${allCreators.size}`);
    
    const withEmail = [];
    const withoutEmail = [];
    
    for (const [username, { bio, followers }] of allCreators) {
      const emailMatch = bio?.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        const email = emailMatch[1].toLowerCase();
        if (!email.includes("tiktok") && !email.includes("bytedance")) {
          withEmail.push({ username, email, bio: bio.substring(0, 80), followers });
        } else {
          withoutEmail.push({ username, followers });
        }
      } else {
        withoutEmail.push({ username, followers });
      }
    }
    
    console.log(`\n📧 Creators WITH email in bio: ${withEmail.length}/${allCreators.size} (${((withEmail.length/allCreators.size)*100).toFixed(1)}%)`);
    console.log(`🚫 Creators WITHOUT email: ${withoutEmail.length}/${allCreators.size}`);
    
    if (withEmail.length > 0) {
      console.log(`\n✉️  Email samples:`);
      withEmail.slice(0, 10).forEach(c => {
        console.log(`   @${c.username.padEnd(20)} → ${c.email.padEnd(35)} (${c.followers || '?'} followers)`);
      });
    }
    
    return { withEmail, withoutEmail, total: allCreators.size };
    
  } finally {
    await browser.close();
  }
}

scrapeTikTokCreators(50)
  .then(r => console.log(`\n✅ Done. ${r.withEmail.length} emails found. Hit rate: ${((r.withEmail.length/r.total)*100).toFixed(1)}%`))
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => process.exit(0));
