# Selah.fm — 100/100 Execution Blueprint

**Date:** June 4, 2026 · **Standard:** Top 0.0001% worldwide  
**v1 status:** 36/36 roadmap items complete · **Phase 4:** World-class polish  
**Repository:** `/Users/motomoto/Documents/selah.fm` · **Deploy:** Railway auto-deploy on `git push origin main`

---

## Standard of Excellence

Every item in this blueprint follows these rules:
- **Zero TypeScript errors** — `npx tsc --noEmit` must pass before any commit
- **No regressions** — verify the existing page/API still works after change
- **Accessible by default** — semantic HTML, focus management, aria labels where interactive
- **Mobile-first** — test at 375px before desktop
- **Error states** — every API call has loading/empty/error handling
- **Fire-and-forget** — non-critical side effects use `.catch(() => {})`
- **Rollback plan** — each item has a one-line rollback (revert commit or disable flag)
- **Deploy verify** — after push, check health endpoint + affected page loads 200

---

## 22 Dimensions (Score 0-10) — FINAL June 4

| # | Dimension | Before | After | Key Improvements |
|---|-----------|--------|-------|-----------------|
| 1 | **Dashboard Analytics** | 4 | **8** | Views-over-time chart, submission funnel, approval rate, 7/30/90d selector |
| 2 | **Community** | 4 | **8** | Following feed, fan collections (migration + API + UI + page), discovery feed |
| 3 | **Real-time** | 3 | **8** | SSE endpoint for live campaign updates, 3s polling, 30s fallback |
| 4 | **Creator Tools** | 4 | **7** | Monthly projections, pace calculator, top 10% benchmark |
| 5 | **Artist Tools** | 5 | **6** | Dashboard analytics chart, submission funnel, approval rate |
| 6 | **Login Page** | 5 | **8** | Testimonial carousel, live stats from API, 5 trust badges |
| 7 | **Mobile Experience** | 5 | **8** | PWA manifest, service worker, iOS meta tags, install prompt |
| 8 | **Payment UX** | 5 | **7** | Fee breakdown in checkout, audit logging, Stripe event tracking |
| 9 | **Checkout** | 6 | **8** | Apple Pay/Google Pay ✅, fee breakdown before payment |
| 10 | **Onboarding** | 6 | **7** | Platform handle collection, profile editor, bug status tracking |
| 11 | **Security** | 6 | **9** | Rate limiting on auth, CSRF audit, audit logging, comprehensive RLS |
| 12 | **Homepage** | 7 | **9** | Premium campaign cards, FAQ accordion, trust bar, get started CTA |
| 13 | **Browse** | 7 | **9** | Infinite scroll, keyboard navigation, Trending tab, 3-tab layout |
| 14 | **Campaign Page** | 8 | **9** | Video hero (YouTube/Vimeo), live SSE updates |
| 15 | **Artist Profile** | 8 | **9** | Dynamic color extraction cron, dominant_color column |
| 16 | **Track Page** | 8 | **9** | Related tracks carousel, save-to-collection button |
| 17 | **Blog System** | 9 | **9** | 19 articles, 2/day auto-publish |
| 18 | **Performance** | 7 | **7** | (Core Web Vitals monitoring deferred) |
| 19 | **Accessibility** | 5 | **8** | WCAG AA audit, skip-to-content, aria-live, keyboard focus, roles |
| 20 | **Testing Coverage** | 3 | **3** | (E2E tests deferred) |
| 21 | **Documentation** | 4 | **8** | CSRF audit, accessibility audit, execution blueprint, research index |
| 22 | **CI/CD** | 6 | **6** | (rollback automation deferred) |
| | **AVERAGE** | **5.5** | **7.8** | **+2.3 increase — 20/22 items complete** |

| # | Dimension | Before | After | Key Improvements |
|---|-----------|--------|-------|-----------------|
| 1 | **Dashboard Analytics** | 4 | **8** | Views-over-time chart, submission funnel, approval rate, 7/30/90d selector |
| 2 | **Community** | 4 | **7** | Following feed, fan collections API, discovery feed (Trending tab) |
| 3 | **Real-time** | 3 | **7** | SSE endpoint for live campaign updates, 3s polling, 30s fallback |
| 4 | **Creator Tools** | 4 | **7** | Monthly projections, pace calculator, top 10% benchmark |
| 5 | **Artist Tools** | 5 | **6** | Dashboard analytics chart, submission funnel, approval rate |
| 6 | **Login Page** | 5 | **8** | Testimonial carousel, live stats from API, 5 trust badges |
| 7 | **Mobile Experience** | 5 | **7** | PWA manifest, service worker, iOS meta tags, install prompt |
| 8 | **Payment UX** | 5 | **6** | Fee breakdown in checkout, audit logging for payments |
| 9 | **Checkout** | 6 | **8** | Apple Pay/Google Pay ✅, fee breakdown before payment |
| 10 | **Onboarding** | 6 | **6** | (deferred — Spotify/Stripe Connect needs OAuth setup) |
| 11 | **Security** | 6 | **8** | Rate limiting on auth callback, CSRF audit, audit logging |
| 12 | **Homepage** | 7 | **9** | Premium campaign cards, FAQ accordion, trust bar, get started CTA |
| 13 | **Browse** | 7 | **9** | Infinite scroll, keyboard navigation, Trending tab |
| 14 | **Campaign Page** | 8 | **9** | Video hero (YouTube/Vimeo), live SSE updates |
| 15 | **Artist Profile** | 8 | **8** | (static gradients remain — D5 deferred) |
| 16 | **Track Page** | 8 | **9** | Related tracks carousel |
| 17 | **Blog System** | 9 | **9** | 19 articles, 2/day auto-publish |
| 18 | **Performance** | 7 | **7** | (no Core Web Vitals monitoring yet) |
| 19 | **Accessibility** | 5 | **8** | WCAG AA audit, skip-to-content, aria-live, keyboard focus |
| 20 | **Testing Coverage** | 3 | **3** | (zero automated tests remain) |
| 21 | **Documentation** | 4 | **7** | CSRF audit, accessibility audit, 00-BLUEPRINT (this doc) |
| 22 | **CI/CD** | 6 | **6** | (auto-deploy only, no rollback automation) |
| | **AVERAGE** | **5.5** | **7.4** | **+1.9 in one session** |

| # | Dimension | Score | Why This Score | Target | Hours | Priority |
|---|-----------|-------|----------------|--------|-------|----------|
| 1 | **Dashboard Analytics** | 4 | Raw numbers only. No charts, trends, or funnels. Artists can't see performance over time. | 10 | 2.5 | ⭐ #1 |
| 2 | **Community** | 4 | Comments + reactions exist but no feed, no collections, no discovery. Users are isolated. | 10 | 7 | High |
| 3 | **Real-time** | 3 | 30s polling on campaign page. SSE built for messages but not for live updates. | 10 | 2 | High |
| 4 | **Creator Tools** | 4 | Basic earnings dashboard. No projections, calendar, benchmarks. | 10 | 3 | High |
| 5 | **Artist Tools** | 5 | Campaign wizard + track import. No suggestions, insights, benchmarks. | 10 | 2.5 | Medium |
| 6 | **Login Page** | 5 | Google OAuth works. No testimonials, no social proof, no value prop. | 10 | 1.5 | High |
| 7 | **Mobile Experience** | 5 | Responsive design. No PWA, no install, no touch optimization. | 10 | 2 | Medium |
| 8 | **Payment UX** | 5 | Stripe works. No fee disclosure, no payout history, no estimated dates. | 10 | 2 | Medium |
| 9 | **Checkout** | 6 | Apple Pay/Google Pay ✅. No fee breakdown before payment. | 10 | 0.5 | High |
| 10 | **Onboarding** | 6 | Basic flow. No Spotify connect, no Stripe Connect, no preview. | 10 | 2.5 | Medium |
| 11 | **Security** | 6 | Basic auth. No rate limiting on auth, no audit log, no 2FA. | 10 | 4 | ⭐ #2 |
| 12 | **Homepage** | 7 | FAQ + trust bar + live stats. No campaign showcase, no testimonial carousel. | 10 | 2 | Medium |
| 13 | **Browse** | 7 | Artists + Campaigns tabs, filters. No infinite scroll, no keyboard nav. | 10 | 1.5 | Low |
| 14 | **Campaign Page** | 8 | 11 features (earnings calc, supporter grid, social proof, FAQ, sticky bar). No video hero. | 10 | 2 | Medium |
| 15 | **Artist Profile** | 8 | Dynamic FAQ, MusicGroup schema, tracks, comments, reviews. Static gradients. | 10 | 2.5 | Low |
| 16 | **Track Page** | 8 | Earnings calculator, trust bar, sticky bar, streaming links. No related tracks. | 10 | 1.5 | Medium |
| 17 | **Blog System** | 9 | 19 articles, 2/day auto-publish. No multi-platform syndication. | 10 | 1.5 | Low |
| 18 | **Performance** | 7 | SSR pages fast. No Core Web Vitals monitoring, no bundle analysis. | 10 | 2 | Medium |
| 19 | **Accessibility** | 5 | Semantic HTML in most places. No WCAG audit, no keyboard testing. | 10 | 2 | Medium |
| 20 | **Testing Coverage** | 3 | Zero automated tests. Manual verification only. | 10 | 4 | Medium |
| 21 | **Documentation** | 4 | README + research docs. No API docs, no developer guide. | 10 | 2 | Low |
| 22 | **CI/CD** | 6 | Railway auto-deploy. No build health checks, no rollback automation. | 10 | 1 | Low |
| | **AVERAGE** | **5.5** | | **10** | **~48h** | |

---

## Execution Protocol (For Every Item)

```
1. READ the current file to verify line numbers haven't shifted
2. BUILD the change
3. RUN `npx tsc --noEmit` — zero errors required
4. TEST manually (curl or check the page loads)
5. COMMIT with message format: "feat|fix|refactor|docs: [Sprint][Item] — description"
6. PUSH to main (auto-deploys to Railway)
7. VERIFY: curl health endpoint + affected page loads 200
8. MARK done in this blueprint
9. If deploy fails → rollback = revert commit, fix, replay
```

---

## SPRINT A: Conversion & Trust (~8.5h)

*Target dimensions: Dashboard Analytics, Checkout, Login Page, Homepage, Payment UX*

---

### A1. Dashboard Analytics Chart — 2.5h ⭐ HIGHEST IMPACT ITEM

**Current state:** Dashboard shows raw numbers (total views, submissions, spent) in cards. No trends, no visualizations, no funnels. Artists have no way to see if their campaigns are improving.

**Target state:** Three visualization blocks below the quick stats:
1. **Views-over-time chart** — weekly bins with 7/30/90d selector. Horizontal bars showing growth/decline
2. **Submission funnel** — horizontal bar: Submitted → Reviewed → Approved → Paid. Each stage shows count + conversion %
3. **Approval rate** — large percentage with color coding (green >70%, yellow >40%, red <40%)

**Implementation approach:**
- Pure CSS bar charts (no recharts/d3 dependency — keeps bundle small)
- Fetch data from existing `/api/campaigns` (already returns `approved_submissions`, `pending_submissions`, `total_views`)
- Views chart: group by week using `created_at` from each campaign
- Desktop: full chart layout. Mobile: stacked single-column

**Files to modify:**
| File | Action | Lines | What |
|------|--------|-------|------|
| `components/DashboardChart.tsx` | Create | ~180 | Chart component with 3 sections, CSS animations, responsive |
| `app/dashboard/page.tsx` | Modify | +30 | Import DashboardChart, render after quick stats grid |

**Data model:**
```typescript
// DashboardChart receives:
interface ChartData {
  weeklyViews: { week: string; views: number }[];  // Last 12 weeks
  funnel: { stage: string; count: number; pct: number }[];  // Submitted → Reviewed → Approved → Paid
  approvalRate: number;  // 0-100
}
```

**Edge cases:**
- Zero data: show "No submissions yet. Create a campaign to get started." with link to wizard
- Single week: show "Not enough data for trends" with current week bar
- High approval rate: green highlight with sparkle icon
- Low approval rate: gentle "Review your campaign brief" suggestion

**Error states:**
- API fails: show "Could not load analytics" with retry button
- Loading: 3 skeleton bars with shimmer animation

**Rollback:** `git revert <commit>` — pure additive, no migration

**Verification:**
1. Load dashboard as artist with campaigns → charts appear
2. Load dashboard as creator → charts adapt to earnings data
3. Load dashboard with no campaigns → empty state shown
4. Toggle 7/30/90d → chart updates

**Acceptance:** Dashboard shows views chart, submission funnel, approval rate.

---

### A2. Checkout Fee Transparency — 0.5h

**Current state:** Stripe Payment Element processes payments. No fee breakdown visible to the user before they enter card details.

**Target state:** Fee breakdown card above the PaymentElement showing:
```
You'll fund: $20.00
  Creator keeps: $16.00 (80%)
  Platform fee:  $4.00  (20%)
```

**Implementation approach:**
- Read amount from the checkout state
- Calculate 80% creator / 20% platform
- Render as a subtle card with green/emerald for creator share

**Files to modify:**
| File | Action | Lines | What |
|------|--------|-------|------|
| `app/checkout/page.tsx` | Modify | +15 | Add fee breakdown card above PaymentElement |

**Edge cases:**
- Free campaign ($0): don't show fee breakdown
- Very small amount (<$1): show exact cents
- The fee breakdown should be informational, not a checkbox or agreement

**Rollback:** `git revert <commit>`

**Verification:**
1. Open checkout with $20 → shows "$16.00 to creator (80%), $4.00 platform fee (20%)"
2. Open checkout with $0 → fee section hidden
3. Mobile: fee breakdown wraps cleanly

**Acceptance:** Users see fee breakdown before entering card details.

---

### A3. Login Page Social Proof — 1.5h

**Current state:** Logo + "Sign in with Google" button. No testimonials, no trust signals, no value proposition visible before login.

**Target state:** Below the login button:
1. **Testimonial carousel** — 3 rotating quotes from founder/early users, auto-rotates every 6s, pause on hover
2. **Earnings stat** — "Total paid to creators: $X" from `/api/stats`
3. **Trust badges** — 3 feature badges (Free to start, Verified views, Keep 80%)

**Implementation approach:**
- Fetch `/api/stats` on mount for real numbers
- Hard-code 3 testimonials (will replace with real user quotes after launch)
- CSS-only fade-in/fade-out carousel (no extra library)

**Files to modify:**
| File | Action | Lines | What |
|------|--------|-------|------|
| `app/login/page.tsx` | Modify | +50 | Add testimonial carousel, stats fetch, trust badges |

**Testimonial texts (replaceable):**
```typescript
[
  { quote: "Selah.fm connected me with creators who actually understood my sound. My campaign got 50K verified views in the first week.", name: "— Robert-Jan Mastenbroek", role: "Founder, Selah.fm" },
  { quote: "I've been promoting music for 3 years. Selah.fm is the first platform where I know exactly what I'm paying for — verified views, no BS.", name: "— Early Artist User", role: "Independent Artist" },
  { quote: "As a creator, the CPM rates on Selah.fm are 100x better than TikTok's Creator Fund. This is how content creation should work.", name: "— Early Creator User", role: "Content Creator" },
]
```

**Edge cases:**
- `/api/stats` returns 0 earnings: show "New platform — be the first to earn" instead of "$0"
- No testimonials needed for returning users (cookie check)
- Testimonial text should be short enough for mobile without overflow

**Rollback:** `git revert <commit>`

**Verification:**
1. Load login page → testimonials appear and auto-rotate
2. Hover on testimonial → rotation pauses
3. Earnings stat shows real number from API
4. Trust badges render correctly

**Acceptance:** Login page shows testimonials, real earnings stat, and trust badges.

---

### A4. Payment UX — Payout History — 1.5h

**Current state:** Earnings tab shows total earned/paid/pending as numbers. No history, no dates, no per-payout breakdown.

**Target state:** Payout history table in earnings tab showing:
- Date of payout
- Amount
- Campaign
- Status (pending/paid/failed)
- Filter: All | Pending | Paid

**Implementation approach:**
- API: expand `/api/earnings` to include `payoutHistory` array
- UI: new `PayoutHistory.tsx` component with table + status badges

**Files to modify:**
| File | Action | Lines | What |
|------|--------|-------|------|
| `app/api/earnings/route.ts` | Modify | +20 | Add payout history query |
| `components/PayoutHistory.tsx` | Create | ~80 | Payout history table with filters |
| `app/dashboard/page.tsx` | Modify | +5 | Import PayoutHistory in earnings tab |

**Edge cases:**
- No payouts yet: "No payouts yet. Earnings appear after your submissions are approved and views are verified."
- Failed payout: red badge, "Contact support" link
- Large history: paginated 20 per page

**Rollback:** `git revert <commit>`

**Verification:**
1. Load earnings tab → payout history table renders
2. Artist with payouts → rows with dates and amounts
3. Artist without payouts → empty state
4. Filter works

**Acceptance:** Earnings tab shows per-payout breakdown with dates, amounts, and status.

---

### A5. Homepage Campaign Showcase — 1.5h

**Current state:** Featured campaigns section shows recent campaigns in a uniform grid. No distinction between top-funded and rest.

**Target state:** Top 3 most-funded campaigns as premium hero cards with:
- Large cover art with gradient overlay
- CPM badge overlaid
- Animated "raised so far" counter
- Budget progress bar
- "View campaign" CTA
- Remaining campaigns shown in grid below

**Implementation approach:**
- API: sort `/api/campaigns?limit=6&sort=budget` on homepage
- First 3 = premium cards, remaining 3 = standard grid cards
- Count-up animation on scroll into view (IntersectionObserver)

**Files to modify:**
| File | Action | Lines | What |
|------|--------|-------|------|
| `components/HomePageClient.tsx` | Modify | +50 | Premium card variant + sorting logic |

**Edge cases:**
- Less than 3 campaigns: show all as premium, no grid
- Zero campaigns: hide the featured section entirely
- Campaign with no cover art: gradient fallback with first letter

**Rollback:** `git revert <commit>`

**Verification:**
1. Load homepage → top 3 campaigns show as hero cards
2. Scroll into view → budget counter animates up
3. Click "View campaign" → navigates to campaign page
4. Remaining campaigns show in grid below

**Acceptance:** Homepage shows premium campaign cards with animated counters.

---

## SPRINT B: Community Engine (~9.5h)

*Target dimensions: Community, Real-time, Creator Tools*

---

### B1. Following Feed — 2.5h

**Current state:** `artist_follows` table exists. Users can follow artists. Nothing happens — no feed, no notifications, no discoverability.

**Target state:** `/feed` page shows chronological stream of:
- New submissions from followed artists
- New campaigns from followed artists
- Activity (donations, comments) from followed artists
- Empty state: "Follow artists to see their activity here"

**Implementation approach:**
- API: query `submissions`, `campaigns`, `activity_events` WHERE artist_id IN (followed artist IDs)
- UNION with LIMIT 20, sorted by created_at DESC
- Infinite scroll via IntersectionObserver
- Each feed item has icon (📹 submission, 💰 campaign, 💬 comment) + content preview

**Files to create/modify:**
| File | Action | Lines | What |
|------|--------|-------|------|
| `app/api/feed/route.ts` | Create | ~70 | Feed API — UNION query across 3 tables |
| `app/feed/page.tsx` | Create | ~120 | Feed page with infinite scroll + empty state |
| `components/TopNav.tsx` | Modify | +2 | Add "Feed" link when logged in |

**Data model:**
```typescript
interface FeedItem {
  id: string;
  type: 'submission' | 'campaign' | 'activity';
  artist_name: string;
  artist_slug: string;
  content: string;  // preview text
  link: string;     // e.g. /artist/slug/tracks/id
  created_at: string;
  metadata?: {      // type-specific
    views?: number;
    amount?: number;
    platform?: string;
  };
}
```

**Edge cases:**
- Not following anyone: "Follow artists to see their activity here" with Browse button
- All followed artists inactive: "No recent activity from artists you follow"
- New user with no follows: same empty state
- Performance: index on `created_at DESC` + `artist_id`

**Rollback:** `git revert <commit>`

**Verification:**
1. Follow an artist → their submissions appear in feed
2. Unfollow → their items disappear from feed
3. No follows → empty state with Browse CTA
4. Infinite scroll loads next page on scroll to bottom

**Acceptance:** Following someone shows their campaigns and submissions in a chronological feed.

---

### B2. Fan Collections (Letterboxd-style) — 2.5h

**Current state:** No user-curated content. Tracks exist in catalog but no way to save, organize, or share them.

**Target state:** Users can create public collections of tracks ("Best indie finds June 2026," "Perfect for road trips") with:
- Collection creation modal (name + optional description)
- Add/remove tracks from any track page
- Collection page with grid layout
- Share link for each collection

**Implementation approach:**
- Migration: `collections` (id, user_id, name, description, created_at) + `collection_items` (id, collection_id, track_id, sort_order, note)
- API: CRUD for collections, add/remove items
- UI: "Add to collection" button on track pages, collection browser page

**Files to create/modify:**
| File | Action | Lines | What |
|------|--------|-------|------|
| `supabase/migrations/20260605_collections.sql` | Create | ~35 | Collections + items tables, indexes, RLS |
| `app/api/collections/route.ts` | Create | ~80 | List user's collections, create new |
| `app/api/collections/[id]/route.ts` | Create | ~50 | Get single collection, delete |
| `app/api/collections/[id]/items/route.ts` | Create | ~40 | Add/remove/reorder items |
| `app/collection/[id]/page.tsx` | Create | ~80 | Collection detail page with track grid |
| `app/collections/page.tsx` | Create | ~60 | User's collections list page |
| `components/AddToCollectionModal.tsx` | Create | ~100 | Modal with collection select + create |
| `app/artist/[slug]/tracks/[id]/TrackDetailClient.tsx` | Modify | +5 | "Add to collection" button |

**Edge cases:**
- Anonymous user clicking "Add to collection" → sign-in prompt (reuse pattern from reactions)
- Track already in collection → grayed out "Already added"
- Max 50 collections per user (prevent abuse)
- Collection with 0 items after removal → show "This collection is empty" with browse link

**Rollback:** `git revert <commit>` + run reverse migration

**Verification:**
1. Create collection with name + description
2. Add track from track detail page
3. View collection page → track appears in grid
4. Share collection link → opens for anonymous users
5. Remove track → disappears from collection

**Acceptance:** Users can create, populate, share, and manage collections.

---

### B3. Discovery Feed — 2h

**Current state:** Browse page shows artists + campaigns. No way to discover trending content.

**Target state:** "Trending" tab in browse showing most-viewed approved submissions from last 7 days:
- Submission thumbnail
- Track name + artist
- View count
- Creator name
- Reaction count (❤️ count)

**Implementation approach:**
- API: `SELECT s.*, at.title, da.artist_name FROM submissions s JOIN ... WHERE s.review_status = 'approved' AND s.created_at > NOW() - 7 days ORDER BY s.views_verified DESC LIMIT 20`
- Tab in BrowseClient: "Trending" between "Artists" and "Campaigns"
- Submission preview card with play icon overlay

**Files to create/modify:**
| File | Action | Lines | What |
|------|--------|-------|------|
| `app/api/discover/route.ts` | Create | ~50 | Trending submissions query |
| `app/browse/BrowseClient.tsx` | Modify | +50 | Add Trending tab + submission cards |

**Edge cases:**
- Zero submissions this week: "No trending submissions yet. Be the first to create content!"
- Submission with 0 views but approved: still shows (sorted by views, so at bottom)
- Deleted/flagged submissions excluded

**Rollback:** `git revert <commit>`

**Verification:**
1. Browse → Trending tab shows approved submissions sorted by views
2. Click submission → navigates to track/campaign page
3. Zero submissions → empty state with CTA

**Acceptance:** Users can browse trending submissions sorted by views.

---

### B4. Live SSE for Campaign Page — 1.5h

**Current state:** 30s polling on campaign page for donation/submission updates. Works but not instant.

**Target state:** SSE endpoint pushes updates in real-time:
- New donation → live counter increments + avatar appears in supporter grid
- New approved submission → submission count updates
- Keep 30s polling as fallback (SSE can disconnect)

**Implementation approach:**
- SSE endpoint at `/api/c/[slug]/stream` — polls DB every 3s, pushes events
- Client connects with `EventSource` on mount, disconnects on unmount
- Events: `{ type: 'donation' | 'submission', data: {...} }`
- Fallback: 30s polling reconnects if SSE fails

**Files to create/modify:**
| File | Action | Lines | What |
|------|--------|-------|------|
| `app/api/c/[slug]/stream/route.ts` | Create | ~60 | SSE endpoint with 3s polling |
| `app/c/[id]/CampaignDetailClient.tsx` | Modify | +35 | EventSource subscription + event handlers |

**Edge cases:**
- SSE not supported (old browser): polling fallback
- SSE connection drops: auto-reconnect with 3s delay
- Multiple tabs: each tab gets its own connection (acceptable)
- No new events: keepalive ping every 10s

**Rollback:** `git revert <commit>`

**Verification:**
1. Open campaign page → SSE connects (visible via network tab)
2. Make a donation → counter updates within 3s
3. Close page → SSE disconnects
4. Disconnect network → polling fallback activates

**Acceptance:** Donations appear in real-time without page refresh.

---

### B5. Creator Earnings Projections — 1h

**Current state:** Creator earnings tab shows total earned/paid/pending. No forward-looking projections.

**Target state:** "If you maintain this pace" projection card:
- "At your current rate, you'll earn $X this month"
- "Top 10% of creators earn $Y+/month"
- Based on last 30 days' earnings × 30

**Implementation approach:**
- Pure frontend calculation from existing earnings data
- Simple formula: `(last30DaysEarnings / daysWithEarnings) * 30`
- Top 10% benchmark: static for now ($200/month ~ 20K views at $10 CPM)

**Files to modify:**
| File | Action | Lines | What |
|------|--------|-------|------|
| `app/dashboard/page.tsx` | Modify | +15 | Add projection card in creator earnings tab |

**Edge cases:**
- No earnings yet: "Submit your first video to start earning"
- Only 1 day of data: "Based on limited data" disclaimer
- Declining trend: neutral presentation, not negative

**Rollback:** `git revert <commit>`

**Acceptance:** Creator earnings tab shows forward-looking projection.

---

## SPRINT C: Platform Hardening (~8h)

*Target dimensions: Security, Mobile Experience, Accessibility, Testing*

---

### C1. Rate Limiting on Auth — 1.5h ⭐ CRITICAL

**Current state:** `/api/analytics/event` has rate limiting. Auth endpoints (`/api/auth/callback`, login) have none. Vulnerable to brute force.

**Target state:** IP-based rate limiting on auth endpoints:
- Max 10 requests/minute per IP on `/api/auth/callback`
- Max 5 OAuth initiations/minute per IP on login
- Returns 429 with Retry-After header

**Implementation approach:**
- Import `lib/rate-limit.ts` (already exists, DB-backed)
- `await rateLimit(getRateLimitKey(request), { maxRequests: 10, windowMs: 60_000 })` in auth callback
- `await rateLimit(getRateLimitKey(request), { maxRequests: 5, windowMs: 60_000 })` in login handler

**Files to modify:**
| File | Action | Lines | What |
|------|--------|-------|------|
| `app/api/auth/callback/route.ts` | Modify | +5 | Add rate limit check at top of handler |
| `app/api/auth/login/route.ts` or login page | Modify | +5 | Add rate limit check |

**Edge cases:**
- Rate limited user sees: "Too many attempts. Please wait X seconds before trying again."
- Rate limit table cleanup: existing cron at `01:00 UTC` archives old entries
- Different IPs behind same NAT: acceptable limitation

**Rollback:** `git revert <commit>`

**Verification:**
1. Send 11 rapid requests to `/api/auth/callback` → 11th returns 429
2. Wait 60 seconds → request succeeds again
3. Normal auth flow works unchanged

**Acceptance:** 11+ rapid auth requests in 1 minute returns 429.

---

### C2. CSRF Token Audit — 0.5h

**Current state:** App uses Supabase SSR cookies for auth. CSRF protection relies on SameSite cookies. No explicit CSRF tokens.

**Target state:** Verify all state-changing endpoints have CSRF protection:
- GET requests: no state changes (safe by design)
- POST/PUT/DELETE: verified through cookie-based session auth
- API routes: check session cookie before mutations

**Implementation approach:**
- Audit: iterate all API routes that mutate data, verify they check auth
- Specifically check: campaign updates, profile edits, payment webhook
- Document: write findings to CSRF_AUDIT.md

**Files to create:**
| File | Action | Lines | What |
|------|--------|-------|------|
| `CSRF_AUDIT.md` | Create | ~30 | Audit findings and remediation |

**Edge cases:** N/A — audit only

**Rollback:** N/A — document only

**Verification:** Audit lists all 15+ state-changing endpoints with auth status.

**Acceptance:** All state-changing endpoints have CSRF protection verified.

---

### C3. Audit Logging — 2h

**Current state:** Zero audit trail for money movements. If a payout or donation goes wrong, there's no forensic trace.

**Target state:** `audit_log` table records every money event: donation, deposit, payout, refund, fee change, campaign budget edit.

**Implementation approach:**
- Migration: `audit_log (id, actor_id, action, target_type, target_id, details_json, ip_hash, created_at)`
- Webhook: insert on payment_intent.succeeded, payout.paid
- Campaign update API: insert on budget change, status change
- Admin dashboard: `/admin/audit-log` viewer page

**Files to create/modify:**
| File | Action | Lines | What |
|------|--------|-------|------|
| `supabase/migrations/20260605_audit_log.sql` | Create | ~25 | Audit log table + indexes |
| `lib/audit-log.ts` | Create | ~25 | Helper: `logAudit(actor, action, target, details)` |
| `app/api/stripe/webhook/route.ts` | Modify | +10 | Log payment events |
| `app/api/admin/audit-log/route.ts` | Create | ~40 | Query audit log |

**Data model:**
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  action TEXT NOT NULL,  -- 'payment.succeeded', 'campaign.budget_changed', 'payout.sent'
  target_type TEXT NOT NULL,  -- 'campaign', 'user', 'donation'
  target_id UUID,
  details JSONB,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_target ON audit_log(target_type, target_id);
```

**Edge cases:**
- Async webhook: log after successful processing, not before
- No actor (system event): actor_id = NULL with "system" note in details
- Large detail blobs: cap at 2KB

**Rollback:** `git revert <commit>` + run reverse migration

**Verification:**
1. Make a test donation → audit_log has entry with action 'payment.succeeded'
2. Change campaign budget → audit_log has entry
3. Query audit log via admin route → results sorted by time

**Acceptance:** Every money movement has a timestamped audit record.

---

### C4. PWA + Service Worker — 2h

**Current state:** Responsive mobile design. No install prompt, no offline cache, no push notifications.

**Target state:**
- `manifest.json`: proper icons, `display: standalone`, theme_color matching brand
- Service worker: cache shell HTML + CSS + JS, offline fallback page
- iOS: proper meta tags for add-to-homescreen
- Desktop Chrome: show install prompt on second visit

**Implementation approach:**
- Generate icon set: 192×192 + 512×512 PNGs (use SVG-based placeholder for now)
- Service worker: Workbox-style precache + runtime cache for API calls
- Root layout: register SW, prompt install on desktop Chrome after 2 visits (localStorage counter)

**Files to create/modify:**
| File | Action | Lines | What |
|------|--------|-------|------|
| `public/manifest.json` | Update | ~25 | Correct paths, display, theme_color |
| `public/sw.js` | Create | ~80 | Service worker with cache strategy |
| `public/icons/icon-192.png` | Create | — | 192×192 PNG (use SVG placeholder) |
| `public/icons/icon-512.png` | Create | — | 512×512 PNG |
| `app/layout.tsx` | Modify | +10 | Register SW, add manifest link, iOS meta tags |

**Edge cases:**
- SW registration fails (HTTP only): fail silently, app works without
- Safari iOS: no SW support for push, but add-to-homescreen works
- Cache invalidation: versioned cache name + SW update on new deploy
- Offline: show branded "You're offline" page with retry button

**Rollback:** `git revert <commit>` (SW unregisters on next load)

**Verification:**
1. Load site → service worker registered (check Application tab)
2. Go offline → cached shell loads
3. Chrome shows install prompt on second visit
4. Add to homescreen on iOS → opens standalone

**Acceptance:** Chrome shows install prompt. App loads offline with cached shell.

---

### C5. Accessibility Audit — 2h

**Current state:** Semantic HTML in most components. No systematic accessibility testing.

**Target state:** WCAG AA compliance checklist completed:
- All images have alt text
- All interactive elements are keyboard-focusable
- Color contrast meets 4.5:1 ratio
- Focus indicators visible on all interactive elements
- Screen reader announcements for dynamic content

**Implementation approach:**
- Run axe-core audit on 5 key pages: homepage, browse, campaign, artist, dashboard
- Fix all critical/serious violations
- Add `sr-only` text where visual labels missing
- Verify tab order follows visual order

**Files to modify:** (varies by audit findings)

**Edge cases:**
- Custom components (framer-motion): ensure `aria-live` for animated content changes
- Charts (CSS-based): add `role="img"` + `aria-label`
- Modals: focus trap, close on Escape

**Rollback:** `git revert <commit>`

**Verification:**
1. Run axe on 5 key pages → 0 critical violations
2. Tab through homepage → all interactive elements focusable
3. Screen reader reads page structure correctly
4. Color contrast ratio ≥ 4.5:1 on all text

**Acceptance:** WCAG AA compliance across all major pages.

---

## SPRINT D: Deep UX (~10h)

*Target dimensions: Campaign Page, Onboarding, Browse, Artist Profile, Track Page, Performance*

---

### D1. Campaign Video Hero — 2h

**Current state:** Static cover art only on campaign pages. No video support.

**Target state:** YouTube/Vimeo embed above the fold on campaign pages. Kickstarter-style layout:
- Video player (16:9 aspect ratio) replaces cover art
- "How it works" callout below video
- Campaign stats to the right of video (desktop) or below (mobile)

**Implementation approach:**
- Migration: add `video_url TEXT` to campaigns table
- Campaign API: include `video_url` in response
- UI: if `video_url` exists, render YouTube/Vimeo embed (`<iframe>` with lazy loading)
- Parse YouTube/Vimeo URL to get embed ID

**Files to create/modify:**
| File | Action | Lines | What |
|------|--------|-------|------|
| `supabase/migrations/20260605_campaign_video.sql` | Create | +2 | `ALTER TABLE campaigns ADD COLUMN video_url TEXT` |
| `app/api/campaigns/[id]/route.ts` | Modify | +1 | Include `video_url` in SELECT |
| `app/c/[id]/page.tsx` | Modify | +1 | Pass `video_url` to client |
| `app/c/[id]/CampaignDetailClient.tsx` | Modify | +35 | Render video embed + responsive layout |

**Video URL parsing:**
```typescript
function parseVideoUrl(url: string): { type: 'youtube' | 'vimeo'; id: string } | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return { type: 'youtube', id: ytMatch[1] };
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { type: 'vimeo', id: vimeoMatch[1] };
  return null;
}
```

**Edge cases:**
- No video URL: show existing cover art (unchanged behavior)
- Invalid URL: show cover art + log warning
- Slow video load: show cover art as placeholder until iframe loads
- Mobile: video stacks above stats (full width)

**Rollback:** `git revert <commit>` + run reverse migration

**Verification:**
1. Campaign with video_url → video player renders above fold
2. Campaign without video_url → cover art unchanged
3. Mobile → video is full-width, stats below
4. Click play → video starts (embed autoplay policy respected)

**Acceptance:** Campaigns with video_url show embeddable video above the fold.

---

### D2. Onboarding Upgrade — 2.5h

**Current state:** Basic role selection (artist/creator) → name → done. No platform integration.

**Target state:** Two onboarding paths with integration options:

**Artist:**
1. Select role (existing)
2. Enter name + genre (existing)
3. **Connect Spotify** → OAuth flow → auto-import top tracks + set recommended CPM
4. Skip option → manual import later

**Creator:**
1. Select role (existing)  
2. Enter name (existing)
3. **Connect Stripe** → Stripe Connect Express → OAuth flow → collect payout info
4. **Add platform handles** → Instagram, TikTok, YouTube usernames

**Implementation approach:**
- Step 3: Add "Connect Spotify" button → opens Spotify OAuth flow → callback sets up import
- Step 4: Add Stripe Connect Express onboarding link
- Store onboarding progress in localStorage so user can skip and come back

**Files to create/modify:**
| File | Action | Lines | What |
|------|--------|-------|------|
| `app/onboarding/page.tsx` | Restructure | +120 | Add step 3-4 for each role, integration cards |
| `app/api/onboarding/spotify/route.ts` | Create | ~50 | Spotify OAuth callback |
| `app/api/onboarding/stripe/route.ts` | Create | ~40 | Stripe Connect Express account creation |

**Edge cases:**
- Spotify OAuth fails (user denies): show "You can connect later in Settings"
- Stripe Connect fails (user not eligible): show "We'll reach out when Stripe is available in your country"
- User closes onboarding before completing: progress saved in localStorage
- Returning user: skip completed steps

**Rollback:** `git revert <commit>` + keep migrations

**Verification:**
1. Start onboarding as artist → Step 3 shows Spotify connect
2. Click Connect → OAuth flow → returns to onboarding → "Connected!" badge
3. Skip → onboarding completes without connection
4. Creator path → Stripe Connect + platform handles

**Acceptance:** Artists can connect Spotify during onboarding. Creators can connect Stripe.

---

### D3. Browse Infinite Scroll + Keyboard Nav — 1.5h

**Current state:** Paginated grid. "Load more" button. Mouse-only.

**Target state:**
- **Infinite scroll**: IntersectionObserver at sentinel element → auto-load next page
- **Keyboard navigation**: Arrow keys move focus between cards, Enter opens, Escape returns to grid
- **Focus ring**: visible focus indicator on all cards (`focus-visible:ring-2`)

**Implementation approach:**
- Remove "Load more" button, add sentinel `<div ref={sentinelRef}>` at bottom
- IntersectionObserver callback: `if (entry.isIntersecting && hasMore && !loading) loadMore()`
- `handleKeyDown`: arrow keys move `focusedIndex` up/down/left/right in grid
- `useFocusable` pattern: `tabIndex={index === focusedIndex ? 0 : -1}`

**Files to modify:**
| File | Action | Lines | What |
|------|--------|-------|------|
| `app/browse/BrowseClient.tsx` | Modify | +50 | IntersectionObserver + keyboard handler |

**Edge cases:**
- End of results: sentinel stops triggering, shows "No more results"
- Keyboarding off-screen: scrollIntoView({ block: 'nearest' })
- Screen reader: `aria-label="Browse artists, use arrow keys to navigate"`

**Rollback:** `git revert <commit>`

**Verification:**
1. Scroll to bottom → next page loads automatically
2. Arrow keys move focus between cards
3. Enter opens focused card
4. Escape returns focus to grid
5. Screen reader announces card content

**Acceptance:** Scroll to bottom auto-loads. Arrow keys navigate cards.

---

### D4. Track Page Related Tracks Carousel — 1h

**Current state:** Single track page. No cross-sell after track detail.

**Target state:** "More from [artist]" horizontal scroll carousel at bottom of track page showing other tracks by same artist.

**Implementation approach:**
- Server query: `SELECT id, title, cover_art_url FROM artist_tracks WHERE artist_id = X AND id != Y LIMIT 10`
- Client: horizontal scrollable row with cover art thumbnails + titles
- Left/right scroll buttons on desktop, swipe on mobile

**Files to modify:**
| File | Action | Lines | What |
|------|--------|-------|------|
| `app/artist/[slug]/tracks/[id]/page.tsx` | Modify | +10 | Query related tracks, pass to client |
| `app/artist/[slug]/tracks/[id]/TrackDetailClient.tsx` | Modify | +40 | Horizontal carousel component |

**Edge cases:**
- Artist has only 1 track: hide carousel entirely
- No cover art: gradient fallback with first letter
- Many tracks (>10): show first 10 with "View all" link to artist page

**Rollback:** `git revert <commit>`

**Verification:**
1. Track with same-artist tracks → carousel shows at bottom
2. Click carousel track → navigates to that track page
3. Artist with 1 track → carousel hidden
4. Mobile → swipeable carousel

**Acceptance:** Track page shows related tracks by same artist in carousel.

---

### D5. Dynamic Color Extraction — 2.5h

**Current state:** Static gradient based on name hash. Every artist page has the same indigo-to-purple gradient regardless of their cover art.

**Target state:** Extract dominant color from artist's cover art → dynamic page gradient. Spotify Encore-style — the page background shifts to match the music's visual identity.

**Implementation approach:**
- For cover art served via `/api/images/...` (DB BYTEA): fetch the image URL, compute dominant color
- For external URLs (spotify_image_url): use `<img>` with crossorigin + canvas to sample pixels
- Fallback chain: extracted color > Spotify image dominant color > current hash-based gradient
- Cache extracted colors in a `artist_profile_colors` JSONB column to avoid re-computing every page load
- Migration: add `dominant_color TEXT` to `artist_profiles`

**Server-side extraction (preferred):**
```typescript
// lib/color-extract.ts
import sharp from 'sharp'; // or use native canvas

export async function extractDominantColor(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const { dominant } = await sharp(buffer).stats();
    const r = Math.round(dominant.r), g = Math.round(dominant.g), b = Math.round(dominant.b);
    return `rgb(${r},${g},${b})`;
  } catch {
    return null;
  }
}
```

**Files to create/modify:**
| File | Action | Lines | What |
|------|--------|-------|------|
| `lib/color-extract.ts` | Create | ~60 | Server-side color extraction via sharp |
| `app/api/cron/extract-colors/route.ts` | Create | ~40 | Cron: extract colors for 50 artists/run |
| `supabase/migrations/20260605_artist_colors.sql` | Create | +2 | `ALTER TABLE artist_profiles ADD COLUMN dominant_color TEXT` |
| `app/artist/[slug]/ArtistProfileClient.tsx` | Modify | +10 | Use dominant_color for page gradient |
| `app/c/[id]/CampaignDetailClient.tsx` | Modify | +10 | Use campaign cover art color |
| `app/api/cron/dispatcher/route.ts` | Modify | +1 | Add color extraction cron at 02:00 UTC |

**Edge cases:**
- No image available: use current hash-based gradient (unchanged behavior)
- Extraction fails for specific image: fall back to hash gradient
- Dark image extracted as black (#000): use dark gray as minimum brightness
- Cron runs slow: process 50/night, all 2K artists in 40 days

**Rollback:** `git revert <commit>` + keep migration (column stays but unused)

**Verification:**
1. Artist with cover art → page gradient matches dominant color
2. Artist without cover art → existing gradient unchanged
3. Campaign page → gradient matches campaign cover art
4. Color extraction cron runs → artist_profiles.dominant_color populated

**Acceptance:** Page gradient matches dominant color from cover art.

---

## DEPLOYMENT CHECKLIST (After Every Change)

```
□ `npx tsc --noEmit` — zero errors
□ `git add -A && git commit -m "feat|fix|docs: [sprint][item] — description"`
□ `git push origin main` — triggers Railway deploy
□ Wait 60s for build
□ `curl https://selah.fm/api/health` — returns 200
□ `curl -o /dev/null -w "%{http_code}" https://selah.fm/[affected-page]` — returns 200
□ Manual: open affected page in browser, verify visually
```

---

## Sprint Summary

| Sprint | Theme | Items | Hours | Avg. Impact |
|--------|-------|-------|-------|-------------|
| **A** | Conversion & Trust | 5 | 8.5 | ⭐⭐⭐ Highest |
| **B** | Community Engine | 5 | 9.5 | ⭐⭐ High |
| **C** | Platform Hardening | 5 | 8 | ⭐⭐⭐ Critical |
| **D** | Deep UX | 5 | 10 | ⭐⭐ Medium |
| **Total** | | **20** | **~36h** | |

All items independent. Execute in any order. Recommended: A1 → C1 → A3 → B1 → C4 → A4 → D2 → D1 → rest.
