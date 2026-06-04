<!--
================================================================================
ARCHIVED — See SELAH.md for current source of truth.

This file is preserved for historical reference only. All actionable content
has been consolidated into SELAH.md (the living document).
================================================================================
-->

# Dashboard Audit — June 3, 2026
**Current:** 684 lines (`page.tsx`) + 278 lines (`ArtistDashboardSection.tsx`) = 962 lines
**Audience:** Artists + Creators (both on same page, no differentiation)

---

## Problems Found

### P0 — No Edit Profile
Artist creates a profile via onboarding → `api/artist/claim` creates the record → user lands on dashboard → **nowhere to edit bio, photo, social links**. The `PATCH /api/artists/[slug]` endpoint exists but no UI calls it.

### P0 — No Tab Navigation
684 lines, one flat scroll. No tabs, no sections. Artists see: ActionTracker → ArtistSection → Referral → Stats → Campaign Grid. Creators see: ActionTracker → nothing useful → "no campaigns" empty state.

### P0 — Creator Dashboard Doesn't Exist
If `user_type = 'creator'`, the dashboard shows:
- `ActionTracker` (minimal value)
- Referral link (mildly useful)
- Empty campaign state ("Create your first campaign" — irrelevant for creators)
Creators need: submission stats, earnings total, browse campaigns CTA.

### P1 — Wizard Hijacks Page
`step='wizard'` replaces the entire page content. No way to peek at campaigns while creating. Should be a modal/drawer.

### P1 — ArtistSection Uses Fragile Name Search
`fetch(/api/artist/search?...display_name...)` — breaks if name differs slightly. Should query `artist_profiles.claimed_by_user_id` directly.

### P1 — Referral Link Buried
Referral card sits between SpotifyCta and campaign stats. Creators won't find it. Should be a dedicated tab or prominent CTA.

### P2 — No Quick Start
New users land on empty campaign grid with no guidance. No "next steps" checklist.

### P2 — Stats Only Show When Campaigns Exist
`{campaigns.length > 0 && (...stats...)}` — first-time artists see nothing. Stats should always show (even if zero).

### P2 — Campaign Cards Are Slow
Each card has: cover image → title → 3 stats → progress bar → 3 buttons. Artists with 10+ campaigns have a very long page.

### P3 — ActionTracker Is Weak
`<ActionTracker userType={profile?.type} />` — minimal component. Doesn't guide the user on next actions.

---

## Target: New Dashboard Architecture

### Layout
```
┌──────────────────────────────────────┐
│  Welcome back, {name}!               │
│  {role} · {joined_date}              │
├──────────────────────────────────────┤
│  [Overview] [Campaigns/Submissions]   │
│  [Profile]  [Earnings]               │
├──────────────────────────────────────┤
│                                      │
│  {tab content}                       │
│                                      │
└──────────────────────────────────────┘
```

### Overview Tab (Both)
- **Welcome card**: "Welcome back, {name}! You're a {role}."
- **Quick stats row**: campaigns/submissions, views, earnings, referalls
- **Quick actions**: "Create campaign" (artist), "Browse campaigns" (creator)
- **Recent activity**: 3-5 latest events (new submission, campaign funded, etc.)
- **Spotify Connect**: compact banner if not connected

### Campaigns Tab (Artist) / Submissions Tab (Creator)
**Artist view:**
- Stats bar (active, submissions, views, spent)
- Campaign grid with inline edit modal
- "New campaign" button → opens drawer/modal

**Creator view:**
- Stats bar (submissions, approved, pending, payout)
- Submission list with status badges
- "Browse campaigns" CTA

### Profile Tab (Artist Only)
- **Profile photo** upload
- **Artist name** (read-only, from discovered_artists)
- **Bio** textarea (editable)
- **Genres** chip selector
- **Social links**: Instagram, TikTok handles
- **Artist page link**: "View your public profile →"
- **Embed widget**: copy embed code

### Earnings Tab (Both)
**Artist:** total donated, top supporters, campaign breakdown
**Creator:** total earned, paid out, pending, submission history

---

## Implementation Plan

### Phase 1: Architecture (30 min)
1. Extract CampaignWizard into modal component (`CampaignWizard.tsx`)
2. Create tab state management
3. Add `claimed_by_user_id` query to ArtistSection

### Phase 2: Tabs + Overview (30 min)
1. Build tab navigation with URL state
2. Overview tab with welcome + quick stats + recent activity
3. Conditional content by user type

### Phase 3: Profile Tab (30 min)
1. Edit bio, social links, photo form
2. API call to PATCH endpoint

### Phase 4: Creator Dashboard (30 min)
1. Creator view in Campaigns/Submissions tab
2. Submission list with status
3. Browse campaigns CTA

### Phase 5: Polish (30 min)
1. Loading skeletons per tab
2. Empty states
3. Error boundaries
4. Remove old ArtistDashboardSection
