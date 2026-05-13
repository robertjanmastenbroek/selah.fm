# Selah.fm — Status & Reference
**Version:** 1.1 · **Live:** https://selah.fm · **Updated:** 2026-05-13

---

## Current Focus: Outbound Artist Marketing Pipeline

**Goal:** 50 artists/day reached via Instagram/TikTok DM.

**Pipeline:** FIND → AUDIT → BUILD → OUTREACH → CLAIM → SHARE

```
Bandcamp API → discovered_artists → artist_audits (YT + social) → campaigns ($0, unclaimed) → DM message → claim
```

| Phase | Status |
|-------|--------|
| 1. DB migration (012_outreach_pipeline) — 4 tables | ✅ Applied to production |
| 2. lib/discovery.ts — multi-channel (Bandcamp API + Reddit + YouTube) | ✅ Spotify-free |
| 3. lib/outreach.ts — audit (YouTube + social scraping) + AI outreach messages | ✅ Built |
| 4. API routes: discover, audit, create_campaign, render_outreach, render_follow_up, log_outreach, get_outreach_queue | ✅ Built |
| 5. Admin dashboard (/admin/outreach) — pipeline stats, artist cards, one-click DM queue | ✅ Built |
| 6. Autonomous cron endpoint (/api/cron/outreach-pipeline) — discover→audit→campaign | ✅ Built |
| 7. Railway cron: 02:00 + 14:00 UTC pipeline, 18:00 UTC follow-up | ✅ Configured |
| 8. Claim page (/claim/[code]) + ClaimButton | ✅ Built |
| 9. AI-powered outreach messages (DeepSeek API, founder voice, genre-specific) | ✅ Built |
| 10. Fallback outreach templates (8 genres, anti-spam patterns) | ✅ Built |
| 11. Instagram DM one-click flow (copies message + opens ig.me/m/{handle}) | ✅ Built |
| 12. TikTok DM one-click flow (opens tiktok.com/@{handle}) | ✅ Built |
| 13. Social link discovery (scrapes Bandcamp artist pages for IG/TikTok handles) | ✅ Built |
| 14. Campaign page unclaimed state (gift-like UX, pre-set donations, FOMO, share messages) | ✅ Built |
| 15. Follow-up system (Day-7 cron + admin action + social proof injection) | ✅ Built |
| 16. Pin system (admin toggle, browse sort priority, "more campaigns" priority) | ✅ Built |
| 17. Browse sort algorithm (pinned → budget utilization % → total funding → date) | ✅ Live |
| 18. Stats API: totalDonatedCents + totalDepositedCents → homepage trust bar | ✅ Live |
| 19. Security: CRON_SECRET rotated, git history cleaned, pre-commit hook installed | ✅ Done |

---

## Pipeline Database (Production)

| Table | Rows | Notes |
|-------|------|-------|
| discovered_artists | 369 | From Bandcamp API (10 genres × 48 items) |
| artist_audits | 15 | YouTube video search + social scraping |
| campaigns (unclaimed) | 10 | $0 budget, artist-name-track-name slug |
| campaign_claims | 10 | UUID claim codes generated |
| Ready for outreach | 10 | Campaigns created, not yet messaged |

---

## Design System

- **Style:** Dark Mode (OLED) — UI/UX Pro Max v2.5.0
- **Colors:** Primary `#4338CA` (indigo), Accent `#22C55E` (green), Background `#0F0F23` (deep navy)
- **Fonts:** Righteous (headings) + Poppins (body) via `next/font/google`
- **34 files** batch-updated with new color palette
- Design system documentation: `design-system/selah.fm/MASTER.md` + page-specific files

---

## What's Live

### Core Platform
| Area | Status |
|------|--------|
| Campaign creation → checkout → funding (Stripe Elements) | ✅ |
| CPM-based creator marketplace | ✅ |
| Webhook processing + referral auto-credit | ✅ |
| Creator submissions with platform verification | ✅ |
| Artist review + approve/reject with 4s undo | ✅ |
| Stripe Connect payouts (80/20 split) | ✅ |
| Campaign detail page (60/40 split, LiveTicker, MediaCarousel, Share) | ✅ |
| Browse page with search-as-you-type | ✅ |
| Artist + Creator profiles | ✅ |
| Dashboard with campaign management | ✅ |
| Settings + dual-role system | ✅ |
| SEO: JSON-LD, OG/Twitter, canonical, sitemap (25 pages) | ✅ |
| Google Analytics: server-side Measurement Protocol | ✅ |
| 55+ API routes · 44 E2E tests · Zero TypeScript errors | ✅ |
| Homepage trust bar: campaigns · artists · creators · funded · paid | ✅ |

### Blog System
| Area | Status |
|------|--------|
| DeepSeek article generation (founder voice + anti-AI guardrails) | ✅ |
| 1 published post (Worlds Collide founder story) | ✅ |
| Blog post page + listing + footer link | ✅ |
| Interview Studio (52 topics, voice input) | ✅ |
| Voice library: 220 chunks | ✅ |
| Content Hub + Generate from Voice pipeline | ✅ |
| Question dedup system | ✅ |
| Auto-schedule (1 post/day) | ✅ |
| Batch generation + Reddit question sourcing | ✅ |

### Interactive SEO Tools
| Area | Status |
|------|--------|
| CPM Calculator | ✅ |
| Creator Earnings Estimator | ✅ |
| Promotion Budget Planner | ✅ |

---

## Key Architecture Decisions

- **Spotify removed entirely** — Bandcamp API provides artist name, track title, cover art, genre, and band URL. Spotify added nothing but rate limits (Railway IP was blocked).
- **AI-powered outreach messages** — DeepSeek API generates unique messages per artist matching the founder's voice (same engine as blog system). Anti-spam guardrails built in.
- **$0 budget for auto-generated campaigns** — No upfront cost. Artists can fund after claiming.
- **Instagram + TikTok DM** — One-click flow copies message and opens DM. No Meta API needed (cold DMs via API are against ToS anyway).
- **Pinned campaigns** — Admin can pin campaigns to top of browse + "more campaigns" sections.

---

## 2026-05-13 Session — DeepSeek V4 Refactor (10 files changed)

| Change | Files | Details |
|--------|-------|---------|
| OG image fix | `layout.tsx`, `browse/page.tsx`, `blog/page.tsx`, `welcome-artists/layout.tsx`, `welcome-creators/layout.tsx` | Root layout no longer forces OG images; each page sets its own. Instagram DMs now show campaign-specific images. |
| Outreach UI refactor | `admin/outreach/page.tsx` + 5 new component files | 550-line monolith → 234-line orchestrator + StatCard, ToastBar, ArtistCard, OutreachQueue, EmptyState. |
| Instagram-only gates | `api/admin/outreach/route.ts`, `api/cron/outreach-pipeline/route.ts`, `api/cron/outreach-followup/route.ts` | Campaigns only created for artists with Instagram handles. No IG = auto-declined at audit. All 3 pipeline phases gated. |
| Cumulative campaign count | `api/admin/outreach/route.ts` | `campaigns_created` stat now counts `campaign_claims` table (never decreases). |
| Dedup guards (API) | `api/admin/outreach/route.ts`, `api/cron/outreach-pipeline/route.ts` | Status checks, claim checks, DISTINCT ON in dashboard queries, proper discovery dedup. |
| Dedup guards (UI) | `admin/outreach/components/ArtistCard.tsx`, `OutreachQueue.tsx` | Global action lock, cross-component button lock (`dm-/outreach-` prefixes). |
| Homepage campaigns | `components/HomePageClient.tsx`, `api/campaigns/route.ts` | `limit=3→6`, `sort=popular→recent` (now respects sort param). |

## Immediate Next Steps

1. **Run outreach** — Click "Message" on ready artists in `/admin/outreach` (all have IG now)
2. **Monitor pipeline** — Railway cron runs 2× daily, fills with ~60 new artists/day
3. **Blog content** — Generate more posts from voice library to build SEO authority
4. **YouTube API key** — Set on Railway for automatic view verification on submissions
5. **Resend API key** — Set on Railway for email notifications

---

## Testing

```bash
npx tsc --noEmit     # zero errors
node e2e/test.js     # 44 tests, 100% passing
```
