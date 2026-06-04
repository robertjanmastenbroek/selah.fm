<!--
================================================================================
ARCHIVED — See SELAH.md for current source of truth.

This file is preserved for historical reference only. All actionable content
has been consolidated into SELAH.md (the living document).
================================================================================
-->

# Creator Discovery + Email Pipeline — Research & Implementation Plan

**Goal:** 50 creator emails/day (TikTok-primary, Instagram-secondary)
**Date:** 2026-05-16

---

## 1. Research Summary

### TikTok Discovery Methods

| Method | Cost | Scale | Email Extraction | Viability |
|--------|------|-------|-----------------|-----------|
| **Apify TikTok Email Scraper** | $5-49/mo | 5K-50K profiles | Built-in bio email extraction | ✅ BEST |
| **ScrapeCreators API** | Free trial, then paid | Unlimited | Bio text + email regex | ✅ Good |
| **SociaVault API** | 50 free credits, $29/mo | Large | Bio scraping endpoint | ✅ Good |
| **TikTok Research API (official)** | Free | Limited | No email | ❌ Academic only |
| **Bright Data collectors** | Pay-per-use | Large | Bio data | ⚠️ Expensive |
| **Manual Puppeteer/Playwright** | Free (proxy costs) | 50-200/day | Bio regex | ⚠️ Complex, detectable |
| **Instagram scraping** | Same tools | Same | Bio text | ⚠️ Harder than TikTok |

### Key Finding: TikTok > Instagram for email discovery

- TikTok creators are more business-oriented → more likely to have emails in bios
- TikTok's web version is more scraper-friendly than Instagram's
- Instagram aggressively blocks non-logged-in scraping
- Our existing `lib/outreach.ts` already scrapes Instagram bios for artist emails — adapt for TikTok

### Creator Profile Criteria (Who to target)

| Criteria | Why |
|----------|-----|
| 1K–100K followers | Small enough to want extra income, big enough to make good content |
| Has email in bio | Required — we can't guess creator emails (no Bandcamp subdomain pattern) |
| Posts about music/entertainment | Relevant to Selah.fm's campaign content |
| Active in last 30 days | Not abandoned accounts |
| Not a major influencer (>500K) | They won't respond to cold emails |

---

## 2. Technical Approach

### Option A: Apify API (Recommended — fastest implementation)

```
1. Search TikTok by hashtags:
   - #contentcreator, #ugccreator, #smallcreator, #newcreator
   - #musictok, #musicmarketing, #songpromotion
   - #earnmoney, #sidehustle, #creatoreconomy

2. For each video, extract creator username

3. Scrape each creator's profile:
   - Bio text → regex for email
   - Follower count
   - Video count
   - Profile link (Linktree, etc.)

4. Follow Linktree/Beacons links for additional emails

5. Verify email with existing MX check

6. Store in discovered_creators table

7. Generate + send outreach email
```

**Apify actors to use:**
- `clockworks/tiktok-scraper` — search + profiles
- `scrapers-hub/tiktok-profile-email-scraper` — dedicated email extraction

**Cost estimate:** $5-49/month for 1,500-15,000 profiles/month (50/day × 30 = 1,500)

### Option B: ScrapeCreators API

**Endpoints:**
- `POST /tiktok/search` — search by hashtag/keyword
- `GET /tiktok/profile/:username` — get profile data including bio
- `GET /instagram/profile/:username` — Instagram bio

**Pricing:** Free trial available, then usage-based

### Option C: Direct Scraping (Free, Complex)

```typescript
// Scrape TikTok user page for bio email
async function scrapeTikTokBio(username: string): Promise<string | null> {
  const res = await fetch(`https://www.tiktok.com/@${username}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  const html = await res.text();
  
  // TikTok embeds user data in a JSON blob on the page
  const match = html.match(/"nickname":"([^"]+)","bio":"([^"]*)"/);
  if (match) {
    const bio = match[2].replace(/\\n/g, ' ').replace(/\\"/g, '"');
    const emailMatch = bio.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return emailMatch ? emailMatch[1].toLowerCase() : null;
  }
  
  // Fallback: regex the entire page
  const text = html.replace(/<[^>]*>/g, ' ');
  const emails = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
  if (emails) {
    const valid = [...new Set(emails)].filter(e => 
      !e.includes('tiktok.com') && !e.includes('bytedance') && e.length < 50
    );
    return valid[0] || null;
  }
  
  return null;
}
```

**Risks:** IP blocking, CAPTCHA, rate limiting, frequent breakage

---

## 3. Discovery Strategy (What Hashtags, What Keywords)

### TikTok Hashtags (by creator type)

| Creator Type | Hashtags | Why |
|-------------|----------|-----|
| Small UGC creators | #ugccreator, #smallcreator, #newcreator, #contentcreatortips | Looking for brand deals |
| Music creators | #musictok, #musicmarketing, #songpromotion, #newmusic | Already make music content |
| Side hustle creators | #earnmoney, #sidehustle, #makemoneyonline, #creatorincome | Money-motivated |
| Dance/challenge | #dancechallenge, #trendingaudio, #viralchallenge | Already make challenge content |
| General creators | #contentcreator, #creatoreconomy, #socialmediatips | Broad appeal |

### Instagram Hashtags

| Category | Hashtags |
|----------|----------|
| Creators | #contentcreator, #ugccontent, #branddeal, #microinfluencer |
| Music | #musicreview, #newmusic, #songoftheday |
| Reels creators | #reelstips, #instagramreels, #viralreel |

---

## 4. Email Outreach Content (Creator Version)

### Subject Line Options
- "Earn money making TikToks with music 🎵"
- "Your content → real payouts (no brand deals needed)"
- "You make TikToks. We pay per view."

### Email Body (DeepSeek-generated, founder voice)

Key points to communicate:
1. We saw your content on TikTok/Instagram
2. Selah.fm pays creators for making TikToks/Reels with music
3. No brand deals, no minimum followers, no application
4. Browse campaigns, pick a track, make a video, earn per view
5. Link to browse page or specific campaigns

### DeepSeek Prompt (adapted from artist version)

```
You are Robert-Jan Mastenbroek, founder of Selah.fm — a CPM marketplace where creators earn per verified view for TikToks, Reels, and Shorts featuring music.

YOUR VOICE: Warm, direct, a little rough around the edges. Like a friend who's been through hell and came out the other side. Use contractions ALWAYS. Start sentences with And/But/So/Because/Look/Here's. Vary sentence length. Never use: furthermore, moreover, game-changer, revolutionary, leverage, empower.

TASK: Write a short, personal email to a content creator inviting them to earn money on Selah.fm.

RULES:
- Under 120 words total
- Mention their content style (from their bio/captions)
- Explain: browse campaigns → pick a track → make video → earn per view
- No application, no minimum followers, no brand deals
- Include link to browse campaigns
- Sign as: — Robert-Jan (founder, Selah.fm)
- Return ONLY the email text
```

---

## 5. What We Already Have (Reusable)

| Component | File | Status |
|-----------|------|--------|
| Email scraping from Instagram bios | `lib/outreach.ts` → `scrapeBandcampEmail()` | Already works, needs TikTok adaptation |
| Email verification (MX + disposable) | `lib/email-verify.ts` | ✅ Ready |
| Email sending (Resend) | `lib/email-outreach.ts` | ✅ Ready |
| DeepSeek generation | `lib/email-outreach.ts` → `generateOutreachEmail()` | Needs creator prompt variant |
| Database tables | `discovered_artists`, `artist_audits` | Need `discovered_creators`, `creator_audits` |
| Pipeline cron pattern | `app/api/cron/outreach-pipeline/route.ts` | Reusable pattern |
| Email cron | `app/api/cron/email-outreach/route.ts` | Reusable pattern |
| Admin dashboard | `app/admin/outreach/` | Need creator tab/panel |
| Rate limiting / dedup | Existing `ON CONFLICT DO NOTHING` | Reusable |

---

## 6. Database Schema (New Tables)

```sql
CREATE TABLE discovered_creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram')),
    display_name TEXT,
    bio TEXT,
    follower_count INTEGER,
    video_count INTEGER,
    niche TEXT,
    profile_url TEXT,
    email_address TEXT,
    email_source TEXT, -- 'bio', 'linktree', 'website'
    email_confidence TEXT DEFAULT 'low' CHECK (email_confidence IN ('verified','high','medium','low','guess')),
    status TEXT DEFAULT 'discovered' CHECK (status IN ('discovered','emailed','replied','declined','duplicate')),
    metadata JSONB DEFAULT '{}',
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creator_outreach_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discovered_creator_id UUID REFERENCES discovered_creators(id),
    channel TEXT DEFAULT 'email' CHECK (channel IN ('email')),
    message_text TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','bounced','replied')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Implementation Plan

### Phase 1: Research & Setup (1-2 hours)
- [ ] Evaluate Apify free tier vs ScrapeCreators vs direct scraping
- [ ] Test TikTok search API with one hashtag
- [ ] Test TikTok bio scraping with 10 profiles
- [ ] Measure email hit rate (% of creators with email in bio)

### Phase 2: Build Discovery Module (2-3 hours)
- [ ] Create `lib/creator-discovery.ts`
- [ ] Implement TikTok hashtag search (Apify or direct)
- [ ] Implement TikTok bio scraping + email extraction
- [ ] Implement Instagram bio scraping (adapt from existing)
- [ ] Add MX verification + dedup

### Phase 3: Database & API (1-2 hours)
- [ ] Create `discovered_creators` + `creator_outreach_log` tables
- [ ] Add API actions: discover_creators, get_creator_queue, send_creator_email
- [ ] Add cron endpoint for automated creator pipeline

### Phase 4: Email Content (1 hour)
- [ ] Create creator email prompt for DeepSeek
- [ ] Add template fallback
- [ ] Test email rendering

### Phase 5: Admin Dashboard (1-2 hours)
- [ ] Add creator tab to outreach dashboard
- [ ] Creator discovery + email buttons
- [ ] Stats tracking

### Phase 6: Scale & Automate (1 hour)
- [ ] Set up Railway cron (every 30 min, offset from artist pipeline)
- [ ] Monitor email delivery and bounce rates
- [ ] Optimize hashtag rotation

---

## 8. Cost Estimate

| Component | Free | Paid | Recommendation |
|-----------|------|------|----------------|
| Apify TikTok scraper | 100 profiles/month | $5-49/mo for 5K-50K | Start free, scale to $5/mo |
| ScrapeCreators | Trial | Pay-per-use | Backup option |
| Direct scraping | $0 | Proxy costs ~$10/mo | Fallback if APIs fail |
| Resend | 100 emails/day | $20/mo for 1K | Already using free tier |
| **Total monthly** | $0 (free tiers) | $15-25 (scaled) | |

---

## 9. Key Differences: Artist Pipeline vs Creator Pipeline

| Aspect | Artist Pipeline | Creator Pipeline |
|--------|----------------|-----------------|
| Discovery source | Bandcamp API, Reddit, YouTube | TikTok hashtags, Instagram |
| What we find | Music on Bandcamp | Content creators on TikTok/IG |
| Key data | Track, genre, cover art, social links | Username, bio, followers, niche |
| How we get email | Scrape Bandcamp, Instagram, websites, Google | Extract from TikTok/IG bio, Linktree |
| Email content | "We built a campaign for your track" | "Earn money making TikToks with music" |
| Campaign needed | Yes (auto-created) | No (they browse existing) |
| Conversion goal | Claim campaign → fund → share | Browse campaigns → submit video → earn |

---

## 10. Next Steps (Immediate)

1. **Set up Apify free account** and test TikTok email scraper
2. **Run a test batch** of 10-20 creators to measure email hit rate
3. **If hit rate >20%**, proceed with full implementation
4. **If hit rate <20%**, evaluate other discovery methods or accept lower volume
5. **Create database tables** — same pattern as artist tables
6. **Build the pipeline** — adapt existing cron patterns
