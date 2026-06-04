# Selah.fm — Homepage, Analytics & Referral Blueprint

**Date:** June 4, 2026  
**Research Sources:** DesignKey SaaS patterns (Linear, Vercel, Stripe, Cursor, Posthog, Resend), Revolut referral $4B case study, Spotify for Artists dashboard, SaaS landing page best practices

---

## 1. Homepage Conversion

### Research: World-Class Patterns (from DesignKey teardowns)

| Pattern | Example | Selah.fm Current | Gap |
|---------|---------|------------------|-----|
| **Real product UI above the fold** | Linear, Cursor, Vercel | Illustration-based hero | ❌ No product screenshot, no interactive demo |
| **Short headline (<12 words)** | All top 20 SaaS | "Your music, real creators, real views." (6 words ✅) | ✅ Good |
| **Customer logo bar** | Stripe, Vercel, Resend | Missing (expected at 21 users) | 🟡 Add when have 5+ real customers |
| **ICP-named sections** | Resend, Linear | "For artists" / "For creators" ✅ | ✅ Already have this |
| **Interactive in-page demo** | Stripe checkout, Cursor autocomplete | Missing | ❌ Would be powerful — e.g., "try the CPM calculator" in-page |
| **Transparent pricing on page** | All converting SaaS | "No upfront cost" shown ✅ but no CPM rate ranges | 🟡 Show "Artists start at $0.10 CPM" ranges |
| **Performance as craft** | Vercel, Linear (90+ Lighthouse) | Not measured | ❌ Should audit Lighthouse scores |
| **"What we don't do" section** | Linear, Posthog | Missing | 🟡 Low priority now |
| **Case studies with numbers** | Stripe, Vercel | Missing (no real customers yet) | 🟡 Add after curated launch |

### Recommended Homepage Structure

```
┌──────────────────────────────────────────────────────────┐
│ TOPNAV: Logo · Browse · Blog · [Sign in] [Start]        │
├─ HERO ───────────────────────────────────────────────────┤
│ "Your music, real creators, real views."                 │
│ "Vetted creators make TikToks, Reels, and Shorts with   │
│  your track. You approve every video. You only pay for   │
│  verified views."                                        │
│                                                          │
│ ┌──────────────────────┐  ┌─────────────────────┐       │
│ │ 💻 Real campaign UI  │  │ CPM Calculator demo │       │
│ │   screenshot         │  │ (interactive slider)│       │
│ │   (from live site)   │  │                     │       │
│ └──────────────────────┘  └─────────────────────┘       │
│                                                          │
│ [Promote your music →]    [Start earning →]              │
│                                                          │
│ ✦ Free to start  ✦ You earn 80%  ✦ Paid via Stripe     │
├─ SOCIAL PROOF ───────────────────────────────────────────┤
│ "Join 21 creators earning on Selah.fm"                   │
│ Stats bar: $X paid · Y submissions · Z artists           │
├─ HOW IT WORKS ───────────────────────────────────────────┤
│ (current 3-step sections are strong — keep)              │
├─ FAQ ────────────────────────────────────────────────────┤
│ (moved from blog to homepage — answers objections)       │
├─ FOOTER ─────────────────────────────────────────────────┤
└──────────────────────────────────────────────────────────┘
```

### Changes Needed

| # | Change | Effort | Impact |
|---|--------|--------|--------|
| 1 | Replace hero illustration with real campaign page screenshot | Low | High |
| 2 | Add interactive CPM calculator in hero | Medium | High |
| 3 | Add real social proof numbers (from health endpoint) | Low | High |
| 4 | Move FAQ section to homepage | Low | Medium |
| 5 | Add "trust bar" with badges below CTAs | Low | Medium |

---

## 2. Analytics Dashboard

### Research: What World-Class Dashboards Show

**Spotify for Artists** pattern:
- **Top line**: Monthly listeners, followers, streams (big numbers, trend arrows)
- **Chart**: Listeners over time (7/28/90 day toggles)
- **Breakdown**: By track, by playlist, by country, by source
- **Alerts**: "Your track was added to X playlist"

**Stripe Dashboard** pattern:
- **Top line**: Gross volume, fees collected, payouts (real-time)
- **Chart**: Revenue over time (daily/weekly/monthly)
- **Tables**: Recent transactions, pending payouts
- **Search**: Find any transaction

**Patreon** pattern:
- **Top line**: Monthly revenue, patron count, new patrons
- **Chart**: Revenue trending up/down
- **List**: Recent activity feed
- **Alerts**: "New patron joined"

### Selah.fm Dashboard — Current vs Target

| Metric | Artists Currently | Creators Currently | Target |
|--------|------------------|-------------------|--------|
| Campaign views | ❌ Missing | ❌ Missing | Line chart with 7/30/90d |
| Earnings | ✅ Total $ | ✅ Total $ | ✅ + breakdown by campaign |
| Payout status | ✅ Budget remaining | ✅ $ earned | ✅ + pending/processing/paid |
| Submission funnel | ❌ Missing | ❌ Missing | ✅ Submitted → Approved → Paid |
| Approval rate | ❌ Missing | ❌ Missing | ✅ % approved, avg time to review |
| CPM benchmark | ❌ Missing | ❌ Missing | ✅ "Your CPM vs similar artists" |
| Active creators/artists | ❌ Missing | ❌ Missing | ✅ Count + trend |
| Platform fee total | ❌ Missing | ❌ Missing | ✅ "You've paid $X in fees" |

### Recommended Dashboard Layout (Artist View)

```
┌──────────────────────────────────────────────────────────┐
│ HEADER: Logo · Dashboard · Campaigns · Earnings          │
├─ OVERVIEW ───────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │ $X,XXX  │ │   XX    │ │   XX%   │ │  $XXX   │        │
│ │ Raised  │ │Submis-  │ │Approval │ │ Platform│        │
│ │         │ │sions    │ │ Rate    │ │  Fees   │        │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
│ ↑ 23% vs last month                                     │
├─ CHART ─────────────────────────────────────────────────┤
│ [Views over time — 7d / 30d / 90d toggle]              │
│ ┌─────────────────────────────────────────────────┐     │
│ │ ▁▃▆▇▆▅▇▆▅▇█▇▆▅▆▇█▇▆▅▆▇                              │     │
│ └─────────────────────────────────────────────────┘     │
├─ RECENT SUBMISSIONS ────────────────────────────────────┤
│ Video A · Creator Name · 12K views · [Approved] ✅     │
│ Video B · Creator Name · 8K views  · [Review] 🔍       │
│ Video C · Creator Name · 3K views  · [Pending] ⏳      │
└──────────────────────────────────────────────────────────┘
```

### Recommended Dashboard Layout (Creator View)

```
┌──────────────────────────────────────────────────────────┐
│ HEADER: Logo · Dashboard · Earnings · Browse             │
├─ OVERVIEW ───────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │  $XXX   │ │   X%    │ │  XX    │ │ $XX     │        │
│ │ Earned  │ │Approval │ │Submis- │ │ Pending │        │
│ │         │ │  Rate   │ │ sions  │ │ Payout  │        │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
├─ EARNINGS CHART ────────────────────────────────────────┤
│ [Earnings over time — toggle by campaign]               │
│ ┌─────────────────────────────────────────────────┐     │
│ │ ▁▃▆▇▆▅▇▆▅▇█▇▆▅▆▇█▇▆▅▆▇                              │     │
│ └─────────────────────────────────────────────────┘     │
├─ SUBMISSION STATUS ─────────────────────────────────────┤
│ Campaign A · Video title · [Payout pending ⏳]          │
│ Campaign B · Video title · [Approved ✅]                │
│ Campaign C · Video title · [Rejected ❌]                │
└──────────────────────────────────────────────────────────┘
```

### Changes Needed

| # | Change | Effort | Impact |
|---|--------|--------|--------|
| 1 | Add submission funnel metrics to artist dashboard | Medium | High |
| 2 | Add views-over-time chart (7/30/90d) | Medium | High |
| 3 | Add approval rate + avg review time | Low | Medium |
| 4 | Add platform fee total display | Low | Medium |
| 5 | Add pending payout status per submission | Low | Medium |

---

## 3. Referral Mechanics

### Research: Revolut's $4B Growth Engine

**Key patterns from Revolut:**
- 65% of new customers via referrals
- Time-boxed campaigns (21-day batches, deadline creates urgency)
- Capped rewards (max N paid referrers per campaign)
- Variable rewards (£40-70, adjusted by market/season)
- **Activation-based** (not signup-based): referee must do specific actions
- Progress UI + real-time notifications to referrer
- Referrer as "buddy" who coaches referee through steps
- Fraud-resistant: exclude easy-to-game transactions

### Selah.fm's Model — No Upfront Cost, % of Deposits

**The mechanic:**
- Platform takes 20% fee on all campaign deposits
- Referrer gets **10%** of referred user's total deposits (half of our 20%)
- Bonus is credited as **campaign budget** (not cash — keeps money in platform)
- Referee gets **5%** bonus on first deposit (also half of our 20%)

**Example flow:**
```
Artist A refers Artist B
Artist B deposits $100 into their campaign
Platform takes: $20 (20% fee)
Artist A gets: $10 (10% referral bonus → added to A's campaign budget)
Artist B gets: $5 (5% welcome bonus → added to B's campaign budget)
Platform keeps: $5 net (10% after both bonuses)
```

**Activation requirements** (inspired by Revolut):
1. Referee must sign up using referral link
2. Referee must complete onboarding (name, genres, platform handles)
3. Referee must make first deposit (minimum $10)
4. Bonus credited within 24h of deposit clearing

**Why this works:**
- ✅ **Zero upfront cost** — platform only pays when revenue comes in
- ✅ **Aligned incentives** — referrer wants referee to deposit (they get 10%)
- ✅ **Keeps money in platform** — bonus adds to campaign budget, not withdrawn
- ✅ **Scalable** — at 21 users, cost is negligible. At 2,100 users, still only 10% of revenue
- ✅ **Fraud-resistant** — requires real deposit, not just signup

### Implementation: Referral UI

```
REFERRER DASHBOARD:
┌─────────────────────────────────────────────────────────┐
│ 🎁 Your referral link                                    │
│ selah.fm?ref=ABC123   [Copy]                            │
│                                                          │
│ You earn 10% of every deposit they make                  │
│ They earn 5% welcome bonus                              │
│                                                          │
│ Your referrals: 2  ·  Total earned: $12.50              │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Referral  │ Status       │ Deposited │ You earned  │ │
│ │──────────│──────────────│───────────│─────────────│ │
│ │ Alex     │ ✅ Completed │ $50      │ $5.00       │ │
│ │ Sam      │ ⏳ Onboarded │ $0       │ $0.00       │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Changes Needed

| # | Change | Effort | Impact |
|---|--------|--------|--------|
| 1 | Update referral table: add `deposit_total_cents`, `bonus_paid_cents` | Low | High |
| 2 | Add referral dashboard section to dashboard | Medium | High |
| 3 | Add referral link to TopNav (visible when logged in) | Low | Medium |
| 4 | Update webhook: credit referral bonus on first deposit | Medium | High |
| 5 | Add referral CTA after campaign creation ("Invite another artist →") | Low | Medium |

---

## Summary: All Three Priorities

| Topic | Current Score | Target Score | Sprint |
|-------|--------------|-------------|--------|
| **Homepage** | 5/10 | 9/10 | Sprint 1 |
| **Analytics Dashboard** | 4/10 | 8/10 | Sprint 1 |
| **Referral System** | 3/10 | 8/10 | Sprint 1 |

All three can be executed in Sprint 1 with ~4-6 hours of work combined.
