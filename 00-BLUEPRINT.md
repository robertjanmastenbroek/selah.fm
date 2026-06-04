# Selah.fm — 100/100 Execution Blueprint

**Date:** June 4, 2026 · **Standard:** Top 0.0001% worldwide  
**v1 status:** 36/36 roadmap items complete · **Phase 4:** World-class polish  

---

## Current Score

| # | Dimension | Now | Target | Priority | Hours |
|---|-----------|-----|--------|----------|-------|
| 1 | **Track Page** | 8 | 10 | Medium | 1.5 |
| 2 | **Artist Profile** | 8 | 10 | Low | 2.5 |
| 3 | **Campaign Page** | 8 | 10 | High | 2 |
| 4 | **Blog System** | 9 | 10 | Low | 1 |
| 5 | **Homepage** | 7 | 10 | Medium | 1.5 |
| 6 | **Browse** | 7 | 10 | Low | 1.5 |
| 7 | **Checkout** | 6 | 10 | High | 0.5 |
| 8 | **Onboarding** | 6 | 10 | Medium | 2 |
| 9 | **Login Page** | 5 | 10 | High | 1 |
| 10 | **Dashboard Analytics** | 4 | 10 | **Highest** | 2 |
| 11 | **Security** | 6 | 10 | **Highest** | 2.5 |
| 12 | **Community** | 4 | 10 | High | 6 |
| 13 | **Payment UX** | 5 | 10 | Medium | 1 |
| 14 | **Mobile Experience** | 5 | 10 | Medium | 1.5 |
| 15 | **Creator Tools** | 4 | 10 | Medium | 2 |
| 16 | **Artist Tools** | 5 | 10 | Medium | 1.5 |
| 17 | **Real-time** | 3 | 10 | High | 2 |
| 18 | **Monetization** | 5 | 10 | Low | 2 |
| | **TOTAL** | **5.7 avg** | **10 avg** | | **~32h** |

---

## Execution Plan — 4 Sprints

---

### SPRINT A: Conversion & Trust (~7h)
*Target dimensions: Dashboard Analytics, Checkout, Login Page, Homepage*

#### A1. Dashboard Analytics Chart — 2h ⭐ HIGHEST IMPACT

**Current:** Raw numbers only (total views, submissions, spent). No trends.
**Target:** Submission funnel + views-over-time + approval rate

**Changes:**
- `app/dashboard/page.tsx` — Add chart section after quick stats
- New component: `components/DashboardChart.tsx`
  - Views-over-time: weekly bins, 7/30/90d selector
  - Submission funnel: submitted → reviewed → approved → paid (horizontal bar)
  - Approval rate: approved/total submissions as percentage with color coding
- Use CSS-only bar charts (no recharts dependency)
- Data source: `/api/campaigns` (already returns approved_submissions, pending_submissions)

**Files:**
- `components/DashboardChart.tsx` — New, ~150 lines
- `app/dashboard/page.tsx` — Import and render, +20 lines

**Acceptance:** Dashboard shows views chart, submission funnel, approval rate. Greener = better.

---

#### A2. Checkout Fee Transparency — 0.5h ⭐ HIGH IMPACT

**Current:** Stripe Payment Element processes payments. No fee breakdown visible.
**Target:** Show "You'll be charged $X. Creator keeps 80% ($Y). Platform takes 20% ($Z)." before payment.

**Changes:**
- `app/checkout/page.tsx` — Add fee breakdown above PaymentElement

**Files:**
- `app/checkout/page.tsx` — +15 lines in the payment section

**Acceptance:** Users see fee breakdown before entering card details.

---

#### A3. Login Page Social Proof — 1h ⭐ HIGH IMPACT

**Current:** Logo + Google OAuth button. No testimonials, no trust signals.
**Target:** Testimonial stripe + real-time earnings stat + feature badges

**Changes:**
- `app/login/page.tsx` — Add testimonial carousel (3 rotating quotes from founder/early users), earnings stat from `/api/stats`, trust badging

**Files:**
- `app/login/page.tsx` — +40 lines

**Acceptance:** Login page shows testimonials + real earnings stat.

---

#### A4. Homepage Campaign Showcase — 1.5h

**Current:** Featured campaigns section shows recent campaigns. No highlight cards.
**Target:** Top 3 most-funded campaigns with animated stats, CPM badge, cover art

**Changes:**
- `components/HomePageClient.tsx` — Replace featured campaigns grid with premium highlight cards for top 3, then remaining in grid

**Files:**
- `components/HomePageClient.tsx` — Modify featured section, +30 lines

**Acceptance:** Homepage shows 3 premium campaign cards with animated counters.

---

### SPRINT B: Community Engine (~7h)
*Target dimensions: Community, Real-time*

#### B1. Following Feed — 2h ⭐ HIGH IMPACT

**Current:** `artist_follows` table exists. No feed. Users can follow but see nothing.
**Target:** Following feed shows submissions, campaigns, activity from followed users.

**Changes:**
- New API: `/api/feed?limit=20` — returns submissions + activity from followed artists/creators
- New page: `/feed` — infinite-scroll feed of followed activity
- Add feed link to topnav

**Files:**
- `app/api/feed/route.ts` — New, ~60 lines
- `app/feed/page.tsx` — New, ~100 lines
- `components/TopNav.tsx` — Add feed link, +2 lines

**Acceptance:** Following someone shows their campaigns and submissions in a feed.

---

#### B2. Fan Collections (Letterboxd-style) — 2h ⭐ HIGH IMPACT

**Current:** No user-curated lists. No way to save tracks/artists.
**Target:** Users create public collections of tracks ("Best indie finds June 2026"). Shareable, embeddable.

**Changes:**
- Migration: `collections`, `collection_items` tables
- API: CRUD for collections + items
- UI: Collection creation modal, collection page, embed in artist/track pages

**Files:**
- `supabase/migrations/20260605_collections.sql` — New, ~30 lines
- `app/api/collections/route.ts` — New, ~80 lines
- `app/api/collections/[id]/route.ts` — New, ~40 lines
- `app/collection/[id]/page.tsx` — New, ~60 lines
- `components/CreateCollectionModal.tsx` — New, ~80 lines

**Acceptance:** Users can create collections, add tracks, share via link.

---

#### B3. Discovery Feed — 2h ⭐ HIGH IMPACT

**Current:** Browse page is the only discovery surface. No algorithmic feed.
**Target:** "Trending now" — most-viewed submissions this week. Sorted by engagement.

**Changes:**
- API: `/api/discover` — most viewed approved submissions last 7 days
- Tab in browse page: "Trending" showing submission previews with view counts + reactions
- Or new `/discover` page

**Files:**
- `app/api/discover/route.ts` — New, ~40 lines
- `app/browse/BrowseClient.tsx` — Add Trending tab, +30 lines

**Acceptance:** Users can browse trending submissions sorted by views.

---

#### B4. Live SSE for Campaign Page — 1h

**Current:** 30s polling. Works but not instant.
**Target:** SSE endpoint pushes donation + submission updates. Client subscribes and updates live.

**Changes:**
- API: `/api/c/[id]/stream` — SSE endpoint
- Client: `CampaignDetailClient.tsx` — EventSource subscription with 3s keepalive

**Files:**
- `app/api/c/[id]/stream/route.ts` — New, ~50 lines
- `app/c/[id]/CampaignDetailClient.tsx` — Add SSE subscription, +25 lines

**Acceptance:** Donations appear in real-time without page refresh.

---

### SPRINT C: Platform Hardening (~5h)
*Target dimensions: Security, Mobile Experience, Payment UX*

#### C1. Rate Limiting on Auth — 1.5h ⭐ HIGH IMPACT (SECURITY)

**Current:** `/api/analytics/event` has rate limiting. Auth endpoints do not.
**Target:** IP-based rate limiting on `/login`, `/api/auth/callback`. Max 10 attempts/minute per IP.

**Changes:**
- `app/api/auth/callback/route.ts` — Add rate limit check using existing `lib/rate-limit.ts`
- `app/api/auth/login/route.ts` or login page — Add rate limiting on OAuth initiation

**Files:**
- `app/api/auth/callback/route.ts` — +5 lines
- `lib/rate-limit.ts` — Verify export pattern works for auth routes

**Acceptance:** 11+ rapid auth requests in 1 minute returns 429.

---

#### C2. Audit Logging — 2h

**Current:** No audit trail for money movements. If a payout goes wrong, no forensic trace.
**Target:** `audit_log` table records every money event: donation, deposit, payout, refund, fee change.

**Changes:**
- Migration: `audit_log` table (actor_id, action, target_type, target_id, details_json, created_at)
- Webhook: Insert audit log for every payment_intent.succeeded, payout.paid
- Campaign update: Insert audit log for budget changes

**Files:**
- `supabase/migrations/20260605_audit_log.sql` — New, ~20 lines
- `app/api/stripe/webhook/route.ts` — +15 lines
- `lib/audit-log.ts` — New helper, ~20 lines

**Acceptance:** Every money movement has a timestamped audit record.

---

#### C3. PWA + Push Notifications — 1.5h

**Current:** Responsive design. No install prompt, no offline support, no push.
**Target:** manifest.json, service worker, push notification subscription, desktop install prompt.

**Changes:**
- `public/manifest.json` — Verify/correct icon paths, display: standalone
- `public/sw.js` — Service worker with offline fallback page
- Root layout — Register service worker, show install prompt on desktop
- Push: `/api/notifications/subscribe` — Save push subscription
- `app/api/notifications/send/route.ts` — Send push via web-push library

**Files:**
- `public/manifest.json` — Verify and update, ~20 lines
- `app/layout.tsx` — Register SW, +5 lines
- `app/api/notifications/subscribe/route.ts` — New, ~25 lines

**Acceptance:** Chrome shows install prompt. App loads offline with cached shell.

---

### SPRINT D: Deep UX (~9h)
*Target dimensions: Track Page, Campaign Page, Browse, Artist Profile, Onboarding*

#### D1. Campaign Video Hero — 2h

**Current:** Static cover art only. No video.
**Target:** YouTube/Vimeo embed above the fold on campaign pages. Kickstarter-style.

**Changes:**
- `app/c/[id]/CampaignDetailClient.tsx` — Add video embed section after hero
- `app/api/campaigns/[id]/route.ts` — Add `video_url` field support
- Migration: Add `video_url` to campaigns table

**Files:**
- `supabase/migrations/20260605_campaign_video.sql` — New, +2 lines
- `supabase/migrations/20260605_campaign_video.sql` — +2 lines ALTER TABLE
- `app/c/[id]/CampaignDetailClient.tsx` — +30 lines for video embed

**Acceptance:** Campaigns with video_url show embeddable video above the fold.

---

#### D2. Creator / Artist Onboarding Upgrade — 2h

**Current:** Basic role selection → name → done. No platform connects.
**Target:** Artist onboarding: connect Spotify to auto-import tracks + set CPM. Creator onboarding: connect Stripe + set platform handles.

**Changes:**
- `app/onboarding/page.tsx` — Add optional Spotify connect button for artists, Stripe Connect express for creators
- `app/api/onboarding/spotify/route.ts` — New, Spotify auth flow
- `app/api/onboarding/stripe/route.ts` — New, Stripe Connect express flow

**Files:**
- `app/onboarding/page.tsx` — Major restructure, +100 lines
- `app/api/onboarding/spotify/route.ts` — New, ~50 lines
- `app/api/onboarding/stripe/route.ts` — New, ~40 lines

**Acceptance:** Artists can connect Spotify during onboarding. Creators can connect Stripe.

---

#### D3. Browse Keyboard Navigation + Infinite Scroll — 1.5h

**Current:** Paginated grid. Mouse-only navigation.
**Target:** Arrow keys navigate cards. Enter opens. Intersection Observer infinite scroll. Auto-loads next page.

**Changes:**
- `app/browse/BrowseClient.tsx` — Add IntersectionObserver for infinite scroll, keydown handler
- `app/api/artists/route.ts` — Add cursor-based pagination alongside page-based

**Files:**
- `app/browse/BrowseClient.tsx` — +40 lines

**Acceptance:** Scroll to bottom → auto-loads next page. Arrow keys move focus between cards.

---

#### D4. Track Page Related Tracks Carousel — 1.5h

**Current:** Single track page with no cross-sell.
**Target:** "More from [artist]" carousel at bottom. Shows other tracks by same artist.

**Changes:**
- `app/artist/[slug]/tracks/[id]/page.tsx` — Add related tracks query
- `app/artist/[slug]/tracks/[id]/TrackDetailClient.tsx` — Add horizontal scroll carousel

**Files:**
- `app/artist/[slug]/tracks/[id]/page.tsx` — +5 lines (query)
- `app/artist/[slug]/tracks/[id]/TrackDetailClient.tsx` — +30 lines (carousel)

**Acceptance:** Track page shows related tracks by same artist.

---

#### D5. Dynamic Color Extraction — 2h

**Current:** Static gradient based on name hash.
**Target:** Extract dominant colors from cover art → dynamic page gradients. Spotify Encore-style.

**Changes:**
- `lib/color-extract.ts` — New: fetch image, compute dominant colors via canvas or ColorThief
- Artist profile: use extracted colors for page gradient
- Campaign page: use campaign cover art colors

**Files:**
- `lib/color-extract.ts` — New, ~60 lines
- `app/artist/[slug]/ArtistProfileClient.tsx` — Apply dynamic gradient, +10 lines
- `app/c/[id]/CampaignDetailClient.tsx` — Apply dynamic gradient, +10 lines

**Acceptance:** Page gradient matches dominant color from cover art.

---

## Dependencies

```
Sprint A ─┬─ A1 (Dashboard Chart) ─── independent
           ├─ A2 (Checkout Fee) ────── independent
           ├─ A3 (Login Page) ──────── independent
           └─ A4 (Homepage Showcase) ─ independent

Sprint B ─┬─ B1 (Following Feed) ──── depends on artist_follows table (exists)
           ├─ B2 (Fan Collections) ─── new tables needed
           ├─ B3 (Discovery Feed) ──── independent
           └─ B4 (Live SSE) ───────── independent

Sprint C ─┬─ C1 (Rate Limiting) ───── independent
           ├─ C2 (Audit Logging) ───── depends on webhook (exists)
           ├─ C3 (PWA) ────────────── independent
           └─ (Payment UX) ────────── partially done (Apple Pay ✅)

Sprint D ─┬─ D1 (Video Hero) ──────── migration first
           ├─ D2 (Onboarding) ─────── major restructure
           ├─ D3 (Browse Nav) ─────── independent
           ├─ D4 (Related Tracks) ─── independent
           └─ D5 (Color Extraction) ─ independent
```

All 4 sprints can run in parallel. No hard cross-sprint dependencies.

---

## Effort Summary

| Sprint | Items | Hours | Impact Level |
|--------|-------|-------|-------------|
| A | 4 | 7 | ⭐⭐⭐ Highest ROI |
| B | 4 | 7 | ⭐⭐ High |
| C | 3 | 5 | ⭐⭐⭐ Critical infra |
| D | 5 | 9 | ⭐ Medium-high |
| **Total** | **16** | **~28h** | |

---

## How to Execute

1. Pick a sprint (A-D) or individual item
2. Read the item's detail above for exact files + approach
3. Build, type-check, commit, push, verify
4. Mark done in this blueprint
5. Move to next item

**First recommendation:** Start with Sprint A, item A1 (Dashboard Analytics Chart) — highest impact, independent, and gives artists the #1 requested feature immediately.
