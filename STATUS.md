# Selah.fm — Project Status

**Last updated:** June 2, 2026 (EOD)
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

### Remaining Known Issues
| Issue | Status |
|-------|--------|
| Multi-track pipeline — outreach skips artists it knows, never adds second track | Not yet fixed |
| Checkout — no `?artistId=X` support for direct artist donations | Not yet built |
| LLMO content generation per artist | Not yet built |
| Internal linking engine (artist→campaign→blog cross-linking) | Not yet built |
| Comment moderation (report + admin panel) | Not yet built |

**Total: 16 commits from `b2ea8cd` → `b423aac`**
**16 files created, 12 modified, 4 DB tables, 2 DB migrations**