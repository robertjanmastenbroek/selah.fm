# Selah.fm — Auth & Onboarding Audit
**Date:** 2026-06-03
**Goal:** World-class signup → onboarding → first-action flow for both artists & creators

---

## Current Flow

```
Landing → /welcome-artists or /welcome-creators (beautiful, 7-section marketing pages)
  ↓
Login/Signup → /login
  ├─ Google OAuth (secondary, below "or" divider)
  └─ Email + Password (5 fields: role → name → email → password → consent)
  ↓
Auth callback → /auth/callback (detects new user → redirects to /onboarding)
  ↓
Onboarding → /onboarding (multi-step wizard)
  ├─ Artist: Role(dup) → Name → Genres → Save → /dashboard
  └─ Creator: Role(dup) → Name → Platforms → Genres → CPM → Save → /browse
  ↓
Dashboard → /dashboard (complex campaign management)
  └─ Empty state → Create campaign wizard (cover → details → launch → fund)
```

---

## Issues Found

### P0 — Critical

| # | Issue | Location |
|---|-------|----------|
| 1 | **Role selected twice** — User picks role on signup form, then again on onboarding step 0 | /login + /onboarding |
| 2 | **Email signup is 5 interactions** — Name, email, password, role, consent. In 2026, anything beyond 2 interactions before "in" is friction. | /login |
| 3 | **No brand personality on login** — Critical conversion page is a bare form. No social proof, no "what you're signing up for" preview. | /login |
| 4 | **Empty states everywhere** — New users see empty browse or dashboard with no guidance on what to do | /browse, /dashboard |

### P1 — High

| # | Issue | Location |
|---|-------|----------|
| 5 | **Google OAuth should be primary** — Currently secondary behind email. First option should be the path of least resistance. | /login |
| 6 | **Onboarding doesn't pass role from signup** — User picks artist/creator on login form, then selects again in onboarding (step 0) | /login → /onboarding |
| 7 | **No campaign templates** — New artists see 10+ empty form fields with no examples or presets | /dashboard wizard |
| 8 | **No creator first-run guidance** — New creators land on /browse with empty campaigns/artists and zero direction | /browse |
| 9 | **Claim flow is disconnected** — Artist finds claim page via email, signs up, then is redirected to generic onboarding instead of back to their claim | /claim → /login → /onboarding |

### P2 — Medium

| # | Issue | Location |
|---|-------|----------|
| 10 | **No progress save on signup** — If user closes browser mid-signup (especially email verification wait), they start over | /login |
| 11 | **Onboarding and dashboard overlap** — Onboarding asks name + genres, dashboard asks them again via campaign form | /onboarding → /dashboard |
| 12 | **No "skip for now" on any step** — Every onboarding step is mandatory. No way to explore before committing. | /onboarding |
| 13 | **Dashboard is overwhelming for first-time artists** — Full campaign management UI with stats cards (all zeros), edit buttons, and referral prompts | /dashboard |

---

## Competitor Patterns

| Platform | Key Pattern | Selah Adaptation |
|----------|------------|-----------------|
| **Spotify** | One-click Google/Apple signup → personalized onboarding (genre selection → artist discovery) | Google OAuth as primary, skip email/password |
| **TikTok** | "For You" feed instantly — no signup required to browse, smooth signup after first action | Browse campaigns without account, prompt signup when they try to join |
| **Patreon** | 2-step signup (Google → name) → then context-sensitive onboarding | 2 clicks to account, guided setup after |
| **BeatStars** | Role selection on signup → immediate storefront creation | Pass role from signup to onboarding, skip duplicate step |
| **Canva** | Templates as entry point — reduce blank-page anxiety | Campaign templates for new artists: "Start with a preset" |
| **Duolingo** | Learn by doing — immediate first lesson, no setup required | "Create your first campaign in 60 seconds" guided flow |
| **Notion** | Progressive disclosure — show only what's needed per step | Collapse dashboard to single "Create campaign" CTA for new users |

---

## Implementation Plan

### Phase 1: Login Page Overhaul (1 hour)

**Files:** `app/login/page.tsx`

Changes:
- Make Google OAuth the primary CTA (large, centered, no "or" divider)
- Add social proof strip below: "1,200+ campaigns · 2,000+ artists · Open source"
- Add 3 small benefit cards: "No bots" / "You set the CPM" / "Only pay for real views"
- Move email/password behind a "Continue with email" link
- Add "Why join?" micro-copy above the form
- Add loading animation on the Google button while OAuth redirects

### Phase 2: Eliminate Duplicate Role Selection (30 min)

**Files:** `app/login/page.tsx`, `app/onboarding/page.tsx`

Changes:
- Pass role from login/signup to onboarding via URL param: `/onboarding?role=artist`
- Skip step 0 in onboarding when role is already set
- Keep role selection in signup (it's useful for personalization) but make it a single tap

### Phase 3: Dashboard First-Run Experience (1 hour)

**Files:** `app/dashboard/page.tsx`

Changes:
- Detect if user is new (0 campaigns) → show "Create your first campaign" wizard immediately
- Add 3 campaign templates: "Quick promo ($25)", "Standard ($100)", "Premium ($500)"
- Pre-fill template values: CPM rate ($0.50/$1/$2), budget ($25/$100/$500), requirements template
- After first campaign creation → show dashboard with existing campaign

### Phase 4: Creator First-Run Experience (30 min)

**Files:** `app/browse/BrowseClient.tsx`

Changes:
- Detect if user is new AND logged in AND has 0 submissions → show "Welcome" banner
- Banner: "Start earning in 3 steps: 1. Pick a track 2. Make a video 3. Submit it"
- Add "How it works" quick-start card at top of browse
- Add CPM explanation tooltip on first hover

### Phase 5: Claim Flow Connection (30 min)

**Files:** `app/claim/[code]/page.tsx`, `app/login/page.tsx`

Changes:
- Pass `redirect=/claim/{code}` through login flow
- After signup, redirect back to claim page for claiming
- Remove "Create account to claim & manage" — replace with auto-redirect after signup

---

## Key Metrics

| Metric | Before | After Target |
|--------|--------|-------------|
| Signup form interactions | 5 fields + role | 2 clicks (Google) or 3 fields (email) |
| Onboarding steps (artist) | 4 (role dup + name + genres + save) | 2 (name + genres) |
| Onboarding steps (creator) | 6 (role dup + name + platforms + genres + cpm + save) | 4 (name + platforms + genres + cpm) |
| Time to first action | 3+ minutes | < 60 seconds |
| Dashboard overwhelm | Full UI with all-zero stats | Guided first campaign + templates |
