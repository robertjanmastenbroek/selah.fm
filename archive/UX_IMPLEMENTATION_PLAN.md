<!--
================================================================================
ARCHIVED — See SELAH.md for current source of truth.

This file is preserved for historical reference only. All actionable content
has been consolidated into SELAH.md (the living document).
================================================================================
-->

# Selah.fm — Complete UX/UI Implementation Plan

**Date:** June 2, 2026
**Scope:** All pages, all modals, all user flows, design system
**Files covered:** 7 pages + 4 modals + 2 config files + design system
**Based on:** Live analysis of 25 competitor platforms (see UX_COMPETITOR_RESEARCH.md)

---

## 📋 TABLE OF CONTENTS

1. [Complete User Flow Maps](#1-complete-user-flow-maps)
2. [Current Architecture Audit](#2-current-architecture-audit)
3. [Phase 1: Design System](#3-phase-1-design-system)
4. [Phase 2: Homepage Rewrite](#4-phase-2-homepage-rewrite)
5. [Phase 3: Browse Page Rewrite](#5-phase-3-browse-page-rewrite)
6. [Phase 4: Campaign Page Rewrite](#6-phase-4-campaign-page-rewrite)
7. [Phase 5: Modal Improvements](#7-phase-5-modal-improvements)
8. [Phase 6: Campaign Creation Wizard](#8-phase-6-campaign-creation-wizard)
9. [Phase 7: TopNav + Navigation](#9-phase-7-topnav--navigation)
10. [Phase 8: Dashboard Consolidation](#10-phase-8-dashboard-consolidation)
11. [Implementation Order & Dependencies](#11-implementation-order--dependencies)
12. [Testing Strategy](#12-testing-strategy)
13. [Rollback Plan](#13-rollback-plan)

---

## 1. COMPLETE USER FLOW MAPS

### Flow A: Artist creates a campaign

```
Homepage → /dashboard
    │
    ├─ Step 1: Click "Create campaign" (CTA in TopNav or dashboard)
    │   Shows: Wizard Step 1 — Campaign Cover
    │   Input: ImageUpload component
    │   Validation: Cover image required
    │
    ├─ Step 2: Click "Continue"
    │   Shows: Wizard Step 2 — Track Details
    │   Inputs: Track title, Campaign headline (suggestions), Track URL,
    │          Google Drive link, Hashtags, Requirements (template button),
    │          Min video length, Caption requirements, Platform selection,
    │          CPM rate ($/1K views), Max payout per submission
    │   Validation: Track title required
    │
    ├─ Step 3: Click "Create campaign"
    │   POST /api/campaigns → creates campaign with $0 budget
    │   Analytics: trackCreateCampaign()
    │   Toast: "Campaign created! Now fund it to start."
    │
    ├─ Step 4: Redirected to /checkout?type=deposit&campaignId=X
    │   Shows: Deposit page with preset amounts + custom input
    │   Payment: Stripe Elements (Apple Pay, Google Pay, Card)
    │   After success: PaymentSuccess overlay → "View campaign" → redirects to /c/X
    │
    └─ Step 5: Campaign is live with budget
        Creators can now submit videos
        Artist reviews submissions via dashboard → Submissions tab
        Artist approves → views are tracked → budget is spent
```

**Total: 5 steps, ~2 minutes first time, ~30 seconds returning**

### Flow B: Creator submits a video

```
Browse page → Campaign card
   │
   ├─ Step 1: Browse / discover campaigns
   │   Filter by genre, platform, sort by popular/newest/CPM
   │   See CPM rate, budget progress on each card
   │
   ├─ Step 2: Click campaign card → /c/[id]
   │   Sees: Cover art, stats, CTA button "Join campaign — earn $X/1M views"
   │
   ├─ Step 3: Click "Join campaign"
   │   Shows: EarnModal (bottom sheet on mobile, dialog on desktop)
   │   ┌─────────────────────────────────────────────┐
   │   │  EarnModal flow:                          │
   │   │                                            │
   │   │  1. Auth check → not signed in?            │
   │   │     → Show "Sign in" card                  │
   │   │                                            │
   │   │  2. Not creator mode?                      │
   │   │     → Show "Switch to creator" card         │
   │   │                                            │
   │   │  3. Auth OK → show How It Works (3 steps)  │
   │   │     a) Get the track (download link)       │
   │   │     b) Make your video (vertical, 15-60s)  │
   │   │     c) Paste link & get paid               │
   │   │                                            │
   │   │  4. Earnings badge: "You'll earn $X/1M"    │
   │   │                                            │
   │   │  5. Select platform (TikTok/Reels/Shorts)  │
   │   │                                            │
   │   │  6. Paste video URL input                  │
   │   │                                            │
   │   │  7. Click "Submit my video"                │
   │   │     → POST /api/submissions                │
   │   │     → Analytics: trackSubmitContent()      │
   │   │                                            │
   │   │  8. Success screen 🎉                      │
   │   │     - What happens next (review → approve) │
   │   │     - Share on X button                    │
   │   │     - "Submit another" or "Close"           │
   │   └─────────────────────────────────────────────┘
   │
   ├─ Step 4: Artist reviews submission
   │   Approval → views tracked → budget spent
   │
   └─ Step 5: Creator gets paid
       Stripe payout when threshold reached
       See earnings on /earnings page
```

**Total: 5 steps, ~45 seconds first time, ~20 seconds returning**

### Flow C: Visitor donates to a campaign

```
Campaign page → "Or donate to support this track"
   │
   ├─ Step 1: Click donate link
   │   → /checkout?type=donation&campaignId=X
   │
   ├─ Step 2: Choose amount
   │   Preset buttons ($50 / $100 / $200★ / $300 / $500 / $1000)
   │   Custom input with $ prefix
   │
   ├─ Step 3: Fill details
   │   First name, Last name, Email
   │   Optional message of support
   │
   ├─ Step 4: Payment
   │   Stripe Elements (Apple Pay, Google Pay, Card)
   │   "100% added to campaign" guarantee
   │
   └─ Step 5: Success 🎉
       Confetti animation
       Share buttons (WhatsApp, X, Facebook, Copy Link)
       "View campaign" button
```

**Total: 5 steps, ~45 seconds**

### Flow D: Artist manages campaign (dashboard)

```
Dashboard → Campaign list
   │
   ├─ Campaign card shows: title, cover, budget, spent, views, submissions
   │
   ├─ Click campaign → inline edit mode
   │   Track title, CPM rate, requirements, etc.
   │   Save button → PATCH /api/campaigns/[id]
   │
   ├─ Deposit more → /checkout?type=deposit&campaignId=X
   │
   └─ View campaign → /c/[id]

Dashboard also shows:
   - Stats: Total views, total spent, active campaigns, total submissions
   - ActionTracker component (profile completeness)
```

---

## 2. CURRENT ARCHITECTURE AUDIT

### Pages

| Page | File | Lines | Current State | To Do |
|------|------|-------|---------------|-------|
| Homepage | `components/HomePageClient.tsx` | ~468 | 9 sections, too bloated | Cut to 3 sections, remove Problem/Solution, Founder Story, FAQ |
| Browse | `app/browse/BrowseClient.tsx` | ~218 | 25+ platform/genre/sort arrays defined but NEVER rendered as UI | Add filter chips, sort dropdown, wire to API |
| Campaign Detail | `app/c/[id]/CampaignDetailClient.tsx` | ~561 | 7+ competing CTAs, no sticky bar, no tabs | One CTA, sticky mobile bar, tabbed content |
| Dashboard | `app/dashboard/page.tsx` | ~600+ | 2-step wizard + list + inline editing | Polish the wizard flow, add tabbed dashboard |
| Checkout | `app/checkout/page.tsx` | ~400 | Full payment page, good design | Minor polish |
| Earnings | `app/earnings/page.tsx` | ~200 | Creator earnings | Keep |
| Creator Profile | `app/creators/[id]/page.tsx` | ~300 | Creator profile | Keep |
| Artist Profile | `app/artist/[slug]/page.tsx` | ~200 | Artist page | Keep |

### Modals

| Modal | File | Lines | State | Actions |
|-------|------|-------|-------|---------|
| EarnModal | `components/EarnModal.tsx` | ~260 | Well-designed, 3 steps, 4 auth states | Minor: add payment animation, improve mobile sheet |
| StripePaymentModal | `components/StripePaymentModal.tsx` | ~200 | Payment form with Stripe Elements | Minor: loading state polish |
| PaymentSuccess | `components/PaymentSuccess.tsx` | ~200 | Confetti + share buttons | Keep |
| ShareModal | inside `CampaignDetailClient.tsx` | ~80 | Share options (copy, Instagram, TikTok, WhatsApp, X) | Minor: add more platforms |
| GalleryUpload | `components/GalleryUpload.tsx` | ~180 | Image/video upload for campaign | Keep |

### Design System

| Token | Current | Missing |
|-------|---------|---------|
| Gray scale | HSL semantic colors only | 10-step named gray scale (gray-50 through gray-950) |
| Z-index | None (inline z-50/z-100 etc.) | Named layers (card, dropdown, sticky, drawer, modal, toast) |
| Heading weights | 400 (light) on all | 900 for h1-h3, 700 for h4-h6 |
| CTA gradients | None | `.gradient-indigo`, `.gradient-green` utility classes |
| Spacing scale | Tailwind defaults | `--space-section: 6rem`, `--space-card: 1.5rem` |
| Filter chips | Not defined | `.filter-chip`, `.filter-chip-active` utilities |
| Sticky CTA bar | Not defined | `.sticky-cta-bar` with backdrop blur |

---

## 3. PHASE 1: DESIGN SYSTEM

**Files:** `app/globals.css` + `tailwind.config.js`
**Time:** 25 minutes
**Breaks nothing:** All additions are new tokens, existing code untouched

### 3a. globals.css — Add design tokens

Add to `:root` after existing HSL vars (line ~37):

```css
/* ── 10-Step Gray Scale (BeatStars pattern) ── */
--gray-50: #FAFAFA;
--gray-100: #F5F5F5;
--gray-200: #E5E5E5;
--gray-300: #D4D4D4;
--gray-400: #A3A3A3;
--gray-500: #737373;
--gray-600: #525252;
--gray-700: #404040;
--gray-800: #262626;
--gray-900: #171717;
--gray-950: #0A0A0A;

/* ── Named Z-Index Scale ── */
--layer-under: -1;
--layer-base: 0;
--layer-card: 10;
--layer-dropdown: 50;
--layer-sticky: 100;
--layer-drawer: 1000;
--layer-modal-backdrop: 2000;
--layer-modal: 3000;
--layer-toast: 4000;
--layer-tooltip: 5000;

/* ── Heading Weights ── */
--heading-weight-display: 900;
--heading-weight-hero: 900;
--heading-weight-section: 700;

/* ── Spacing Scale ── */
--space-section: 6rem;
--space-section-sm: 3rem;
--space-card: 1.5rem;
```

### 3b. globals.css — Update heading base styles

Replace existing (lines ~44-50):

```css
/* Current */
h1, h2, h3, h4, h5, h6 {
  font-family: 'Righteous', system-ui, sans-serif;
  font-weight: 400;
  letter-spacing: 0.01em;
}
```

```css
/* New */
h1, h2, h3 {
  font-family: 'Righteous', system-ui, sans-serif;
  font-weight: 900;
  letter-spacing: 0.01em;
}
h4, h5, h6 {
  font-family: 'Poppins', system-ui, sans-serif;
  font-weight: 700;
  letter-spacing: 0.01em;
}
```

### 3c. globals.css — Add component utility classes

Add to `@layer components`:

```css
/* CTA Gradients */
.gradient-indigo {
  background: linear-gradient(135deg, #4338CA 0%, #6366F1 100%);
}
.gradient-indigo-hover {
  background: linear-gradient(135deg, #3730A3 0%, #4F46E5 100%);
}
.gradient-green {
  background: linear-gradient(0deg, #059669 0%, #22C55E 100%);
}

/* Filter Chips */
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.02);
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  transition: all 0.2s;
}
.filter-chip:hover {
  border-color: hsl(var(--primary) / 0.3);
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 0.04);
}
.filter-chip:active { transform: scale(0.97); }
.filter-chip-active {
  border-color: hsl(var(--primary) / 0.5);
  background: hsl(var(--primary) / 0.08);
  color: hsl(var(--primary));
}

/* Sticky CTA Bar (mobile) */
.sticky-cta-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--layer-sticky, 100);
  padding: 0.75rem 1rem;
  border-top: 1px solid rgba(255,255,255,0.06);
  background: linear-gradient(0deg, rgba(15,15,35,0.98) 0%, rgba(15,15,35,0.95) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
@media (min-width: 768px) { .sticky-cta-bar { display: none; } }
```

### 3d. tailwind.config.js — Add theme extensions

Add inside `theme.extend`:

```js
zIndex: {
  'under': '-1', 'base': '0', 'card': '10', 'dropdown': '50',
  'sticky': '100', 'drawer': '1000', 'modal-backdrop': '2000',
  'modal': '3000', 'toast': '4000', 'tooltip': '5000',
},
spacing: {
  'section': '6rem',
  'section-sm': '3rem',
  'card': '1.5rem',
},
fontWeight: {
  'heading': '900',
  'heading-section': '700',
},
```

---

## 4. PHASE 2: HOMEPAGE REWRITE

**File:** `components/HomePageClient.tsx`
**Current:** 468 lines, 9 sections
**Target:** ~280 lines, 3 sections
**Time:** 45 minutes

### Sections to KEEP
1. ✅ Hero section (with logo, headline, CTA buttons, stats row)
2. ✅ Featured Campaigns grid (with LiveTicker stats header)
3. ✅ Ambient light + grain texture effects
4. ✅ All framer-motion animations
5. ✅ All fetch logic for stats + campaigns
6. ✅ Auth check (user profile in corner)
7. ✅ Campaign card rendering
8. ✅ Analytics events

### Sections to REMOVE
1. ❌ Problem/Solution section ("Why artists switch from...") — redundant with hero copy
2. ❌ Trust Pillars section — baked into hero: "No bots. No black-box ads. No monthly retainers."
3. ❌ Full How It Works section — consolidate into 3-step inline micro-section in hero
4. ❌ Founder Story section — belongs on /about page
5. ❌ FAQ section — belongs on /faq page
6. ❌ Final CTA section — redundant (hero + campaign grid ARE the conversion)
7. ❌ Scroll indicator below hero — users know to scroll

### New Structure

```
SECTION 1: HERO
├─ Logo + "Open source" badge (keep)
├─ Headline: "Your music, real creators, real views." (keep)
├─ Subheadline (keep)
├─ Value prop in micro text: "No bots. No black-box ads. No monthly retainers." (replaces full Problem/Solution section)
├─ Micro How It Works (NEW — 3 steps, inline, compact):
│   [1. Upload track] → [2. Set your budget] → [3. Creators apply]
├─ Two CTAs: "Promote your music" (indigo) | "Earn as a creator" (border/green)
└─ Live stats row (keep)

SECTION 2: FEATURED CAMPAIGNS (keep, same as now)
├─ "X active campaigns — Creators are earning real money right now."
├─ 3-column campaign grid (responsive)
└─ "View all campaigns" link

SECTION 3: FINAL (NEW — replaces old Final CTA, brief)
├─ "Ready to get your music in front of real creators?"
├─ Single CTA: "Start a campaign — free to begin"
└─ Footer note: "Questions? Check our FAQ →"
```

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Removing sections reduces content for SEO / first-time visitors | The hero text IS the value prop. Detailed content lives on /about, /faq, /welcome-artists |
| Removing Final CTA reduces conversion | Hero CTA + campaign grid ARE the primary conversions. 3rd CTA below fold is proven to cannibalize |
| Removing Founder Story removes personal touch | Move to /about. Campaign pages themselves build trust (real creators, real budgets) |

---

## 5. PHASE 3: BROWSE PAGE REWRITE

**File:** `app/browse/BrowseClient.tsx`
**Current:** ~218 lines
**Target:** ~320 lines
**Time:** 30 minutes

### Current Problem
- `GENRES` (20 items), `PLATFORMS` (3 items), `SORT_OPTIONS` (5 items) are defined at top
- They are NEVER rendered as UI controls — they were meant for filter chips but were never wired up
- This is a ~$10,000 UX bug: users have no way to narrow down 100+ campaigns

### Changes

#### Add filter bar above campaign grid

```
[Search input...] [Genre: All ▼] [Platform: All ▼] [Sort: Popular ▼]
[Chips: Pop | Rock | Hip-Hop | Electronic | R&B | Country | ...]
```

#### Filter chip rendering
```tsx
{/* Genre filter chips */}
<div className="flex gap-1.5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
  <button
    onClick={() => handleFilter({ ...filters, genre: '' })}
    className={`filter-chip whitespace-nowrap ${!filters.genre ? 'filter-chip-active' : ''}`}
  >
    All
  </button>
  {GENRES.map(genre => (
    <button
      key={genre}
      onClick={() => handleFilter({ ...filters, genre })}
      className={`filter-chip whitespace-nowrap ${filters.genre === genre ? 'filter-chip-active' : ''}`}
    >
      {genre}
    </button>
  ))}
</div>
```

#### Platform badge filters
Same pattern but smaller/badge-style chips for TikTok, Instagram, YouTube.

#### Sort dropdown
Replace current static sort with a styled dropdown/button group.

#### Wire filters to API
The `buildQuery()` function already handles all params. We just need to call `handleFilter()` on chip click, which calls `loadCampaigns()` with the new filters.

---

## 6. PHASE 4: CAMPAIGN PAGE REWRITE

**File:** `app/c/[id]/CampaignDetailClient.tsx`
**Current:** ~561 lines
**Target:** ~480 lines
**Time:** 60 minutes

### Current Problems
1. **7+ competing CTAs:** "Join campaign", "Or donate to support this track", "Claim this campaign", "Support this track" card, "Create something amazing" card, Share button, Review actions
2. **No sticky CTA on mobile:** The CTA button scrolls away
3. **No tabbed content:** Everything is a giant scroll — about/requirements/submissions all mixed
4. **"Or donate" text link competes with primary CTA** — makes users hesitate ("Should I donate or join?")
5. **Support card + Create card below hero** are distraction from the primary action

### Changes

#### Hero section (keep two-column layout)
```
┌──────────────────────────┬──────────────────────┐
│                          │  Artist avatar       │
│   COVER ART (full)       │  + name              │
│                          │                      │
│                          │  Progress ring       │
│   Title overlay          │  $X spent of $Y      │
│                          │  Live ticker         │
│                          │                      │
│                          │  [JOIN CAMPAIGN]     │
│                          │   — primary CTA       │
│                          │                      │
│                          │  Listen on: [chips]  │
│                          │  Share button        │
└──────────────────────────┴──────────────────────┘
```

**Key changes:**
1. Remove "Or donate to support this track" text link below primary CTA
2. Move donation to its own context (tab or bottom of page) — not competing with "Join"
3. Keep the unclaimed banner if applicable

#### Add sticky CTA bar on mobile
When user scrolls past the hero, show a fixed bottom bar:
```
┌─────────────────────────────────────────────────┐
│  $X,XXX/1M views  │  $X of $Y funded  │ [JOIN] │
└─────────────────────────────────────────────────┘
```
Uses the `.sticky-cta-bar` class from Phase 1.

#### Add tabbed content below hero
Replace the current monolithic scroll + Support/Create cards with tabs:

```
[About] [Requirements] [Submissions]

Tab 1 — About:
├─ Campaign description
├─ Artist bio
├─ Track details
└─ Listen links

Tab 2 — Requirements:
├─ Required hashtags
├─ FTC disclosure requirement
├─ Video length minimum
├─ Platform-specific notes
└─ Download resources (Google Drive link)

Tab 3 — Submissions:
└─ SubmissionsFeed component (already built)
```

#### Remove these sections entirely
1. ❌ "Support this track" card (the secondary donation card)
2. ❌ "Create something amazing" card (redundant — the CTA is "Join campaign")
3. ❌ "Or donate to support this track" text link below primary CTA

---

## 7. PHASE 5: MODAL IMPROVEMENTS

### 7a. EarnModal (`components/EarnModal.tsx`) — Minor refinements

| Current | Issue | Fix |
|---------|-------|-----|
| 4 auth states (loading, not signed in, not creator, success) | Good — keep | - |
| Platform selector: grid of 4 buttons | Good — keep | - |
| How It Works section at top | Good — keep | - |
| Success screen has "View your creator profile" link | Good | - |
| No loading animation on submit button | Spinner already exists | Good |
| Mobile: bottom sheet with drag handle | Spring animation | Good |
| No "Share on TikTok" in success | Only X/Twitter | Add TikTok share button |
| Earnings badge: green, shows CPM | Good | - |

**One change:** In success screen, add "Share on TikTok" alongside "Share on X".

### 7b. StripePaymentModal (`components/StripePaymentModal.tsx`) — Good as-is

No changes needed. It handles:
- Stripe not configured fallback
- Loading state
- PaymentElement with Apple Pay / Google Pay
- Error state with message
- Processing state with spinner
- Success → calls onSuccess callback
- Trust signals (SSL, Secure, Stripe)

### 7c. PaymentSuccess (`components/PaymentSuccess.tsx`) — Good as-is

No changes needed. It has:
- Confetti animation (50 particles)
- Checkmark with spring animation
- Amount highlight
- Share buttons (WhatsApp, X, Facebook, Copy Link)
- "View campaign" link
- Donor message display
- Glow ring animation

### 7d. ShareModal (inside CampaignDetailClient.tsx) — Good as-is

No changes needed. It handles:
- 6 share options (Copy Link, Instagram, TikTok, WhatsApp, X)
- Mobile bottom sheet
- Desktop dialog
- native share API fallback

---

## 8. PHASE 6: CAMPAIGN CREATION WIZARD

**File:** `app/dashboard/page.tsx`
**Time:** 45 minutes

### Current state
- 2-step wizard (Cover → Details)
- Fires create + redirects to checkout
- Inline editing mode for existing campaigns
- **Issue:** The wizard only asks for cover art + track details, but NOT the budget/CPM — those are set AFTER creation during checkout
- **Issue:** The wizard is embedded in the dashboard page, making it hard to navigate

### Improvements

#### Wizard flow: keep 2 steps, add budget step

```
Step 1: Campaign Cover
├─ ImageUpload component
├─ "Campaigns with great visuals get 3× more submissions" note
└─ [Continue]

Step 2: Track Details
├─ Track title (required)
├─ Campaign headline (with suggestion buttons — current)
├─ Track URL (Spotify/SoundCloud)
├─ Google Drive link (resource pack — current detailed guidance)
├─ Hashtags
├─ Required hashtags
├─ FTC disclosure checkbox
├─ Min video length
├─ Caption requirements
├─ Platform selection (TikTok, Reels, Shorts, Facebook)
├─ CPM rate ($/1K views) — moved from checkout into wizard
├─ Max payout per submission — moved from checkout into wizard
└─ [Create campaign → redirect to checkout to fund]
```

#### Add "Save as draft" functionality (future)
Not worth building now — campaigns are created unfunded ($0 budget) which is effectively a draft state.

#### Dashboard tabs (future)
The dashboard currently shows: list of campaigns + stats at top. Consider adding tabs:
- My Campaigns (list)
- Submissions (approve/reject)
- Analytics

This is stretch — not in scope for initial rewrite.

---

## 9. PHASE 7: TOPNAV + NAVIGATION

**File:** `components/TopNav.tsx`
**Time:** 20 minutes

### Current problems
1. **13 items in menu drawer** — too many choices = choice paralysis
2. **Logo links to /browse** — should link to / (home)
3. **Search icon** links to /browse — but /browse IS search, confusing

### Changes

#### Logo
- Change link from `/browse` to `/`
- If already on home, clicking logo does nothing (standard UX)

#### Menu drawer: 13 items → 7 items
**Remove** (accessible from Dashboard):
- Review → dashboard
- Analytics → dashboard
- Artists → browse or dashboard
- Creators → browse or dashboard
- Report a bug → move to FAQ footer

**Keep:**
1. Dashboard
2. Messages (with unread count)
3. Earnings
4. Browse campaigns
5. FAQ & Support
6. Settings (already in profile header as gear icon)
7. Logout

#### Search icon
When clicked → navigate to `/browse` with search input auto-focused.

---

## 10. PHASE 8: DASHBOARD CONSOLIDATION

**File:** `app/dashboard/page.tsx`
**Time:** 30 minutes

### Current state
- 600+ lines (wizard + list + inline editing + stats)
- Mixed responsibilities (both campaign management AND campaign creation)
- ActionTracker component for profile completion

### Changes
1. Keep the wizard flow as-is (it works well)
2. Make the campaign list the default view (not the wizard)
3. Add a clear "Create campaign" CTA in the header
4. Keep inline editing (it's useful)

---

## 11. IMPLEMENTATION ORDER & DEPENDENCIES

| Phase | File | Lines Δ | Time | Depends on | Break risk |
|-------|------|---------|------|------------|------------|
| **1a** — Design tokens (globals.css) | `globals.css` | +40 lines | 15m | None | None (additive) |
| **1b** — Tailwind config | `tailwind.config.js` | +20 lines | 10m | None | None (additive) |
| **2** — Homepage | `HomePageClient.tsx` | -188 lines | 45m | Phase 1 | Medium (removes sections) |
| **3** — Browse | `BrowseClient.tsx` | +102 lines | 30m | Phase 1 | Low (adds UI, doesn't remove) |
| **4** — Campaign Page | `CampaignDetailClient.tsx` | -81 lines | 60m | Phase 1 | Medium (removes CTAs) |
| **5a** — EarnModal | `EarnModal.tsx` | +5 lines | 10m | Phase 1 | Low |
| **5b** — StripePaymentModal | `StripePaymentModal.tsx` | 0 | 5m | None | None (inspect only) |
| **6** — Dashboard wizard | `dashboard/page.tsx` | +20 lines | 45m | Phase 1 | Low (adds CPM to wizard) |
| **7** — TopNav | `TopNav.tsx` | -50 lines | 20m | None | Low (removes menu items) |
| **8** — Footer | `layout.tsx` | -5 lines | 5m | None | None |

**Total: ~4 hours**

### Critical path
```
Phase 1 (design tokens)  ─┬── Phase 2 (homepage)
                          ├── Phase 3 (browse)
                          ├── Phase 4 (campaign page)
                          └── Phase 6 (dashboard wizard)
```

Phase 1 MUST be done first. Everything else is independent.

---

## 12. TESTING STRATEGY

### Per Phase Checklist

| Test | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 | Phase 7 |
|------|---------|---------|---------|---------|---------|---------|---------|
| `npm run build` passes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| No console errors | - | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Auth works | - | ✅ | - | ✅ | ✅ | ✅ | ✅ |
| API calls work | - | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Analytics fire | - | ✅ | - | ✅ | ✅ | ✅ | - |
| Mobile responsive | - | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dark theme consistent | - | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Framer animations work | - | ✅ | - | ✅ | ✅ | - | - |
| Campaign grid renders | - | ✅ | ✅ | - | - | ✅ | - |
| Filter chips interactive | - | - | ✅ | - | - | - | - |
| Sticky CTA appears | - | - | - | ✅ | - | - | - |
| Tabs switch content | - | - | - | ✅ | - | - | - |
| Earn modal flows | - | - | - | ✅ | ✅ | - | - |
| Payment submission | - | - | - | - | ✅ | - | - |

### Smoke test procedure
1. Load homepage → verify hero + campaign grid render
2. Navigate to /browse → verify filters + grid
3. Click a campaign → verify detail page + tabs + sticky CTA
4. Click "Join campaign" → verify EarnModal
5. Navigate to /dashboard → verify campaign list + create wizard
6. Create campaign → verify redirect to checkout
7. Resize to 375px → verify mobile layouts work

---

## 13. ROLLBACK PLAN

### If build breaks
1. `npm run build` catches errors before deploy — never force-push
2. Each file has git history: `git checkout -- <filename>` restores original

### If homepage breaks (most visible)
1. Restore `components/HomePageClient.tsx` from git
2. Verify build passes
3. Then fix browse or campaign page

### If design tokens break
1. Remove new CSS from `globals.css`
2. Remove tailwind config additions
3. Verify build passes
4. Old tokens are untouched — site reverts to current appearance

### If campaign page breaks
1. Restore `app/c/[id]/CampaignDetailClient.tsx` from git
2. Verify build passes
3. Restore `components/EarnModal.tsx` if changed

### Contingency
- Each phase is small enough to implement, test, and ship independently
- If Phase 4 (campaign page) gets complex, split into sub-phases:
  - 4a: Add sticky CTA bar only
  - 4b: Add tabbed content
  - 4c: Remove competing CTAs
- If Phase 3 (browse filters) causes API issues, revert to current unfiltered view

---

## APPENDIX: COMPETITOR RESEARCH SUMMARY

The full 25-platform research is in `UX_COMPETITOR_RESEARCH.md`. Key findings relevant to implementation:

| Law | Source | Selah Application |
|-----|--------|-------------------|
| One primary CTA per page | Airbnb, Uber, GoFundMe | Campaign page: only "Join campaign" |
| Sticky CTA never leaves | Airbnb, GoFundMe | Mobile sticky CTA bar |
| Trust before transaction | Airbnb, Fiverr, Kickstarter | Verified badges, transparent pricing |
| Progressive disclosure | Airbnb, Uber | Tabs: About → Requirements → Submissions |
| Social proof at top | GoFundMe, Fiverr | Live ticker with donation count |
| Gamification drives retention | Duolingo, Robinhood | Creator levels, streaks (future) |
| Price before commitment | Uber, Airbnb | CPM shown before submission |
| Templates as entry point | Canva | Campaign creation wizard with presets |
| Mobile-first responsive | All | Bottom sheets, sticky bars, thumb targets |
