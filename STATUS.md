# Selah.fm — Project Status

**Last updated:** June 4, 2026 (05:00 UTC)
**HEAD:** `f479241` — Final polish: Reviews tab label, share buttons verified
**Total commits:** 1,065
**Codebase:** ~105 React components · 100+ API routes · 24 pages · 20 DB migrations · 38 planning docs
**ROADMAP:** 34/36 items complete

---

## ✅ Everything Built Since Last STATUS Update (69 commits)

The last STATUS.md was written after the Growth Infrastructure session. Since then, four major workstreams have been fully built and deployed:

### Workstream 1: Bio Engine (Phase 0a) — June 3-4

**Goal:** Generate unique, SEO-optimized bios for 2,000+ artists with ~37 billion possible combinations.

| Component | Lines | Purpose |
|-----------|-------|---------|
| `lib/bio-angles.ts` | 36KB | Narrative angles (origin story, career pivot, genre innovation...) |
| `lib/bio-closings.ts` | 10KB | Closing hooks (CTA, call to action, follow prompt...) |
| `lib/bio-descriptors.ts` | 8KB | Descriptive vocabulary (sonic texture, genre fusion...) |
| `lib/bio-journeys.ts` | 11KB | Career journey templates (started in bedroom, label signing...) |
| `lib/bio-openings.ts` | 16KB | Opening hooks (genre-defying, viral sensation, underground icon...) |
| `lib/bio-scorer.ts` | 5KB | Scoring system to pick the best slot combination |
| `lib/bio-tone.ts` | 4KB | Tone profiles (professional, poetic, hype, understated) |
| `lib/bio-vocabulary.ts` | 3KB | Music vocabulary bank (words for genre, style, emotion) |
| `lib/artist-content.ts` | 170 | SEO description generator for artist meta tags |

**Architecture:** Composable multi-slot generation system — picks one opening + one angle + one journey + one descriptor + one closing + tone. Each artist gets a unique combination. Combined with artist-specific data (genre, location, track names, listeners), this produces unique bios that pass LLMO detection.

**Cron:** `app/api/cron/generate-artist-bios/route.ts` — processes 100 artists/night at 00:00 UTC via dispatcher.

**API:** `app/api/artist/bio/manual/route.ts` — manual trigger for ad-hoc generation.

### Workstream 2: Data Enrichment — June 3-4

**Goal:** Enrich all 2,000+ artist profiles with real data from external sources.

| Source | Cron | Frequency | Data Extracted |
|--------|------|-----------|----------------|
| **Wikipedia** | `app/api/cron/enrich-wikipedia/route.ts` | 100/night at 00:00 UTC | Summary, infobox data (genre, location, years active, labels) |
| **YouTube** | `app/api/cron/enrich-youtube/route.ts` | 100/night | Subscriber counts, channel data |
| **Bandcamp** | `app/api/cron/scrape-bandcamp/route.ts` | 100/night at 01:00 UTC | Track listings, album data, location, email addresses |
| **Track titles** | Data enrichment pipeline | Bulk | Track names from campaigns and artist profiles |
| **Career timeline** | Data enrichment pipeline | Bulk | Key career milestones from enriched data |
| **Genre inference** | Data enrichment pipeline | Bulk | Genre refinement from Wikipedia + Bandcamp data |

**Architecture:** `DATA_ENRICHMENT_PLAN.md` documents the full strategy. Each cron writes to `discovered_artists.metadata` JSONB column, keeping the schema flexible.

### Workstream 3: Track Pages + Entity Graph + Sitemap — June 4

**Phase 0b — Entity Graph (commit `f8c7672`):**
- Expanded internal linking engine (`lib/internal-links.ts`)
- Entity relationship mapping: artists ↔ tracks ↔ genres ↔ campaigns ↔ blog posts
- Generates 6+ contextual cross-links per page (up from 3)

**Phase 1 — Track Pages (commit `bfff09b`):**
| Feature | File | Purpose |
|---------|------|---------|
| Track detail page | `app/artist/[slug]/tracks/[id]/page.tsx` | Per-track SEO page with MusicGenre + MusicRecording schema |
| Track API | `app/api/artists/[slug]/tracks/[id]/route.ts` | GET individual track data |
| MusicGenre schema | Generated per track | Schema.org `MusicRecording` + `MusicGenre` markup |
| Dynamic sitemap priority | `app/sitemap.ts` | Refactored from flat sitemap to priority-weighted, lastmod-fixed |

**Phases 2-4 — Reviews, API, Share (commit `1217c39`):**
| Feature | File | Purpose |
|---------|------|---------|
| Fan reviews | `components/ReviewSection.tsx` | 5-star rating + text review on artist pages |
| Reviews API | `app/api/reviews/route.ts` | POST/GET reviews with pagination |
| Individual review API | `app/api/reviews/[id]/route.ts` | GET/DELETE single review |
| Public REST API | `app/api/v1/[...path]/route.ts` | Public API endpoint for external developers |
| Share button | `components/ShareButton.tsx` | Share artist/track/campaign to social platforms |
| Reviews DB migration | `supabase/migrations/20260604000000_fan_reviews.sql` | Review table with rating constraint (1-5) |

**Final polish (commit `f479241`):**
- Reviews tab label corrected on artist page Comments tab
- Share buttons UX verified across all pages

### Additional Infrastructure Built

| Feature | Detail |
|---------|--------|
| **Auth + onboarding overhaul** | World-class Google OAuth with session management, self-claim flow |
| **Dashboard 10/10 rewrite** | 4 tabs (Profile, Tracks, Campaigns, Stats), profile editor, modal wizard |
| **Artist self-claim** | Onboarding creates artist profile, edit via `claimed_by_user_id` |
| **Track import** | Import tracks from Spotify/Bandcamp/Deezer link + manual addition |
| **Artist wallet** | Balance display on artist page + dashboard + checkout flow |
| **Chat 10/10 rewrite** | SSE removed → 5s polling, optimistic messages, edit/delete, typing indicator |
| **Full chat parity** | ChatWidget now matches Messages page features |
| **Newsletter Google OAuth** | 1-click subscribe with Google signup |
| **Messages page mobile-first** | Full responsive redesign |
| **8 chat bugs fixed** | Race conditions, SSE 400, self-messaging guard, CSP GA4 |
| **Review section wired** | Comments tab now includes reviews |

---

## 🔴 Remaining (ROADMAP: 2/36 items)

### Item #10: Curated Launch (⬜ PENDING — HIGHEST PRIORITY)

**This is the single most important thing for the platform.** The codebase is feature-complete for v1. The bottleneck has shifted from development to acquisition.

**Process:**
1. Find 5 artists with existing audiences (1K-10K followers)
2. Find 20 creators who make music content (TikTok/Reels/Shorts)
3. Set up 5 campaigns with $20-100 real budgets (or co-fund with founders)
4. Coordinate a 2-week sprint where creators make content for these artists
5. Document everything — blog posts, social proof, case studies
6. Measure: submissions, views, engagement, payout

**Estimated effort:** 20 hours manual outreach

### Item #11: LLMO Bios — Batch Generation (🟡 SCHEDULED)

**Status:** Module fully built (`lib/artist-content.ts` + 8 bio slot libraries). Cron runs 100 artists/night at 00:00 UTC. At this rate, 2,000 artists take ~20 days.

**Acceleration options:**
- Manual trigger to process remaining artists in bulk
- Increase `limit=100` to `limit=500` if Railway timeout permits

---

## 🟢 Pipeline Health

| Pipeline | Runs (UTC) | Status | Output |
|----------|------------|--------|--------|
| Blog pipeline | 02, 08, 14, 20 | ✅ 4×/day | 2 posts/day scheduled at 09:00 + 15:00 |
| Blog publish | 09, 15 | ✅ 2×/day | Publishes scheduled posts |
| Bio generation | 00 | ✅ 100/night | Unique SEO bios for artists |
| Wikipedia enrichment | 00 | ✅ 100/night | Infobox + summary data |
| Bandcamp scrape | 01 | ✅ 100/night | Track listings + email data |
| YouTube enrichment | 08 | ✅ 100/night | Subscriber counts |
| Activity archive | 01 | ✅ Daily | Archives events >30 days |
| Blog syndication | 04 | ✅ Daily | Auto-posts to Reddit |
| Creator discovery | 05, 17 | ✅ 2×/day | New creator sourcing |
| Email outreach | 03, 09, 15, 21 | ✅ 50/run | Artist email sends |
| Creator outreach | 11, 23 | ✅ 13/run | Creator email sends |
| Message notifications | 12 | ✅ Daily | Email digests for unread messages |
| Outreach followup | 10 | ✅ Daily | Re-engagement for pending outreach |
| Welcome sequence | 09 | ✅ Daily | Onboarding emails |
| Re-engagement | 11 | ✅ Daily | Inactive user emails |
| Refresh artist metrics | 08 | ✅ Daily | Live social stats refresh |

**Dispatcher** (`app/api/cron/dispatcher/route.ts`) — single Railway cron entry at `0 * * * *` routes to 15+ workers at the right hours. No Railway cron syntax limitations.

---

## 📊 Project Metrics

| Metric | Value |
|--------|-------|
| Total commits | 1,065 |
| React components | ~105 |
| API routes | 100+ |
| Pages | 24 |
| DB migrations | 20 |
| Planning/research docs | 38 |
| Cron workers | 16 |
| Bio slot libraries | 8 |
| Blog posts (auto-generated) | 28+ |
| Scheduled posts | 11+ (2/day cadence through June 12) |
| Artists in database | ~2,038 |
| Artist profiles | 2,158 |
| Artist tracks | 2,542 |

## 📌 Organic Growth Backlog (when users arrive)

These are deferred until the curated launch creates the first wave of real activity:

- **Referral loop** (~2h): Unique codes, $10 credit per referral
- **Instagram content automation** (~2h): Blog→IG post pipeline via cron
- **Referral in bio links** (~30min): `/r/[code]` landing pages
- **LLMO bios complete batch** (~$140 DeepSeek): Manual trigger to accelerate 20-night cron

---

## 📚 Key Documents

| Document | Purpose |
|----------|---------|
| `BLUEPRINT.md` | Pre-execution audit — 38 files, 9 phases (ALL BUILT) |
| `ROADMAP.md` | v4.0 strategic roadmap — 34/36 complete |
| `VISION.md` | Platform vision with social layer |
| `GROWTH_AUDIT.md` | 10 prioritized acquisition channels |
| `MANIFESTO.md` | Core operating principles |
| `DATA_ENRICHMENT_PLAN.md` | External data sourcing strategy |
| `BIO_ENGINE_RESEARCH.md` | 8-slot composable bio architecture |
| `ARTIST_PAGE_RESEARCH.md` | 25-platform competitor analysis |
| `ARTIST_SEO_LLMO_PLAN.md` | 5-phase execution (ALL BUILT) |
| `UX_COMPETITOR_RESEARCH.md` | Code-level CSS analysis of 10 competitors |
| `UX_IMPLEMENTATION_PLAN.md` | 8-phase UX overhaul (ALL BUILT) |
