# Artist Wallet — Research, Audit & Execution Plan
**Date:** 2026-06-03  
**Goal:** Shift from per-track campaign funding to artist-level wallet. Top 0.01% platform quality.

---

## 1. Competitor Analysis

### How Top Platforms Handle Creator Funding

| Platform | Model | Balance | Payouts | Key Insight |
|----------|-------|---------|---------|-------------|
| **Patreon** | Subscription wallet | Single creator balance, updated monthly | Monthly payout via Stripe/PayPal | "Creator balance" is the canonical source of truth |
| **BeatStars** | Producer wallet | Earnings from all beats pooled | Withdrawal to bank/PayPal | Wallet = all revenue, not per-track |
| **Kickstarter** | Project pool | Per-project pool, all-or-nothing | Stripe mass payments | Single pool simplifies backer psychology |
| **Substack** | Subscription balance | Writer balance, net 48h | Stripe payouts | Near-real-time payouts from pooled subscriptions |
| **YouTube** | Channel balance | AdSense + memberships pooled | Monthly threshold payout | Mixed revenue sources, single balance |
| **GitHub Sponsors** | Sponsor balance | Monthly sponsorships pooled | Stripe payouts | Zero-fee model, single source of truth |

### The Pattern That Emerges

**Every successful platform uses a SINGLE balance for the creator.** Not per-project, not per-track. A single wallet that pools all revenue. This is non-negotiable for 10/10 UX.

### What Selah.fm Does Wrong Today

| Current (per-track) | Problem |
|---------------------|---------|
| Artist funds Track A ($25) and Track B ($50) | Two budgets to manage, confusing |
| Track A runs out, Track B has $40 left | Wasted budget — can't transfer |
| Creator wants to promote Track A but it's empty | Frustrating dead end |
| "Fund this campaign" feels transactional | Fights "support the artist" psychology |
| 42 API routes manage per-campaign budgets | Massive complexity for no benefit |

---

## 2. Current Architecture Audit

### Database Tables Affected

| Table | Current | After |
|-------|---------|-------|
| `campaigns` | `total_budget_cents`, `budget_remaining_cents`, `max_payout_per_submission_cents`, `min_payout_per_submission_cents`, `flat_fee_bonus_cents`, `stripe_payment_intent_id` (all NOT NULL) | Make all budget fields NULLABLE. Campaigns become track metadata only. |
| `artist_profiles` | No balance | Add `balance_cents INTEGER DEFAULT 0`, `lifetime_deposits_cents INTEGER DEFAULT 0` |
| `campaign_donations` | `campaign_id` FK | Add `artist_id` FK (nullable), make `campaign_id` nullable |
| `submissions` | `campaign_id` FK, `payout_amount_cents` | No structural change — payouts still per-submission |

### API Routes (42 affected files)

| Route | Change Needed |
|-------|--------------|
| `POST /api/checkout` | Detect `artistSlug` → deposit to artist balance |
| `POST /api/artists/[slug]/fund` | Route funds to artist balance |
| `GET /api/campaigns` | Remove budget fields from response |
| `POST /api/campaigns` | Remove budget/amount validation |
| `GET /api/campaigns/[id]` | Remove budget fields |
| `POST /api/submissions` | Check artist balance instead of campaign budget |
| `GET /api/artists/[slug]` | Include balance in response |
| `GET /api/dashboard` | Show balance instead of per-campaign budgets |

### UI Components Affected

| Component | Current | After |
|-----------|---------|-------|
| `CampaignDetailClient.tsx` | Shows budget bar, "Add budget" button | Shows "Support artist" instead, no budget bar |
| `ArtistProfileClient.tsx` | Links to per-campaign donation | Links to artist donation |
| `Checkout` page | Supports both `campaignId` and `artistSlug` | Simplify — primarily artist-directed |
| `CampaignWizard.tsx` | Asks for budget | No budget — just track info |
| `Dashboard` Earnings tab | Shows per-campaign funding | Shows single balance + transaction history |
| `ArtistDashboardSection.tsx` | Tracks + CPM management | Tracks + CPM + balance |

---

## 3. Target Architecture

### New Data Model

```
┌─────────────────────┐       ┌──────────────────┐
│   artist_profiles   │       │   campaigns       │
├─────────────────────┤       ├──────────────────┤
│ artist_id (PK)      │       │ id (PK)          │
│ slug                │       │ track_title      │
│ balance_cents ◄─────┼──┐    │ track_url        │
│ lifetime_deposits   │  │    │ cover_art_url    │
│ claimed_by_user_id  │  │    │ cpm_rate_cents   │
└─────────────────────┘  │    │ status           │
                         │    │ artist_id (FK)───┼──┐
┌─────────────────────┐  │    └──────────────────┘  │
│  artist_transactions│  │                          │
├─────────────────────┤  │    ┌──────────────────┐  │
│ id (PK)             │  │    │ submissions      │  │
│ artist_id (FK)──────┼──┘    ├──────────────────┤  │
│ amount_cents        │       │ campaign_id (FK)─┼──┘
│ type (deposit/      │       │ creator_id       │
│       payout/       │       │ payout_amount    │
│       withdrawal)   │       └──────────────────┘
│ description         │
│ created_at          │
└─────────────────────┘
```

### Flow

```
1. Fan visits artist page
2. Clicks "Donate" → checkout
3. Enters amount → Stripe payment
4. Funds added to artist_profiles.balance_cents
5. Artist sees updated balance on Dashboard
6. All tracks are "funded" (balance > 0)
7. Creator submits video for any track
8. On approval, payout deducted from balance
9. Low balance warning at $10
```

### Business Logic Changes

```
FUNDING:
  Donation → artist_profiles.balance_cents += amount
  Deposit → artist_profiles.balance_cents += amount
  
SPENDING:
  Submission approved → artist_profiles.balance_cents -= payout_amount
  Refund → artist_profiles.balance_cents += amount
  
AVAILABILITY:
  track.isActive = artist.balance_cents > MINIMUM_BALANCE
  All tracks active if balance > $10
```

---

## 4. UI/UX Design — World-Class Patterns

### What 10/10 Looks Like

**Artist Dashboard — Balance Tab:**
```
┌─────────────────────────────────────────┐
│  Balance                                │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │  $127.50                        │    │
│  │  available balance              │    │
│  │  [Add funds] [Withdraw]         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Recent transactions:                   │
│  ┌─────────────────────────────────┐    │
│  │ +$50.00  Deposit       Jun 3    │    │
│  │ -$5.00   Payout: Track A Jun 3 │    │
│  │ +$25.00  Fan donation  Jun 2   │    │
│  │ -$10.00  Payout: Track B Jun 1 │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Artist Page — simplified:**
```
┌─────────────────────────────────────┐
│  Robert-Jan Mastenbroek             │
│  Budget: $127.50 · 11 tracks        │
├─────────────────────────────────────┤
│  [Donate] [Create]                  │
├─────────────────────────────────────┤
│  Tracks: All available (budget > $0)│
│  ┌──────────────────────────────┐   │
│  │ Track 1 · $10 CPM  [Create] │   │
│  │ Track 2 · $8 CPM   [Create] │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Creator submitting video:**
```
┌─────────────────────────────────────┐
│  Submit for Robert-Jan Mastenbroek  │
│                                     │
│  Artist balance: $127.50            │
│  Your payout if approved: $5.00     │
│                                     │
│  Track: [dropdown of all tracks]    │
│  Video URL: [input]                 │
│  [Submit]                           │
└─────────────────────────────────────┘
```

### Key UX Decisions

| Decision | Why |
|----------|-----|
| Balance shown on artist page | Transparency builds trust with creators |
| All tracks active if balance > $0 | No dead-end "fund this campaign" buttons |
| No per-track budgets | Eliminates the core complexity |
| Donate goes to artist, not track | Aligns with fan psychology |
| Transaction history in dashboard | Financial transparency |
| Low balance warning at $10 | Prevents surprise rejections |
| CPM still per-track | Artists may value songs differently |

---

## 5. Execution Plan

### Phase 1: Database (30 min)
1. Add `balance_cents`, `lifetime_deposits_cents` to `artist_profiles`
2. Create `artist_transactions` table
3. Make campaign budget columns nullable
4. Migration to migrate existing per-campaign budgets to artist balance

### Phase 2: API (1 hour)
1. `POST /api/checkout` — route artistSlug payments to balance
2. `POST /api/artists/[slug]/fund` — existing endpoint, redirect to balance
3. `GET /api/artists/[slug]` — include balance
4. `GET /api/artist/me` — include balance + transactions
5. `POST /api/submissions` — check balance instead of campaign budget
6. Remove budget validation from campaign creation

### Phase 3: UI (1 hour)
1. Balance tab on Dashboard (replaces Earnings tab for artists)
2. Artist page — show balance, remove per-campaign funding CTAs
3. Campaign detail — simplify, remove budget bar
4. Checkout — streamline for artist donations

### Phase 4: Cleanup (30 min)
1. Remove `total_budget_cents`, `budget_remaining_cents` from campaign responses
2. Update 42 API routes to drop budget references
3. Remove campaign wizard budget step

**Total: ~3 hours**

---

## 6. Risk Assessment

| Risk | Mitigation |
|------|------------|
| Existing campaigns have real budget data | Migration combines all per-campaign budgets into artist balance |
| Creators need to know if artist can pay | Show balance on artist page and submit modal |
| Artist overspends balance | Soft cap: balance must be > $10 to accept submissions |
| Transaction history missing | `artist_transactions` table records every change |
| 42 files to update | Systematic find-and-replace with validation per file |
