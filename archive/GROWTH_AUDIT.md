<!--
================================================================================
ARCHIVED — See SELAH.md for current source of truth.

This file is preserved for historical reference only. All actionable content
has been consolidated into SELAH.md (the living document).
================================================================================
-->

# Selah.fm — Automated Growth Audit

**Date:** June 2, 2026
**Current state:** 16 users, $35 deposited, $2.08 paid, 17 blog posts, 2,500+ auto-created campaigns
**Goal:** Automated user acquisition at scale — both artists and creators

---

## What's Already Running

| Channel | Status | Output | Notes |
|---------|--------|--------|-------|
| Artist discovery pipeline | ✅ Auto (cron, 8x/day) | ~1,900–4,800 discoveries/run, ~96 verified emails/day | Bandcamp + Reddit + YouTube sources |
| Creator discovery pipeline | ✅ Auto (cron, 2x/day) | 13 creators/run | TikTok/IG sourced |
| Email outreach (artists) | ✅ Auto (cron, 4x/day) | ~50 emails/run, MX-verified | Resend, personalized via DeepSeek |
| Email outreach (creators) | ✅ Auto (cron, 2x/day) | ~13 emails/run | Resend |
| Welcome email sequence | ✅ Auto (3 emails over 5 days) | Triggered on onboarding | Artist + creator variants |
| Re-engagement emails | ✅ Auto (14-day cycle) | Triggered on inactivity | |
| Blog pipeline (SEO) | ✅ Auto (1-2 posts/day) | 17 published, dual schema (Article+QAPage) | Questions sourced from Reddit + AI pool |
| Facebook OG scraping | ✅ Auto (on campaign create) | Scrapes every new campaign URL | |
| UTM tracking | ✅ Auto | Page views, sources, mediums, campaigns tracked | Infrastructure ready |
| Instagram DM automation | ✅ Route exists | Admin endpoint for sending DMs | Not scheduled on cron |
| Outreach follow-up | ✅ Cron scheduled (hour 10) | Follow-up emails | |

---

## The Gap Analysis

The current engine is entirely **push-based** — we discover artists, build their campaign, email them, and hope they engage. There are zero **pull-based** channels bringing users to the platform organically. The only organic channel is the SEO blog (17 posts, ramping up).

For a two-sided marketplace, you need BOTH:
- **Supply** (artists with campaigns) → push engine handles this well
- **Demand** (creators looking to earn) → almost no organic pull

The biggest gap is on the **creator/demand side**. We have 2,500+ campaigns with zero budget and zero creator engagement because nobody knows the platform exists.

---

## Prioritized Acquisition Channels

### Tier 1: High Impact, Low Effort — Build This Week

#### 1. Programmatic SEO at 100× Scale
**Effort:** 2-3 days
**Impact:** Massively compounds over 3-6 months
**Why it works:** Every campaign page already exists at `/c/[slug]`. These pages are server-rendered, SEO-optimized, and have unique content (track title, artist name, CPM rate, requirements). Currently Google may not index them because they're orphaned.

**What to build:**
- **Pagination/index pages** at `/browse?page=1` through `/browse?page=100` — each with unique meta titles, descriptions, and canonical URLs. "Browse music promotion campaigns on Selah.fm — Page 7 | Indie, Pop, Electronic"
- **Genre landing pages** at `/browse/genre/indie`, `/browse/genre/hip-hop`, `/browse/genre/electronic` — static, server-rendered, with h1/h2 content about promoting that genre
- **Sitemap index** splitting into `/sitemap-campaigns.xml`, `/sitemap-blog.xml`, `/sitemap-static.xml` — submit to Google Search Console
- **Internal linking** between campaign pages, genre pages, and blog posts (automated: every campaign page links to 3 related blog posts, every blog post links to 3 related campaigns)

**Estimated organic traffic at scale (3-6 months):** 500-2,000 visits/day from long-tail search queries like "[artist name] music promotion", "promote [track name]", "indie music promotion campaign"

#### 2. Embed Widget — Free Distribution on Every Artist's Site
**Effort:** 1-2 days
**Impact:** Every campaign page becomes a distribution node
**What to build:**
- Campaign embed `<iframe>` snippet that shows: cover art, track name, CPM, "Submit a video" button
- Auto-generated for every campaign: `selah.fm/c/[slug]/embed.js`
- Artists paste into their Linktree/Bio.link/Site → free backlinks + creator traffic
- Bonus: Embed shows a "Powered by Selah.fm" link → SEO backlinks from hundreds of artist sites

**Estimated reach:** If even 5% of 2,500 artists embed → 125 backlinks from music artist sites, passive creator discovery

#### 3. Auto-Syndicate Blog to Reddit + Medium + Dev.to
**Effort:** 1 day
**Impact:** Immediate traffic from existing communities
**What to build:**
- On blog post publish → auto-post to relevant subreddits (r/WeAreTheMusicMakers, r/musicmarketing, r/indiemusic, r/LofiHipHop, r/edmproduction)
- Cron job: every 2 hours, check for new published posts → post to 3 relevant subreddits (rotate to avoid spam)
- Also cross-post to Medium publication and Dev.to for SEO backlinks
- Use DeepSeek to generate subreddit-specific titles and excerpt text

**Estimated traffic:** 200-500 visits per good Reddit post. Music marketing subreddits have 2M+ combined subscribers.

#### 4. Referral Loop Overhaul
**Effort:** 2 days
**Impact:** Compound growth if viral coefficient > 1
**Current:** 5% bonus on first deposit. Not promoted. Zero usage.
**What to change:**
- **Artist → Artist:** "Invite 3 artists → get $10 campaign credit" (instant, no deposit needed)
- **Creator → Creator:** "Invite 3 creators → get priority access to new campaigns"
- **Both:** After campaign creation or first submission → full-screen share prompt with WhatsApp/Twitter/IG deep links
- **Gamification:** Show "You've invited X artists — Y have joined" in dashboard
- **Auto-DM:** On signup, check if referrer exists → auto-credit both parties

#### 5. Creator Earnings Showcase (Social Proof Engine)
**Effort:** 1-2 days
**Impact:** Solves the cold-start problem for creators
**What to build:**
- Public leaderboard at `/earnings` — "Top creators this week" with earnings amounts (even if simulated with "What you could earn" scenarios)
- Auto-generated "Just earned!" tweets/posts when a creator hits a milestone
- Embeddable earnings badges for creator profiles: "I earn with Selah.fm 🎵"
- This is what Epidemic Sound does well and what drives their creator growth

---

### Tier 2: Medium Impact, Medium Effort — Build This Month

#### 6. Instagram Content Automation
**Effort:** 3-4 days
**Impact:** Builds brand presence + passive discovery
**Already documented** in MARKETING.md — just needs implementation:
- Campaign spotlight posts (2/day): cover art + CPM + "Submit a video" CTA
- Music promotion economics carousels (3/week): AI-generated from blog content
- Pipeline milestone announcements (1/week): "2,500 campaigns live!"
- Meta Graph API posting already partially built (`app/api/admin/outreach/instagram/route.ts`)

#### 7. Automated Reddit Monitoring + Answering
**Effort:** 2-3 days
**Impact:** Steady drip of targeted traffic
**What to build:**
- Monitor r/musicmarketing, r/WeAreTheMusicMakers, r/indiemusic for questions about promotion
- Use DeepSeek to match question → existing blog post → post answer with link
- Cron job: every 30 minutes, check Reddit API for new posts matching keywords ("promote my music", "how to get more streams", "CPM", "TikTok promotion")
- Auto-answer with relevant blog post URL
- Stay below spam threshold: max 3 answers/day, varied subreddits

#### 8. Spotify API Integration — Auto-Create Campaigns
**Effort:** 3-4 days
**Impact:** Removes friction for artists
**What to build:**
- "Connect your Spotify artist profile" button
- Spotify OAuth → fetch artist name, monthly listeners, top tracks, genres, cover art
- Auto-create campaign page with all data pre-filled
- Artist just adds CPM rate and budget → campaign is live
- This is what SubmitHub/Groover do well — they make it ONE click from Spotify data
- Massive conversion lift because the artist sees "We already know your music"

#### 9. Open Source Community + GitHub Distribution
**Effort:** 1-2 days
**Impact:** Developer-adjacent traffic + contributor acquisition
**What to build:**
- Proper GitHub README with demo GIF, features list, "Built with" badges
- GitHub Pages site at `selah.fm` → GitHub stars create SEO ranking
- Automated "Built with Selah.fm" badge on GitHub repos
- Hacker News launch post (one-time lift, but sustainable via open source cred)

#### 10. Newsletter Growth Engine + Lead Magnets
**Effort:** 2-3 days
**Impact:** Email list growth → retargeting → conversions
**What to build:**
- Lead magnets: "Free CPM Calculator", "Music Promotion Budget Template", "TikTok Algorithm Cheat Sheet" — all gate behind email
- Popup/subscribe box on blog posts and tools pages
- Automated 5-email nurture sequence for newsletter subscribers (separate from welcome sequence)
- Weekly digest email: "New campaigns this week", "Top earning creators", "Latest blog posts"

---

### Tier 3: Lower Impact / Higher Effort — Build When Ready

| Channel | Effort | Why Lower Priority |
|---------|--------|-------------------|
| Pinterest auto-pinning | 2 days | Niche traffic, low conversion to signups |
| YouTube content repurposing | 3-5 days | High effort for video production; better to hire |
| TikTok organic automation | 3-5 days | Platform restricts API posting; moderate risk |
| Paid ads (Google/FB/TT) | Ongoing cost | Only efficient after product-market fit is proven |
| DistroKid/TuneCore/CD Baby integration | 5-10 days | Requires partnerships, not pure automation |
| Multi-language SEO | 5-7 days | Good for scale but premature at 16 users |
| Discord community bot | 3-5 days | Requires community to exist first |
| AI-generated video testimonials | 3-4 days | Legal gray area; better to wait for real testimonials |

---

## Recommended Execution Order

### Week 1 (June 2-8)
1. **Embed widget** (1 day) — quickest win, zero maintenance
2. **Programmatic SEO: genre pages + sitemap split** (2 days) — compounds over months
3. **Reddit auto-syndicate blog posts** (1 day) — immediate traffic

### Week 2 (June 9-15)
4. **Referral loop overhaul** (2 days) — compound growth mechanic
5. **Creator earnings showcase** (1-2 days) — social proof for demand side
6. **Reddit monitoring + auto-answer** (2-3 days) — targeted traffic

### Week 3 (June 16-22)
7. **Instagram content automation** (3-4 days) — brand + passive discovery
8. **Spotify API integration** (3-4 days) — frictionless campaign creation

### Week 4 (June 23-30)
9. **Newsletter growth engine** (2-3 days) — retargeting infrastructure
10. **Open source GitHub polish** (1 day) — developer community

---

## Key Metrics to Track

| Metric | Current | Week 1 Target | Month 1 Target |
|--------|---------|--------------|----------------|
| Organic search visits/day | ? | 50 | 500 |
| Blog-indexed pages | 17 | 30 | 60 |
| Campaign pages indexed | ~0 | 500 | 2,500 |
| Embed widgets installed | 0 | 10 | 100 |
| Reddit referral clicks/day | 0 | 50 | 200 |
| Newsletter subscribers | 0 | 100 | 500 |
| Referral-generated signups | 0 | 5 | 50 |
| Instagram followers | 0 | 100 | 1,000 |
| Total users | 16 | 50 | 200 |

---

## What NOT to Do (Yet)

- **Paid ads** — 16 users isn't enough to optimize ad creative. Wait for 200+ users and real conversion data.
- **TikTok automation** — Platform aggressively bans automated posting. Manual reels scale better.
- **YouTube automation** — High production effort for low initial return. Repurpose blog → script → voiceover when traffic justifies it.
- **Multi-language** — English SEO alone can drive 10× current traffic before needing translation.
- **PR automation** — HARO/journalist outreach is better done manually for initial press hits.
