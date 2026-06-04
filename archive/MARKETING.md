<!--
================================================================================
ARCHIVED — See SELAH.md for current source of truth.

This file is preserved for historical reference only. All actionable content
has been consolidated into SELAH.md (the living document).
================================================================================
-->

# Selah.fm — Marketing Strategy

**Goal:** 100 emails/day to verified artists + automated Instagram content
**Status:** Email pipeline fully autonomous (67 verified, 58 sent). Instagram content system ready for implementation.
**Updated:** 2026-05-16

---

## Channel 1: Email Outreach (PRIMARY — Fully Autonomous)

### The Core Loop

```
DISCOVER (Bandcamp API + Reddit + YouTube)
  → AUDIT (scrape email from 6 sources)
  → BUILD (auto-create campaign page)
  → EMAIL (DeepSeek-generated personal email via Resend)
  → AUDIENCE (sync to Resend marketing list)
```

### Volume & Capacity

| Metric | Current | Target |
|--------|---------|--------|
| Daily discoveries | 1,900–4,800 | 5,000 (48 runs × ~100) |
| Daily audits | 9,600 | 9,600 (48 runs × 200) |
| Verified emails/day (2% hit rate) | ~96 | ~100 |
| Emails sent/day | 144 capacity | 100 (Resend free tier) |
| Bounce rate | <2% (verified-only, MX check) | <2% |

### Email Scraping Sources

| Source | Method | Confidence | Hit Rate |
|--------|--------|------------|----------|
| Bandcamp page text | Regex email from HTML body | verified | ~1% |
| Artist personal website | Follow link from Bandcamp → scrape | verified | ~0.3% |
| Instagram bio | Scrape `instagram.com/{handle}` | verified | ~0.2% |
| SoundCloud profile | `soundcloud.com/{subdomain}` | verified | ~0.1% |
| Twitter/X bio | `x.com/{subdomain}` | verified | ~0.1% |
| Google search | `"{artist}" email contact` | medium | ~0.3% |

### Email Verification Layers

1. **Syntax validation** — RFC 5322 regex
2. **Disposable domain filter** — 35+ known burner domains
3. **MX record check** — DNS lookup for mail server existence
4. **Confidence gating** — only `verified` or `high` confidence auto-send
5. **Resend webhook** — auto-marks bounced emails, blocks retry

### Cron Schedule (Railway)

| Job | URL | Schedule | Does |
|-----|-----|----------|------|
| Pipeline | `/api/cron/outreach-pipeline?secret=...` | Every 30 min | Discover 100 + audit 200 + create campaigns + enrich links |
| Email | `/api/cron/email-outreach?secret=...` | Every 30 min (offset 5) | Verify + send 3 emails + sync to Resend audience |

### Resend Audience

All delivered emails are synced to a Resend audience (`RESEND_AUDIENCE_ID`). This builds a marketing list for:
- Product newsletters
- Feature announcements
- Campaign re-engagement
- No-code email blasts from Resend dashboard

---

## Channel 2: Instagram Content (PLANNED — Requires Setup)

### Why Instagram

Musicians and creators live on Instagram. It's where they discover new tools, share their work, and DM each other. Our audience is there. We need to be there too — not with ads, but with valuable content they want to save and share.

### Content Strategy (Phase 1 — Informational/Educational)

Since we don't have creator earnings or platform stats yet, we lead with educational content that positions Selah.fm as the authority on music promotion economics.

### Content Pillars

| Pillar | Example Topics | Format | Frequency |
|--------|---------------|--------|-----------|
| **Music Promotion Economics** | "What 1,000 views actually costs on each platform", "CPM rates explained", "Why ads don't work for music" | Carousel (5-7 slides) | 3×/week |
| **Artist Spotlights** | Campaign page showcase — cover art, track, CPM rate, "Submit a video" CTA | Single image + carousel | 2×/day |
| **Behind the Build** | Screenshots of new features, pipeline stats, growth milestones | Single image + story | 1×/week |
| **Founder Voice** | Robert-Jan's story, why he built this, open source philosophy | Reel (30-60s) | 1×/week |
| **Music Industry Truths** | "Record labels take 98%", "Playlist bots don't create fans", "Why independent is the future" | Carousel + Reel | 2×/week |

### Content Calendar (Weekly Template)

| Day | Post 1 | Post 2 |
|-----|--------|--------|
| Mon | Music Promotion Economics (carousel) | Artist Spotlight |
| Tue | Artist Spotlight | Industry Truth (carousel) |
| Wed | Music Promotion Economics (carousel) | Artist Spotlight |
| Thu | Artist Spotlight | Founder Reel |
| Fri | Behind the Build | Artist Spotlight |
| Sat | Industry Truth (carousel) | Artist Spotlight |
| Sun | Music Promotion Economics (carousel) | Community post (questions/polls) |

### Automatable Content

| Content Type | Source | Automation |
|-------------|--------|------------|
| Artist Spotlight | New campaign created → cover art + CPM + track name | Fully auto (image gen + caption via DeepSeek) |
| Pipeline Milestone | DB stats hit threshold | Auto-post with stats |
| "Track of the day" | Random campaign with good cover art | Fully auto |

### Non-Automatable (Human-Created)

| Content Type | Creator | Frequency |
|-------------|---------|-----------|
| Founder Reels | Robert-Jan | 1×/week |
| Music Economics Carousels | Content designer or AI-assisted | 3×/week |
| Industry Truths | Robert-Jan or AI-assisted | 2×/week |

### Technical Requirements

- Instagram Business or Creator account connected to Facebook Page
- Meta App with `instagram_content_publish` and `instagram_basic` permissions
- Access token with `pages_show_list`, `instagram_basic`, `instagram_content_publish` scopes
- `FACEBOOK_ACCESS_TOKEN` already configured in Railway (may need scope review)

### Posting API

```
POST https://graph.facebook.com/v18.0/{ig_user_id}/media
{
  "image_url": "https://selah.fm/images/campaigns/campaign-xxx.jpg",
  "caption": "Track: {name}\nCPM: $1.00/1K views\n\nSubmit a video and earn → link in bio"
}

POST https://graph.facebook.com/v18.0/{ig_user_id}/media_publish
{
  "creation_id": "{id_from_above}"
}
```

### Implementation Plan

1. Verify Facebook access token has Instagram scopes
2. Create `lib/instagram.ts` — image generation + posting functions
3. Create `app/api/cron/instagram-content/route.ts` — scheduled posting
4. Test with one manual post via API
5. Enable automated campaign spotlights (2/day)
6. Add pipeline milestones (1/week)
7. Scale to full content calendar

---

## Channel 3: SEO (Passive — Already Built)

### Live Pages Driving Organic Traffic

| Page | Target Keywords |
|------|----------------|
| `/` | music promotion marketplace, CPM marketplace |
| `/browse` | browse music campaigns, earn making TikToks |
| `/c/[slug]` | [artist] [track] campaign, earn per view |
| `/tools/cpm-calculator` | CPM calculator, music promotion cost |
| `/tools/creator-earnings` | creator earnings estimator, TikTok earnings |
| `/tools/promotion-budget` | music promotion budget planner |
| `/blog` | music promotion tips, creator insights |
| `/faq` | music promotion FAQ, how does Selah work |
| `/open-source` | open source music promotion, MIT licensed |
| `/welcome-artists` | promote your music, artist marketing |
| `/welcome-creators` | earn as creator, content creator earnings |

---

## Channel 4: Referral (Built, Not Yet Promoted)

- Referral codes stored in `referrals` table
- Both referrer and referred get 5% bonus on first deposit
- Shareable link: `https://selah.fm/login?ref={code}`
- Not actively promoted yet — activate after product-market fit

---

## Key Metrics Tracker

| Metric | May 14 | May 16 | Goal (June) |
|--------|--------|--------|-------------|
| Verified emails | 0 | 67 | 500 |
| Emails sent | 0 | 111 | 3,000 |
| Campaigns live | 54 | 1,238 | 5,000 |
| Instagram followers | 0 | 0 | 1,000 |
| Instagram posts | 0 | 0 | 60 |
| Organic signups/day | ? | ? | 10 |
| Claimed campaigns | ? | ? | 50 |
