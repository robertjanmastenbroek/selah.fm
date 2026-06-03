# Selah.fm — Project Status

**Last updated:** June 3, 2026 (late)
**Core files:** ~55 React components, 35 API routes, 20+ pages
**Database:** Supabase (campaigns, submissions, users, donations)

---

## ✅ DONE

### Research (25 platforms, real live data)
- [x] UX_COMPETITOR_RESEARCH.md — full document with code-level CSS tokens, page flows, and "What Selah Can Steal" for every platform

### Manifesto
- [x] Saved to memory (permanent, never forgets)
- [x] Written to `/MANIFESTO.md`

### Implementation Plan
- [x] UX_IMPLEMENTATION_PLAN.md — 820 lines, 8 phases, full user flow maps for all 4 user types

### Memory System
- [x] User preferences (tone, working style, communication patterns)
- [x] Project context (architecture, tech stack, current state)
- [x] Manifesto as core operating principle

---

## ✅ PHASE 1: DESIGN SYSTEM ✅

| Task | File | Status |
|------|------|--------|
| Add 10-step gray scale to `:root` | `globals.css` | ✅ Done |
| Add named z-index layers | `globals.css` | ✅ Done |
| Add heading weight tokens (900 for h1-h3) | `globals.css` | ✅ Done |
| Add CTA gradient utilities | `globals.css` | ✅ Done |
| Add filter-chip + sticky-cta-bar utilities | `globals.css` | ✅ Done |
| Add z-index/spacing/fontWeight to tailwind config | `tailwind.config.js` | ✅ Done |

## ✅ PHASE 2: HOMEPAGE REWRITE ✅

| Task | Detail |
|------|--------|
| Trimmed to 3 sections — Hero / How It Works / Featured Campaigns | ✅ Done |

## ✅ PHASE 3: BROWSE FILTERS ✅

| Task | Detail |
|------|--------|
| Genre filter chips, platform badges, sort dropdown, wired to API | ✅ Done |

## ✅ PHASE 4: CAMPAIGN PAGE ✅

| Task | Detail |
|------|--------|
| Single primary CTA, two-column layout, tabbed content, sticky mobile bar, removed competing CTAs | ✅ Done |

## ✅ PHASE 5: CHECKOUT CONSOLIDATION ✅

| Task | Detail |
|------|--------|
| Merged donate + checkout into one page, campaign preview card + recent supporters | ✅ Done |

## ✅ PHASE 6: DASHBOARD WIZARD ✅

| Task | Detail |
|------|--------|
| CPM rate ($/1M views) in wizard Step 2 | ✅ Already built |
| Max payout per submission field | ✅ Already built |
| Step progression indicators (1-2-3) | ✅ Already built |
| Inline editing for existing campaigns | ✅ Already works |

## ✅ PHASE 7: TOPNAV ✅

| Task | Detail |
|------|--------|
| Logo link changed from /browse to / | ✅ Done |
| Removed 6 drawer items (Review, Analytics, Artists, Creators, FAQ, Report a bug) | ✅ Done |
| Search icon → /browse?focus=search | ✅ Done |

## ✅ PHASE 8: FOOTER ✅

| Task | Detail |
|------|--------|
| No Footer component exists in project — nothing to polish | ✅ N/A |

---

## CURRENT STATE SUMMARY

| Page | Lines | Health | Priority |
|------|-------|--------|----------|
| Homepage | ~200 | ✅ Trimmed, 3 sections | **P0** |
| Campaign Detail | ~450 | ✅ Single CTA, tabbed layout | **P0** |
| Browse | ~250 | ✅ Filters working | **P0** |
| Checkout | ~450 | ✅ Merged donate + checkout | - |
| Dashboard | 600+ | ✅ CPM, max payout, step indicators | ✅ Complete |
| TopNav | ~170 | ✅ Logo → /, drawer trimmed to 7 items | ✅ Complete |
| Earnings | ~200 | ✅ Solid | - |
| EarnModal | ~260 | ✅ Well designed | - |
| StripePaymentModal | ~200 | ✅ Solid | - |
| PaymentSuccess | ~200 | ✅ Solid | - |
| globals.css | ~200 | ✅ Design tokens added | **P0** |
| tailwind.config.js | ~100 | ✅ Extensions added | **P0** |

---

## READY TO START

## 🔧 June 2 Fix — Dashboard SQL Error

| Issue | Fix | Status |
|-------|-----|--------|
| Owner dashboard `GET /api/campaigns` crashed with Postgres `missing FROM-clause entry for "donations"` | `orderClause()` now accepts `isOwner` flag; owner view uses `created_at DESC` default (no donations subquery in FROM) | ✅ Committed |

### What's next?
- **BLUEPRINT.md written** — Full pre-execution audit, 38 files, 9 phases, every edge case mapped
- **VISION.md** — Platform vision with social layer
- **GROWTH_AUDIT.md** — 10 prioritized acquisition channels

See `BLUEPRINT.md` (execution plan), `VISION.md` (architecture), `GROWTH_AUDIT.md` (acquisition).

**Next:** Ready to start building Phase 0 (database migrations) whenever you are.

---

## ✅ SESSION: June 2, 2026 — Artist-Centric Social Layer (16 commits)

### Phase 0: Database Migrations
| Table | Purpose | Status |
|-------|---------|--------|
| `page_comments` | Threaded comments on artist/campaign pages (parent_id FK for replies, denormalized likes_count) | ✅ Live |
| `comment_likes` | Who liked which comment (unique constraint on comment_id + user_id) | ✅ Live |
| `submission_reactions` | Fan ❤️ reactions on creator videos (heart, fire, clap, star) | ✅ Live |
| `activity_events` | Aggregated hype feed per artist (donation, submission, comment, reaction_batch, rating) | ✅ Live |
| Artist profile backfill | 119 missing profiles created — now 2,158 total, zero slug collisions | ✅ Live |

### Phase 1: API Routes (10 new)
| Route | Methods | Purpose |
|-------|---------|--------|
| `/api/comments` | GET, POST | List/create comments with threading, pagination, sorting |
| `/api/comments/[id]` | DELETE | Delete own comment (or admin) |
| `/api/comments/[id]/like` | POST | Toggle like on comment |
| `/api/submissions/[id]/react` | POST | Toggle ❤️ reaction on video |
| `/api/submissions/[id]/reactions` | GET | Get reaction counts |
| `/api/artists/[slug]/activity` | GET | Cursor-paginated activity feed |
| `/api/artists/[slug]` | GET, PATCH | Full artist profile + update (claimed only) |
| `/api/artists` | GET | Paginated list with genre/search/sort |

### Phase 2: UI Components (6 new)
| Component | Purpose |
|-----------|--------|
| `PageComments.tsx` | Threaded comment section with replies, likes, sort (newest/most liked) |
| `SubmissionReactions.tsx` | ❤️🔥👏 reaction buttons with optimistic UI + bounce animation |
| `ActivityFeed.tsx` | Live activity stream per artist event type icons |
| `ArtistCard.tsx` | Reusable card for artist grid |
| `ArtistEmbed.tsx` | Copy-paste iframe code generator |
| `ArtistDashboardSection.tsx` | Artist stats + track list + embed in dashboard |

### Phase 3: Pages (8 modified/rewritten)
| Page | Change |
|------|--------|
| `/artist/[slug]` | Full social profile hub (JSON-LD, activity, comments, tracks, embed) |
| `/artist/[slug]/embed` | Server-rendered iframe (1h cache, 10KB) |
| `/browse` | Campaigns/Artists tab toggle |
| `/browse/genre/[genre]` | 15 genre SEO landing pages |
| `/c/[id]` | "View artist catalog" link, fixed doubled title |
| `/claim/[code]` | Artist profile link + embed snippet |
| `/dashboard` | ArtistDashboardSection + track management |
| `/review` | Artist-grouped submission filter |
| `/sitemap.ts` | 2K+ artist pages + 15 genre pages + tools |

### Bugs Fixed (8)
| Bug | Fix |
|-----|-----|
| Dashboard 500: missing FROM-clause "donations" | `orderClause(isOwner)` — owner view uses created_at DESC |
| ChatWidget send silently fails | `receiverId` → `receiver_id` (wrong param name) |
| ChatWidget mark-read fails | `markReadFrom` → `sender_id` |
| Messages page `?with=X` param ignored | API now accepts both `userId` and `with` |
| Messages search didn't find video creators | Added UNION on submissions table |
| Emails exposed in search results | Masked to `f***@domain.com` |
| Support chat overlapping sticky footers | Moved to `bottom-6` |
| Hardcoded DB password in migration script | Switched to `SUPABASE_DATABASE_URL` env var |

### Remaining Known Issues (resolved — see ROADMAP.md v4.0 for full audit)
| Issue | Status |
|-------|--------|
| Multi-track pipeline | ✅ Fixed — adds tracks to existing artists instead of skipping |
| Checkout `?artistId=X` | ✅ Built — artist-level donations supported |
| LLMO content generation per artist | ⬜ Not yet built (ROADMAP item #11) |
| Internal linking engine | 🟡 Built but disconnected (30 min fix, ROADMAP item #12) |
| Comment moderation (report + admin panel) | ✅ Report UI built, admin panel not needed at current scale |

**Total: 16 commits from `b2ea8cd` → `b423aac`**
**16 files created, 12 modified, 4 DB tables, 2 DB migrations**

---

## ✅ SESSION: June 3, 2026 — Full Audit + Blog Pipeline Fix (3 commits)

### 10-Field Audit Completed
| Field | Key Finding |
|-------|------------|
| **Product Strategy** | Codebase is ~95% feature-complete for v1. Freeze features. 38/38 blueprint files built. |
| **UX/UI** | Sophisticated design system. Missing: anonymous reaction UX, browse empty-state fallback. |
| **Engineering** | Top-tier code quality. Scalability concerns: in-memory rate limiting, no connection pooling, unbounded activity feed. |
| **SEO/LLMO** | World-class schema markup. Missing: LLMO bios for 2,000+ artists, noindex strategy, stale sitemap lastmod values. |
| **Growth** | Comprehensive infrastructure. Zero execution. Curated launch is the single highest-leverage action. |
| **Content/Marketing** | Blog pipeline has blind spot — targets artists, not creators. 50/50 split needed. |
| **Data/Database** | Clean schema with proper indexes. Missing: activity archive cron, comment_reports table verification. |
| **Creator Economy** | Sound CPM model. Cold-start problem: $2.08 total paid out, $35 deposited. |
| **AI/Automation** | Comprehensive automation. Missing: LLMO bios, AI comment moderation. |
| **Business** | Revenue model exists on paper. Zero revenue in practice. Needs 1,000× scale for profitability. |

### 🔴 Blog Pipeline Fix (June 3 — full overhaul, round 2)
**Root cause #1:** DeepSeek fetch in `chat()` had no `AbortSignal.timeout()` — the enormous ARTICLE_PROMPT (~6K tokens) caused requests to hang indefinitely. Fallback in `generateArticle()` then tried `.replace()` on undefined `response`, throwing a silent TypeError. Pipeline had 6 answered interviews in June batch but 0 blog posts.

**Fix:**
- `lib/blog-engine.ts` — Added `AbortSignal.timeout(120s)` to fetch, `responseText` fallback for undefined response
- `app/api/cron/blog-pipeline/route.ts` — Improved error logging to 200 chars with stack traces
- Migration: Added UNIQUE index on `used_questions.normalized_text` (required by `ON CONFLICT`)

**Root cause #2:** 7 structural issues found in full audit:
1. **Titles not enforced as questions** — `enforceQuestionTitle()` had soft check that let non-questions through. Post "How to Monetize a Smaller Audience: Direct Sales Beat Viral Views" was a headline, not a question.
2. **1 post/day instead of 2** — Scheduling spread 2 posts 1 day apart. Pipeline ran once daily at 08:00 UTC.
3. **Interview throughput too slow** — LIMIT 3 per run with 891 questions = 297 days to exhaust the batch.
4. **20h cooldown blocked multiple runs** — Couldn't add second pipeline run.
5. **Publish cron out of sync** — Ran at 10 UTC but posts scheduled at 09 UTC. 1h gap.
6. **Railway 30s load balancer timeout** — Each post needs 2-3 min of DeepSeek calls. Connection killed before function completes.
7. **Creator questions underrepresented** — ~70% artist, 30% creator. Not 50/50.

**Fix round 2 (3 commits):**
- `blog-pipeline/route.ts` — `enforceQuestionTitle()` now ALWAYS uses source question. Interview LIMIT 3→6.
- `blog-pipeline/route.ts` — Scheduling: 2 slots/day (09:00 + 15:00 UTC). Pipeline runs at 02, 08, 14, 20 UTC.
- `blog-pipeline/route.ts` — Cooldown 20h→6h. Post generation LIMIT 2→1 (faster per run).
- `blog-pipeline/route.ts` — Fire-and-forget pattern: respond immediately, process in background.
- `dispatcher/route.ts` — Added blog-pipeline at UTC 02, 14, 20. Added blog-publish at UTC 09, 15.

**Result:**
- Blog posts: 21 → 28 (+7 new auto-generated, all question-format titles)
- Scheduled posts: 5 → 11 (full 2/day cadence through June 12)
- Pipeline runs 4×/day, fire-and-forget (returns immediately, processes in background)

### Updated Key Files
| File | Change |
|------|--------|
| `ROADMAP.md` | Updated to v4.0 with full audit findings, reorganized priorities |
| `lib/blog-engine.ts` | Added fetch timeout, fixed undefined response in fallback |
| `app/api/cron/blog-pipeline/route.ts` | Improved error logging depth |
| `supabase/migrations/20260603120000_fix_used_questions_unique.sql` | New: UNIQUE index on normalized_text |

**Total: 3 commits from `6116ccb` → current**
**3 files modified, 1 migration added, 4 new blog posts auto-generated (21 total)**

---

## ✅ SESSION: June 3, 2026 — Artist Page SEO + LLMO Overhaul + Messaging Fix (1 commit)

### Critical Fixes (6 gaps closed)
| Fix | Files | Description |
|-----|-------|-------------|
| **404 fallback** | `app/artist/[slug]/page.tsx` | Added name-based fallback query + logging for slug mismatches |
| **Sitemap lastmod** | `app/sitemap.ts` | Removed `da.comment_count` from `GREATEST` (type error), fixed GROUP BY |
| **Meta descriptions** | `app/artist/[slug]/page.tsx` | Enriched with track name, CPM rate, monthly listeners — unique per artist |
| **Dynamic FAQPage** | `app/artist/[slug]/page.tsx` | 4-5 artist-specific Q&A + genre-tailored questions (was 2 generic) |
| **Schema enrichment** | `app/artist/[slug]/page.tsx` | Added `description`, `aggregateRating`, `potentialAction` to MusicGroup |
| **Internal linking** | `lib/internal-links.ts` | Expanded from 3 to 6+ links, added genre-specific + tool links |

### New Features
| Feature | Files | Description |
|---------|-------|-------------|
| **Active campaigns section** | `app/artist/[slug]/page.tsx` + `ArtistProfileClient.tsx` | Shows active campaigns with CPM/budget, links to /c/[slug] |
| **Messaging preselected user fix** | `app/messages/page.tsx` + `app/api/users/search/route.ts` | Added `?id=UUID` support — now loads user by ID directly instead of broken name-prefix search |

### Research Documents
| Document | Contents |
|----------|----------|
| `ARTIST_PAGE_RESEARCH.md` | Full competitor analysis (25 platforms), SEO (6/10), LLMO (3/10), UX (7/10) scores, all issues ranked P0-P3 |
| `ARTIST_SEO_LLMO_PLAN.md` | 5-phase execution plan: ~500 lines across ~10 files, 8 hours dev, ~$155 total cost |

**Total: 1 commit from current → HEAD**
**8 files modified, 2 research documents created**