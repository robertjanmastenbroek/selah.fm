# Selah.fm — Status & Reference
**Version:** 1.0 · **Live:** https://selah.fm · **Updated:** 2026-05-12

---

## Current Focus: Outbound Artist Marketing Automation

**Goal:** 100 artists/day claiming auto-generated campaigns.

**Pipeline:** FIND → AUDIT → BUILD → OUTREACH → CLAIM → SHARE

| Phase | Status |
|-------|--------|
| 1. DB migration + API (discovered_artists, artist_audits, outreach_log, campaign_claims) | 📋 Planned |
| 2. Discovery Agent (Spotify API, YouTube API) | 📋 Planned |
| 3. Campaign Builder (auto-create campaigns, rich media, share-optimized) | 📋 Planned |
| 4. Outreach + Claim (Instagram DM, Spotify OAuth, /admin/outreach dashboard) | 📋 Planned |

---

## What's Live

### Core Platform
| Area | Status |
|------|--------|
| Campaign creation → checkout → funding | ✅ |
| CPM-based creator marketplace | ✅ |
| Stripe Elements (deposits + donations) | ✅ |
| Webhook processing + referral auto-credit | ✅ |
| Creator submissions with platform verification | ✅ |
| Artist review + approve/reject with 4s undo | ✅ |
| Stripe Connect payouts (80/20 split) | ✅ |
| Campaign detail page (60/40 split, LiveTicker, MediaCarousel, Share) | ✅ |
| Browse page with search-as-you-type | ✅ |
| Artist + Creator profiles | ✅ |
| Dashboard with campaign management | ✅ |
| Settings + dual-role system | ✅ |
| SEO: JSON-LD, OG/Twitter, canonical, sitemap | ✅ |
| Google Analytics: server-side Measurement Protocol | ✅ |
| 55+ API routes · 44 E2E tests · Zero TypeScript errors | ✅ |

### Blog System
| Area | Status |
|------|--------|
| DeepSeek article generation (founder voice + anti-AI guardrails) | ✅ |
| 1 published post (Worlds Collide founder story) | ✅ |
| Blog post page + listing + footer link | ✅ |
| Interview Studio (52 topics, voice input) | ✅ |
| Voice library: 220 chunks | ✅ |
| Content Hub + Generate from Voice pipeline | ✅ |
| Question dedup system (never answer the same question twice) | ✅ |
| Auto-schedule (1 post/day, next-available-day logic) | ✅ |
| Batch generation (select multiple questions, generate all) | ✅ |
| Source real questions from Reddit (rotating sort orders) | ✅ |
| Blog post editor (preview → edit → publish/schedule) | ✅ |

### Interactive SEO Tools
| Area | Status |
|------|--------|
| CPM Calculator | ✅ |
| Creator Earnings Estimator | ✅ |
| Promotion Budget Planner | ✅ |

### Known Issues
| Issue | Status |
|-------|--------|
| Inbound email (Resend webhook → admin inbox) | ⚠️ Endpoint ready, needs subdomain DNS |
| View verification automation | 📋 Planned |

### Database
- 1 live campaign (Merhav Yah)
- 1 published blog post
- Voice library: 220 chunks
- Migrations: 001–011 applied

---

## Testing

```bash
npx tsc --noEmit     # zero errors
node e2e/test.js     # 44 tests, 100% passing
```
