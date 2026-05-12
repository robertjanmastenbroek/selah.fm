# Selah.fm — Status & Reference
**Version:** 1.0 · **Live:** https://selah.fm · **Updated:** 2026-05-12

---

## Current Focus: Outbound Artist Marketing Automation

**Goal:** 100 artists/day claiming auto-generated campaigns.

**Pipeline:** FIND → AUDIT → BUILD → OUTREACH → CLAIM → SHARE

| Phase | Status |
|-------|--------|
| 1. DB migration (012_outreach_pipeline) | ✅ Applied to production |
| 2. lib/outreach.ts (Spotify auth, discovery, audit, AI detection, outreach templates) | ✅ Built |
| 3. API routes (discover, audit, create_campaign, render_outreach, log_outreach) | ✅ Built |
| 4. Admin dashboard (/admin/outreach) with pipeline stats + action buttons | ✅ Built |
| 5. Autonomous cron endpoint (/api/cron/outreach-pipeline) — fully self-running | ✅ Built |
| 6. Claim page (/claim/[code]) + ClaimButton + /api/claim | ✅ Built |
| 7. Outreach template (personalized, copy-to-clipboard, Instagram DM ready) | ✅ Built |
| 8. Spotify API verified working (genre search, artist lookup, top tracks) | ✅ Tested |
| ⚠️ Next: Verify discovery returns artists (playlist API 403 → switched to genre search) | 🔍 Debugging |

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

### Recent Changes (May 11–12)
| Change | Status |
|--------|--------|
| Campaign copy: "EARN" → "JOIN" (all CTA buttons, EarnModal, SEO metadata) | ✅ |
| Outreach pipeline: DB, API, dashboard, cron, claim page | ✅ |

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
