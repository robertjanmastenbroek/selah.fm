<!--
================================================================================
ARCHIVED — See SELAH.md for current source of truth.

This file is preserved for historical reference only. All actionable content
has been consolidated into SELAH.md (the living document).
================================================================================
-->

# Selah.fm — Complete UI/UX Overhaul Plan

**Date:** June 2, 2026  
**Scope:** Every page, modal, component, flow, and interaction in the application  
**Standard:** "Holy shit, that's done." — One primary action per page. Zero competing CTAs. Everything works on mobile.

---

## 📦 EXHAUSTIVE INVENTORY

### Pages (56 total routes)
| Page | File | Lines | Users | Current health |
|------|------|-------|-------|----------------|
| Homepage | `app/page.tsx` → `HomePageClient.tsx` | 468 | All | ❌ 9 sections, too many CTAs |
| Browse | `app/browse/BrowseClient.tsx` | ~200 | All | ❌ Filters defined but not rendered |
| Campaign Detail | `app/c/[id]/CampaignDetailClient.tsx` | 561 | All | ❌ 7+ CTAs, no sticky bar, no tabs |
| Donate | `app/c/[id]/donate/page.tsx` | ~150 | All | ⚠️ Separate page vs modal — inconsistent |
| Checkout | `app/checkout/page.tsx` | ~400 | Artist | ⚠️ Works but bloated, inline success overlay |
| Dashboard | `app/dashboard/page.tsx` | ~500 | Artist | ⚠️ Wizard in dialog + multi-step, lots of state |
| Review | `app/review/page.tsx` | ~350 | Artist | ⚠️ Good core, needs polish |
| Earnings | `app/earnings/page.tsx` | ~200 | Creator | ✅ Clean, needs rating/share polish |
| Messages | `app/messages/page.tsx` | ~250 | All | ⚠️ Two implementations (full + widget) |
| Login | `app/login/page.tsx` | ~80 | Anonymous | ✅ Simple, fine |
| Onboarding | `app/onboarding/page.tsx` | ~300 | New users | ⚠️ Heavy localStorage state |
| Settings | `app/settings/page.tsx` | ~120 | All | ⚠️ Not reviewed |
| Artists | `app/artist/page.tsx` | ~100 | All | ✅ Likely fine |
| Artist Profile | `app/artist/[slug]/page.tsx` | ~200 | All | ✅ Likely fine |
| Creators | `app/creators/CreatorsClient.tsx` | ~100 | All | ✅ Likely fine |
| Creator Profile | `app/creators/[id]/page.tsx` | ~200 | All | ✅ Likely fine |
| FAQ | `app/faq/page.tsx` | ~80 | All | ✅ Static |
| About | `app/about/page.tsx` | ~60 | All | ✅ Static |
| Blog | `app/blog/*` | varies | All | ✅ Separate system |
| Guides (3) | `app/guides/*` | varies | All | ✅ Static |
| Welcome (2) | `app/welcome-*` | varies | All | ✅ Landing pages |
| Content Guidelines | `app/content-guidelines/page.tsx` | ~50 | All | ✅ Static |
| Legal (3) | `app/privacy, tos, dmca` | varies | All | ✅ Static |
| Tools | `app/tools/*` | varies | All | ✅ Separate feature |
| Admin (20+) | `app/admin/*` | varies | Internal | ⚠️ Not in scope for public UX |

### Modals (7 total)
| Modal | Component | Lines | Triggered from | Current health |
|-------|-----------|-------|----------------|----------------|
| Earn (video submit) | `EarnModal.tsx` | 330 | Campaign page "Join campaign" | ⚠️ Auth gates good, success screen lacks share incentive |
| Stripe Payment | `StripePaymentModal.tsx` | 280 | Campaign page "Donate", Dashboard "Fund" | ✅ Solid, well-designed |
| Payment Success | `PaymentSuccess.tsx` | 290 | After Stripe success | ⚠️ Confetti + share, but no campaign actions |
| Share | Inline in PaymentSuccess | — | Campaign page | ⚠️ Confusing — uses separate flow |
| Review Feedback | Inline in review/page.tsx | ~80 | Review page | ⚠️ Nested in review page, should be component |
| Edit Campaign | Inline in dashboard/page.tsx | ~300 | Dashboard | ❌ Bloated, mixed state with create wizard |
| Support Chat | `ChatWidget.tsx` | ~300 | All pages, bottom-right | ✅ Well-designed |

### Shared Components (22 total)
| Component | File | Used by | Current health |
|-----------|------|---------|----------------|
| TopNav | `TopNav.tsx` | All pages | ❌ 13 menu items, confusing nav |
| BottomNav | `BottomNav.tsx` | Mobile | ✅ Clean, 4 tabs |
| Chat Widget | `ChatWidget.tsx` | All pages (via TopNav) | ⚠️ Duplicate with messages page |
| Support Widget | `SupportWidget.tsx` | All pages (floating) | ✅ Well-designed |
| SubmissionsFeed | `SubmissionsFeed.tsx` | Campaign page | ⚠️ Needs integration into tabs |
| CreatorSubmissions | `CreatorSubmissions.tsx` | Creator profile | ⚠️ Not reviewed |
| EarnModal | `EarnModal.tsx` | Campaign page | ⚠️ Needs success share improvement |
| StripePaymentModal | `StripePaymentModal.tsx` | Campaign page | ✅ Solid |
| PaymentSuccess | `PaymentSuccess.tsx` | Campaign page | ⚠️ Needs more kick actions |
| VideoEmbed | `VideoEmbed.tsx` | Review page | ⚠️ Not reviewed |
| CampaignCover | `CampaignCover.tsx` | Campaign page, Browse | ⚠️ Not reviewed |
| RatingPrompt | `RatingPrompt.tsx` | Review, Earnings | ⚠️ Should be modal, not inline |
| LiveTicker | `LiveTicker.tsx` | Checkout | ⚠️ Not reviewed |
| MessageButton | `MessageButton.tsx` | Campaign, Creators | ✅ Clean, uses custom events |
| MediaCarousel | `MediaCarousel.tsx` | Campaign page | ⚠️ Not reviewed |
| GalleryUpload | `GalleryUpload.tsx` | Dashboard wizard | ⚠️ Not reviewed |
| ImageUpload | `ImageUpload.tsx` | Dashboard wizard | ⚠️ Not reviewed |
| ImageCropper | `ImageCropper.tsx` | Dashboard wizard | ⚠️ Not reviewed |
| NotificationBell | `NotificationBell.tsx` | TopNav | ⚠️ Not reviewed |
| CampaignSearch | `CampaignSearch.tsx` | Browse | ⚠️ Not reviewed |
| Skeleton | `ui/skeleton.tsx` | Multiple | ✅ Standard |
| Toast | `Toast.tsx` | Global | ✅ Standard |

### User Flows (5 primary)
| Flow | Steps | Pages/Modals touched | Current health |
|------|-------|---------------------|----------------|
| **Artist creates campaign** | 3–6 steps | Dashboard (wizard) → Checkout → Campaign page | ⚠️ Bloated wizard, confusing state |
| **Creator submits video** | 4 steps | Browse → Campaign page → EarnModal → Profile | ⚠️ Auth gate UX could be tighter |
| **Visitor donates** | 3 steps | Campaign page → Donate/Checkout → PaymentSuccess | ⚠️ Two donation paths (modal + page) |
| **Artist reviews video** | 2 steps | Review page (list → approve/reject) | ⚠️ Feedback modal nested, not reusable |
| **User communicates** | 3+ steps | Any page → Chat widget → Messages page | ❌ Two chat UIs, confusing |

---

## 🔴 CORE PROBLEMS (Critical)

### 1. Two Donation Paths Compete
**Current:** Campaign page has "Donate" button in sidebar → opens `StripePaymentModal.tsx` AND there's a full `/checkout` page AND a full `/c/[id]/donate` page.  
**Fix:** ONE path. The modal is sufficient for quick donations. The `/checkout` page should be ONLY for campaign funding (artist deposits), not donations. Remove `/c/[id]/donate` entirely.

### 2. Two Chat UIs
**Current:** `ChatWidget.tsx` (dropdown from TopNav) AND `app/messages/page.tsx` (full page). They share the same API but have different rendering logic, different polling intervals, different empty states.  
**Fix:** Extract the message thread list into a shared component. ChatWidget uses it in a dropdown, Messages page uses it full-width. Same code, two layouts.

### 3. Dashboard Wizard Bloated
**Current:** Dashboard has an inline wizard with 2 steps (cover art → track details) that shares state with the edit campaign form. The edit form is 300+ lines inline.  
**Fix:** Extract the campaign form (both create and edit) into a standalone `CampaignForm.tsx` component. Wizard = step indicator on top, form content in middle.

### 4. Browse Filters Exist But Don't Render
**Current:** `BrowseClient.tsx` has `GENRES`, `PLATFORMS`, `SORT_OPTIONS` arrays defined as constants — but never rendered as UI controls.  
**Fix:** Render filter chips. Wire state to `buildQuery()` which already handles filter params.

### 5. Review Feedback Modal Is Inline
**Current:** The reject/approve confirmation modal + feedback textarea is pasted inline in `review/page.tsx` (~80 lines nested in component).  
**Fix:** Extract to `ReviewFeedbackModal.tsx` — reusable by review page and eventually by creator (to appeal/respond).

### 6. Campaign Detail Has 7+ Competing CTAs
**Current:** "Join campaign", "Donate", "Share", "Claim", "Or donate to support", "Support this track" card, "Submit" button, Review actions — ALL visible below hero.  
**Fix:** One primary CTA ("Join campaign"). Donate is secondary (small link in tab or sidebar). Share is tertiary (icon). No "Support this track" card.

---

## 🟡 SECONDARY PROBLEMS (Important)

### 7. No Campaign Creation Wizard — It's a Form
**Current:** Dashboard has a 2-step "wizard" but it's just a shared form with state management. No visual progress. No preview. No confirmation.  
**Fix:** Real 3-step wizard:  
  Step 1: Upload cover art + gallery images (visual-first)  
  Step 2: Track details + budget + CPM + requirements  
  Step 3: Preview + confirm → Launch (redirects to checkout to fund)

### 8. RatingPrompt is Inline, Not Modal
**Current:** `RatingPrompt.tsx` renders inline below approved submissions on both review and earnings pages. It's a star rating + comment form.  
**Fix:** Make it a modal that auto-opens after a payout is processed. Should feel celebratory, not like a chore.

### 9. PaymentSuccess Has Confetti But No Next Actions
**Current:** After donation/deposit, user sees confetti, a checkmark, and share buttons. But there's no "View your campaign" or "Browse more campaigns" as primary actions.  
**Fix:** Add primary CTA to return to campaign + secondary CTA to browse. Share should be tertiary.

### 10. Empty States Inconsistent
**Current:** Some pages have `EmptyState` component, some have inline JSX, some just show nothing.  
**Fix:** Standardize on `EmptyState` component everywhere — with image, title, description, and action button where applicable.

### 11. No Loading Skeletons on Some Pages
**Current:** Review page has skeletons. Earnings page has skeletons. But campaign detail and browse don't have proper loading states.  
**Fix:** Add skeleton screens to every page that fetches data.

### 12. TopNav Menu Overload
**Current:** 13 items in menu drawer (Dashboard, Messages, Review, Earnings, Analytics, Browse campaigns, Artists, Creators, FAQ, Report a bug, GitHub, Settings, Logout).  
**Fix:** Reduce to 7 core items. Move secondary items to footer or dashboard sub-nav.

---

## 🛠️ PHASED IMPLEMENTATION PLAN

### Phase 0: Shared Component Extraction (before any page rewrites)
**Files to create:**
- `components/CampaignForm.tsx` — The create/edit campaign form (replace the inline 300-line editor in dashboard)
- `components/ReviewFeedbackModal.tsx` — Reusable approve/reject modal with feedback
- `components/MessageThread.tsx` — Shared message list + input component (used by ChatWidget and Messages page)
- `components/EarnSuccess.tsx` — Success screen for EarnModal (extract from the inline version)

**Total new code:** ~400 lines  
**Lines removed from existing:** ~500 lines (de-duplication)  
**Risk:** Low — purely additive components, nothing breaks

### Phase 1: Design System Tokens (20 min)
**Files:** `app/globals.css` + `tailwind.config.js`  
**Changes:**
- Add 10-step gray scale (`--gray-50` through `--gray-950`)
- Add named z-index layers (`--layer-under` through `--layer-tooltip`)
- Add heading weight tokens (900 for display, 700 for sections)
- Add CTA gradient utilities
- Add filter-chip component class
- Add sticky-cta-bar class
- Add space-section, space-section-sm tokens

**Risk:** None — purely additive, existing tokens unchanged

### Phase 2: Browse Page Filters (30 min)
**File:** `app/browse/BrowseClient.tsx`  
**Changes:**
- Render GENRES array as filter chips
- Render PLATFORMS as badge chips
- Render SORT_OPTIONS as a styled dropdown
- Wire filter state to `buildQuery()` — this function already handles all params
- Add loading skeleton for campaign cards
- Polish empty states

**Lines:** +80  
**Risk:** Low — filters are additive UI, core grid unchanged

### Phase 3: Campaign Detail Page (60 min)
**File:** `app/c/[id]/CampaignDetailClient.tsx`  
**Changes:**
- Hero section restructured: cover art left, stats + CTA right (like Kickstarter two-column)
- Remove all competing CTAs: "Or donate to support this track", "Support this track" card, duplicate share buttons
- One primary CTA: "Join campaign — earn $X/1M views" (always visible)
- Sticky mobile bar using `.sticky-cta-bar` class
- Tabbed content below hero: About | Requirements | Submissions
- Donate button moves to a small sidebar link (not competing with primary CTA)
- Loading skeleton state

**Lines:** 561 → ~400  
**Risk:** Medium — removal of CTAs could confuse users who used "Donate" as primary action. Mitigation: Donate link still exists but as a smaller secondary element.

### Phase 4: Homepage Rewrite (45 min)
**File:** `components/HomePageClient.tsx`  
**Changes:**
- Cut from 9 sections to 3: Hero → Featured Campaigns → Final CTA
- Remove: Problem/Solution, Trust Pillars (baked into hero), How It Works (inline 3-step micro), Founder Story, FAQ, Final redundant CTA
- Keep: Hero with live stats, Featured Campaigns grid, auth state
- Add: Micro 3-step "How it works" between hero copy and CTAs

**Lines:** 468 → ~280  
**Risk:** Low-medium — section removal could miss users who read Founder Story, but analytics likely show low engagement below the fold

### Phase 5: Checkout + Donate Consolidation (45 min)
**Files:** `app/checkout/page.tsx`, `app/c/[id]/donate/page.tsx`  
**Changes:**
- Eliminate `/c/[id]/donate` entirely — donations happen via StripePaymentModal on campaign page
- `/checkout` page stays but only for **campaign funding deposits** (artist side), not donations
- Rename: "Deposit" throughout (not "Fund") for clarity
- Move the inline success overlay into a reusable `PaymentSuccess` component
- Clean up the preset buttons — reduce from 6 to 4, make custom input more prominent

**Lines:** ~550 total → ~300  
**Risk:** Medium — users who bookmarked `/c/[id]/donate` will get 404. Add redirect.

### Phase 6: TopNav + Messages Consolidation (40 min)
**Files:** `components/TopNav.tsx`, `components/ChatWidget.tsx`, `app/messages/page.tsx`, `components/MessageButton.tsx`  
**Changes:**
- TopNav: Reduce menu from 13 to 7 items (Dashboard, Messages, Earnings, Browse, FAQ, Settings, Logout)
- TopNav: Fix logo to link to `/` not `/browse`
- Extract `MessageThread.tsx` — shared message list + composer (used by both ChatWidget and Messages page)
- ChatWidget uses MessageThread in a small dropdown
- Messages page uses MessageThread full-width with conversation list sidebar
- Remove polling duplication — single `useMessages` hook

**Lines:** ~750 total → ~550  
**Risk:** Medium — refactoring shared chat could introduce regressions. Test both widget and full page after.

### Phase 7: Dashboard + Campaign Creation Wizard (60 min)
**File:** `app/dashboard/page.tsx`  
**Changes:**
- Extract all campaign form fields into `components/CampaignForm.tsx`
- Wizard: Step 1 (Cover art + gallery) → Step 2 (Track details + budget + CPM + requirements) → Step 3 (Preview + launch)
- Edit mode: Same CampaignForm component, pre-filled, no wizard steps
- Add campaign preview before launch (show what the campaign card will look like)
- On launch, redirect to checkout to fund
- Add loading skeletons for campaign list
- Add empty state for no campaigns

**Lines:** ~500 → ~350 (campaign form extracted)  
**Risk:** Medium — editor pre-fill logic needs to exactly match the API shape. Test create + edit paths.

### Phase 8: Review Page + Feedback Modal (30 min)
**Files:** `app/review/page.tsx`, `components/ReviewFeedbackModal.tsx`  
**Changes:**
- Extract review feedback modal into `ReviewFeedbackModal.tsx`
- Add keyboard shortcuts (1 = approve, 2 = reject, esc = close)
- Add batch actions (approve all, reject all)
- Make the undo toast reusable (it's inline currently)
- Add loading/empty/error states (already have skeleton + EmptyState + ErrorState)

**Lines:** ~350 → ~250 (modal extracted)  
**Risk:** Low — extractive refactor, behavior unchanged

### Phase 9: Payment Flows Polish (20 min)
**Files:** `components/EarnModal.tsx`, `components/StripePaymentModal.tsx`, `components/PaymentSuccess.tsx`  
**Changes:**
- EarnModal: Add share incentive on success screen ("Share your earnings on X for a free credit")
- PaymentSuccess: Primary CTA to return to campaign, secondary to browse, tertiary to share
- StripePaymentModal: Add loading state skeleton for when Stripe is loading

**Lines:** ~900 total → ~850  
**Risk:** Low — additive changes to modals

### Phase 10: Empty States + Loading States (20 min)
**Files:** Various pages  
**Changes:**
- Audit every page for missing `EmptyState` or skeleton
- Standardize on `EmptyState` component (icon, title, description, optional action)
- Add loading skeletons to campaign detail, browse, dashboard, and creator profile

**Risk:** Low

### Phase 11: Rating Prompt (15 min)
**Files:** `components/RatingPrompt.tsx`  
**Changes:**
- Convert from inline to modal
- Auto-show after payout status changes to "paid"
- Add skip/dismiss option
- Show rating on creator profile

**Risk:** Low

---

## 📊 COMPLETE FILE MANIFEST

### Files to Create (6 new)
| File | Purpose |
|------|---------|
| `components/CampaignForm.tsx` | Shared campaign create/edit form |
| `components/ReviewFeedbackModal.tsx` | Reusable approve/reject modal |
| `components/MessageThread.tsx` | Shared message list + composer |
| `components/EarnSuccess.tsx` | Post-submission success screen |
| `hooks/useMessages.ts` | Shared message polling hook |
| `hooks/useCampaignFilters.ts` | Shared filter state for browse |

### Files to Modify (18 existing)
| File | Phase | What changes |
|------|-------|--------------|
| `app/globals.css` | 1 | Add design tokens |
| `tailwind.config.js` | 1 | Add z-index, spacing, font weight |
| `app/browse/BrowseClient.tsx` | 2 | Render filter chips, wire to API |
| `app/c/[id]/CampaignDetailClient.tsx` | 3 | Tabbed content, one CTA, sticky bar |
| `components/HomePageClient.tsx` | 4 | 9→3 sections, inline how-it-works |
| `app/checkout/page.tsx` | 5 | Remove donation, clean up |
| `app/c/[id]/donate/page.tsx` | 5 | Delete entirely (redirect) |
| `components/TopNav.tsx` | 6 | 13→7 items, fix logo |
| `components/ChatWidget.tsx` | 6 | Use MessageThread |
| `app/messages/page.tsx` | 6 | Use MessageThread |
| `app/dashboard/page.tsx` | 7 | Extract form, add wizard/preview |
| `app/review/page.tsx` | 8 | Use ReviewFeedbackModal |
| `components/EarnModal.tsx` | 9 | Add share incentive |
| `components/PaymentSuccess.tsx` | 9 | Better next actions |
| `components/StripePaymentModal.tsx` | 9 | Better loading state |
| `components/RatingPrompt.tsx` | 11 | Convert to modal |

### Files to Delete (1)
| File | Reason |
|------|--------|
| `app/c/[id]/donate/page.tsx` | Replaced by modal + redirect to /checkout |

---

## 🧪 TESTING STRATEGY

### Per-Phase Checklist
1. [ ] `npm run build` passes with 0 errors
2. [ ] No console errors in dev tools
3. [ ] All existing auth flows work (login, logout, signup)
4. [ ] Mobile (375px) renders correctly
5. [ ] Desktop (1440px) renders correctly
6. [ ] Dark theme only (no light mode to break)
7. [ ] No dead code, unused imports, or console.logs

### Cross-Phase Smoke Tests
- [ ] **Full artist flow:** Login → Dashboard → Create campaign → Fund → View → Review submissions
- [ ] **Full creator flow:** Login → Browse → Join campaign → Submit video → Check earnings → Get paid
- [ ] **Full visitor flow:** Browse campaigns → View campaign → Donate → Share
- [ ] **Chat flow:** Open chat from profile → Send message → Receive reply → Check messages page

---

## 🔄 ROLLBACK PLAN

### Critical path
If any phase breaks the build or core functionality:

1. **Revert the file(s) changed** in that phase using git: `git checkout HEAD -- <filepath>`
2. **If build was the issue:** The failing file is caught by `npm run build` before any deploy — never force-push a broken build
3. **If phase 1 (design tokens) breaks:** Tokens are additive — removing them restores original state with no side effects
4. **If phase 3 (campaign page) breaks:** This is the highest-traffic page. Restore `CampaignDetailClient.tsx` first, then debug
5. **If phase 6 (chat) breaks:** Two paths exist — widget and full page. If widget breaks, users can still use Messages page and vice versa

### Worst-case scenario
All phases fail → `git reset --hard HEAD~10` restores everything to pre-overhaul state (assuming you commit per phase)

---

## 💡 KEY DECISIONS MADE

| Decision | Rationale |
|----------|-----------|
| Keep `/checkout` page for deposits only | Donations don't need a full page — modal is sufficient. Deposits have more fields (campaign selector, amount math) |
| Remove `/c/[id]/donate` entirely | Two donation UI paths = confused users. Modal is proven (GoFundMe, Kickstarter both use modal donation) |
| Keep SupportWidget separate from ChatWidget | Support is AI-driven, Chat is human-to-human. Different purposes, different UIs. |
| Keep BottomNav unchanged | 4 tabs is clean, maps to user journeys, no reason to change |
| One primary CTA per page | Copied from Airbnb, Uber, GoFundMe, Kickstarter — unanimous industry pattern |
| All heading weights to 900 | Copied from Groover (live CSS extraction). 900 weight = maximum impact, premium feel |
| 10-step gray scale | Copied from BeatStars (production CSS). Industry best practice for depth/hierarchy |
| Named z-index layers | Copied from BeatStars. Prevents z-index wars (z-50, z-[9999], etc.) |

---

## ⏱️ ESTIMATED TOTAL TIME

| Phase | Description | Time | Dependencies |
|-------|-------------|------|--------------|
| 0 | Shared component extraction | 30 min | None |
| 1 | Design system tokens | 20 min | None |
| 2 | Browse page filters | 30 min | Phase 1 |
| 3 | Campaign page rewrite | 60 min | Phase 1 |
| 4 | Homepage rewrite | 45 min | Phase 1 |
| 5 | Checkout + donate consolidation | 45 min | Phase 3 (campaign page) |
| 6 | TopNav + messages consolidation | 40 min | Phase 0 |
| 7 | Dashboard + creation wizard | 60 min | Phase 0, Phase 1 |
| 8 | Review page + feedback modal | 30 min | Phase 0 |
| 9 | Payment flows polish | 20 min | Phase 3 |
| 10 | Empty states + loading states | 20 min | All phases (final polish) |
| 11 | Rating prompt modal | 15 min | Phase 0 |
| **Total** | | **~7 hours** | |

---

## ✅ DEFINITION OF DONE (Global)

The overhaul is complete when:
1. Every page has exactly **one primary CTA** (no competing actions)
2. Every page has **loading, empty, and error states** using shared components
3. **Mobile experience** is fully functional (sticky bars, bottom nav, thumb-reachable CTAs)
4. **No dead code** remains — every component is used, every import is necessary
5. All **5 user flows** (artist create, creator submit, visitor donate, artist review, user chat) work end-to-end
6. `npm run build` passes with 0 errors
7. Design tokens are used consistently (not a mix of hardcoded values and tokens)
8. The app is **demonstrably better** than before — not just different
