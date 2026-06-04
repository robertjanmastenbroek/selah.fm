# Selah.fm — Phase 2: Master Execution Plan

**Date:** June 4, 2026  
**Research Sources:** 7 blueprints, 40+ platforms, all committed in `.md` files  
**Status:** ⏳ Planning — awaiting approval before any code changes  

---

## How to Read This Plan

Each section lists:
- **Current state** — specific files and their line counts
- **Gaps found in research** — referenced to the relevant blueprint
- **Changes required** — specific code modifications with effort estimates
- **Dependencies** — what must be built before this can work

---

## Sprint 1: Critical Foundations (4-6 hours)

### 1.1 Track Page — Add Client Interactivity

**Blueprint:** `00-BLUEPRINT.md` (score: 3/10)  
**Files affected:** `app/artist/[slug]/tracks/[id]/page.tsx` (174 lines, server component)

**Current state:** Pure server-rendered HTML. No client interactivity. Shows track metadata, breadcrumb, Spotify link, stats grid, and SEO content. No earnings calculator, no join CTA, no mobile sticky bar.

**Changes required:**
| # | Change | File | Effort |
|---|--------|------|--------|
| 1 | Create `TrackDetailClient.tsx` with earnings calculator | New file (~200 lines) | 45min |
| 2 | Add mobile sticky bar with CTA + CPM rate | TrackDetailClient.tsx | 15min |
| 3 | Add "Join campaign" CTA if campaign_slug exists | TrackDetailClient.tsx | 10min |
| 4 | Wire up server component to pass data to client | page.tsx | 10min |

**Dependencies:** None  
**Total effort:** ~1.5 hours

---

### 1.2 Homepage — Real Product UI + Social Proof

**Blueprint:** `GROWTH_BLUEPRINT.md` (score: 5/10)  
**Files affected:** `components/HomePageClient.tsx` (358 lines)

**Current state:** Illustration-based hero with ambient light effects. Has live stats bar, "How it works" sections for artists + creators, featured campaigns grid, and trust bar. Missing: real campaign screenshot, interactive CPM calculator, FAQ section.

**Changes required:**
| # | Change | File | Effort |
|---|--------|------|--------|
| 1 | Replace hero illustration with live campaign screenshot + gradient overlay | HomePageClient.tsx | 30min |
| 2 | Add inline social proof: "21 creators earning" from health endpoint | HomePageClient.tsx | 15min |
| 3 | Add FAQ section after "How it works" | HomePageClient.tsx | 30min |
| 4 | Add "trust bar" badges below primary CTA | HomePageClient.tsx | 10min |
| 5 | Replace "Sign in" with "Get started" when user not logged in | HomePageClient.tsx | 5min |

**Dependencies:** None  
**Total effort:** ~1.5 hours

---

### 1.3 Dashboard — Submission Funnel + Payout Status

**Blueprint:** `GROWTH_BLUEPRINT.md` (score: 4/10)  
**Files affected:** `app/dashboard/page.tsx` (763 lines)

**Current state:** Full dashboard with tabs (Overview, Campaigns, Tracks, Stats). Missing: submission funnel visualization, views-over-time chart, approval rate, platform fee total.

**Changes required:**
| # | Change | File | Effort |
|---|--------|------|--------|
| 1 | Add submission status cards: submitted → approved → paid | dashboard/page.tsx | 20min |
| 2 | Add approval rate + avg review time to stats cards | dashboard/page.tsx | 15min |
| 3 | Add platform fee total display ("You've paid $X in fees") | dashboard/page.tsx | 10min |
| 4 | Add simple views chart (7-day bar chart using SVG) | dashboard/page.tsx | 30min |

**Dependencies:** None  
**Total effort:** ~1.25 hours

---

### 1.4 Referral System — Revenue-Share Model

**Blueprint:** `GROWTH_BLUEPRINT.md` (score: 3/10)  
**Files affected:** `app/api/referral/route.ts` (19 lines), `app/api/stripe/webhook/route.ts` (229 lines), `app/dashboard/page.tsx` (763 lines)

**Current state:** Basic referral redirector that passes `?ref=` to login. No dashboard UI for referrers. Webhook has referral bonus logic but it's fragmented.

**Changes required:**
| # | Change | File(s) | Effort |
|---|--------|---------|--------|
| 1 | Update `referrals` table schema: add `deposit_total_cents`, `bonus_paid_cents` | Migration (new file) | 15min |
| 2 | Add referral section to dashboard (link, stats, referral list) | dashboard/page.tsx | 30min |
| 3 | Refactor webhook referral bonus: clean 10%/5% split logic | webhook/route.ts | 20min |
| 4 | Add referral CTA after campaign creation | CampaignWizard.tsx | 10min |

**Dependencies:** Migration must run before webhook changes  
**Total effort:** ~1.25 hours

---

## Sprint 2: High Impact (4-6 hours)

### 2.1 Money Flow — Webhook Reliability

**Blueprint:** `FINANCIAL_BLUEPRINT.md` (score: 3/10)  
**Files affected:** `app/api/stripe/webhook/route.ts` (229 lines)

**Current state:** Webhook handler does ALL work synchronously — DB updates, emails, notifications, referral bonuses — before returning 200. Risk of timeout → Stripe retries → duplicate processing. No `stripe_events` dedupe table. No async queue.

**Changes required:**
| # | Change | Effort |
|---|--------|--------|
| 1 | Create `stripe_events` table with UNIQUE(event.id) | 15min |
| 2 | Split webhook: store raw event → return 200 → queue processing | 45min |
| 3 | Move all side effects (email, notifications, ticker) to background | 30min |
| 4 | Add reconciliation job skeleton (`app/api/cron/reconcile/route.ts`) | 30min |

**Dependencies:** Migration for `stripe_events` table  
**Total effort:** ~2 hours

---

### 2.2 Campaign Page — Storytelling + Testimonials

**Blueprint:** `00-BLUEPRINT.md` (score: 7/10)  
**Files affected:** `app/c/[id]/CampaignDetailClient.tsx` (1,005 lines)

**Current state:** Already upgraded this session with 11 features (earnings calculator, supporter grid, social proof bar, FAQ accordion, submission gallery, etc.). Missing: creator testimonials section, storytelling layout.

**Changes required:**
| # | Change | Effort |
|---|--------|--------|
| 1 | Add "Creators earning on this campaign" section with avatars + quotes | 30min |
| 2 | Add "About the artist" storytelling section with rich formatting | 20min |
| 3 | Add "Latest submission" highlight card (best-performing video) | 15min |

**Total effort:** ~1 hour

---

### 2.3 Fee Transparency — Before Payment

**Blueprint:** `FINANCIAL_BLUEPRINT.md` (score: 5/10)  
**Files affected:** `app/checkout/page.tsx` (486 lines)

**Current state:** Checkout page handles both donations and campaign funding. 20% platform fee mentioned but not prominent before Stripe payment.

**Changes required:**
| # | Change | Effort |
|---|--------|--------|
| 1 | Add fee breakdown card before Stripe Elements: "You pay $X · Platform fee $Y · Creator gets $Z" | 20min |
| 2 | Add Stripe pricing summary (2.9% + $0.30 processing) | 10min |

**Total effort:** ~30min

---

## Sprint 3: Polish (3-4 hours)

### 3.1 Community — Fan Collections + Discovery Feed

**Blueprint:** `COMMUNITY_BLUEPRINT.md` (score: 6/10 for existing features)  
**Files affected:** Multiple

**Changes required:**
| # | Change | Effort |
|---|--------|--------|
| 1 | Add "Save track" button on track/campaign pages (fan collection) | 30min |
| 2 | Add "Saved tracks" section to user profile | 30min |
| 3 | Add campaign commenting (separate from artist page comments) | 45min |

**Total effort:** ~1.75 hours

---

### 3.2 Card Hover Elevation (Spotify Pattern)

**Blueprint:** `UX_COMPETITOR_RESEARCH.md` §11 (Spotify)  
**Files affected:** `components/CampaignCover.tsx`, `components/ArtistCard.tsx`, `app/browse/BrowseClient.tsx`

**Changes required:**
| # | Change | Effort |
|---|--------|--------|
| 1 | Cards get lighter on hover (inverse of light-mode) | 20min |
| 2 | Consistent 200ms transition on all card hover states | 15min |
| 3 | Play/hover button appears on campaign cards on hover | 15min |

**Total effort:** ~50min

---

## Dependency Map

```
Sprint 1 (Critical Foundations)
├── Track page (no deps)
├── Homepage (no deps)
├── Dashboard (no deps)
└── Referral system (needs migration first)

Sprint 2 (High Impact)
├── Webhook reliability (needs migration)
├── Campaign page (needs Sprint 1 homepage done)
└── Fee transparency (no deps)

Sprint 3 (Polish)
├── Community features (needs Sprint 1 dashboard done)
└── Card elevation (no deps)
```

---

## Summary by Effort

| Sprint | Areas | Total Effort |
|--------|-------|-------------|
| Sprint 1 | Track page, Homepage, Dashboard, Referral | ~5.5 hours |
| Sprint 2 | Webhook, Campaign page, Fee transparency | ~3.5 hours |
| Sprint 3 | Community, Card elevation | ~2.5 hours |
| **Total** | **10 areas across 15+ files** | **~11.5 hours** |

---

## Approval Checklist

Before I write a single line of code, I need your sign-off on:

- [ ] **Sprint 1 priority order** — Track → Homepage → Dashboard → Referral?
- [ ] **Referral model** — 10% to referrer, 5% to referee, credited as campaign budget?
- [ ] **Webhook refactor** — Split into async handler with event store?
- [ ] **Any areas to skip** or defer until after curated launch?

Ready for your review.
