<!--
================================================================================
ARCHIVED — See SELAH.md for current source of truth.

This file is preserved for historical reference only. All actionable content
has been consolidated into SELAH.md (the living document).
================================================================================
-->

# Selah.fm — Gamification, Referral & Viral Loop Blueprint

**Date:** June 4, 2026  
**Research Sources:** Duolingo (128M MAU, 37% DAU/MAU), Stack Overflow (reputation + privileges), Revolut (65% via referrals, activation-based), GitHub (contribution graph), Foursquare (mayorships + badges)

---

## 1. Referral Economics — The Revenue-Share Model

### Your question: 10% all to referrer, or split?

**Recommended model: 10% referrer + 5% referee, both as campaign budget credits**

```
Artist A refers Artist B
Artist B deposits $100 into their campaign
                                  You (the platform)
                                  ┌─────────────────────┐
                                  │ Gross deposit: $100  │
                                  │ Platform fee: 20%    │
                                  │                      │
                                  │ Referrer gets: 10%   │
                                  │ Referee gets:  5%    │
                                  │ Platform keeps: 5%   │
                                  └─────────────────────┘
                                          ↓
Referrer A's campaign: +$10 budget
Referee B's campaign:  +$5 welcome bonus
Platform keeps:        $5 net
```

**Why split 10%/5% instead of 10%/0%:**

| Model | Referrer Motivation | Referee Motivation | Platform Net | Viral Potential |
|-------|-------------------|--------------------|--------------|----------------|
| 10% referrer only | High (free money) | None | 10% | Medium — referee has no reason to deposit fast |
| **10% referrer + 5% referee** | **High** | **High (bonus on first deposit)** | **5%** | **High — both sides want the referee to deposit** |
| 5% referrer + 5% referee | Low | Medium | 10% | Low — referrer not motivated enough |

**The 10/5 split maximizes the viral loop** because:
- Referrer actively coaches referee to deposit (they get 10%)
- Referee has immediate incentive to deposit (they get 5% bonus)
- At $5 net on $100, the math still works: at 21 users → $0 cost. At 2,100 users → sustainable.

### Activation Requirements (Revolut-inspired)

```
REFERRER SENDS LINK
        ↓
REFEREE SIGNS UP
        ↓
REFEREE COMPLETES ONBOARDING (name, genres, handles)
        ↓
REFEREE MAKES FIRST DEPOSIT (min $10)
        ↓
10% CREDITED TO REFERRER'S CAMPAIGN BUDGET
 5% CREDITED TO REFEREE'S CAMPAIGN BUDGET
        ↓
BOTH GET PUSH NOTIFICATION + EMAIL
```

**Why activation-based (not signup-based):**
- Revolut: referee must add money, order card, make 3 purchases
- Without activation requirements, referral spam destroys the economics
- First deposit requirement ensures only real users generate revenue

---

## 2. Core Gamification System

### Currencies

| Currency | Earned By | Spent On | Display |
|----------|-----------|----------|---------|
| **XP (Experience)** | All actions on platform | Level progression only | Profile header, leaderboard |
| **Streak** | Consecutive days active | Streak freezes (optional) | Profile + notification |
| **Reputation** | Quality contributions (approval rate, helpfulness) | Unlocks privileges | Profile, badges |
| **Credits** | Referral bonuses | Campaign budget only | Dashboard |

### Levels (unified across all user types)

| Level | XP Required | Title | Privileges Unlocked |
|-------|-------------|-------|---------------------|
| Bronze 1 | 0 | Newcomer | Basic access |
| Bronze 2 | 100 | Rising | Custom profile |
| Bronze 3 | 300 | Active | Priority support |
| Silver 1 | 700 | Regular | Early access to new campaigns |
| Silver 2 | 1,200 | Established | Featured in search results |
| Silver 3 | 2,000 | Trusted | Moderation tools (report reviews) |
| Gold 1 | 3,500 | Pro | "Pro" badge on profile |
| Gold 2 | 5,500 | Expert | Priority campaign listing |
| Gold 3 | 8,000 | Master | Access to beta features |
| Platinum | 12,000 | Elite | Direct line to founder |
| Diamond | 20,000 | Legend | Custom profile theme |

### How XP is earned (per user type)

**Artists:**
| Action | XP | Notes |
|--------|----|-------|
| Create campaign | 25 | One-time per campaign |
| Deposit funds ($10 = 1 XP) | 1 per $10 | Scales with budget |
| Review submission | 5 | Per review |
| Approve submission within 24h | +5 bonus | Fast review bonus |
| Complete campaign (budget spent) | 50 | |
| Total raised milestone ($100, $500, $1K) | 100-500 | One-time |
| Refer a friend who deposits | 100 | |

**Creators:**
| Action | XP | Notes |
|--------|----|-------|
| Submit video | 10 | Per submission |
| Get approved | 25 | Per approval |
| Reach 10K views on submission | 50 | |
| Earn first $10 | 100 | One-time |
| Maintain 90%+ approval rate | 50/week | Weekly bonus |
| 30-day streak | 500 | One-time |
| Refer a friend who deposits | 100 | |

**Fans:**
| Action | XP | Notes |
|--------|----|-------|
| Sign up | 25 | |
| Follow an artist | 5 | |
| Donate (every $5) | 10 | |
| Comment on a track | 3 | Per comment |
| Review a campaign | 5 | Per review |
| Share a campaign on social | 15 | |
| Refer a friend who signs up | 50 | |

### Streak System (Duolingo-inspired)

```
┌─────────────────────────────────────────────────────┐
│  🔥 Day 12                                         │
│  You've been active for 12 days straight!           │
│                                                     │
│  Mon Tue Wed Thu Fri Sat Sun                        │
│   ✅  ✅  ✅  ✅  ✅  ✅  🔥                        │
│                                                     │
│  3 more days to unlock 7-day streak bonus!          │
│                                                     │
│  [Complete one action today]                        │
└─────────────────────────────────────────────────────┘
```

**Streak rewards:**
| Streak Length | Reward | 
|--------------|--------|
| 3 days | 25 XP bonus |
| 7 days | 100 XP bonus + "Week Warrior" badge |
| 14 days | 250 XP bonus |
| 30 days | 500 XP bonus + "Monthly Master" badge + 1 streak freeze |
| 60 days | 1,000 XP bonus |
| 90 days | "Dedicated" badge + featured profile |
| 365 days | "Legendary" badge + custom profile theme |

**Streak freeze:** Users can purchase streak freezes using XP (500 XP each). This prevents losing a streak on busy days (Duolingo's most retention-critical feature).

### Badge System (Stack Overflow-inspired)

**Bronze badges (easy — first achievements):**
| Badge | Requirement |
|-------|-------------|
| First Campaign | Create your first campaign |
| First Submission | Submit your first video |
| First Approval | Get your first video approved |
| First Donation | Make your first donation |
| First Review | Review your first submission |
| First Referral | Refer your first friend |
| Profile Complete | Fill out all profile fields |
| 3-Day Streak | Active for 3 consecutive days |

**Silver badges (medium — consistent effort):**
| Badge | Requirement |
|-------|-------------|
| 7-Day Streak | Active for 7 consecutive days |
| 10 Approvals | Get 10 submissions approved |
| $100 Earner | Earn $100 total |
| $500 Raised | Raise $500 through campaigns |
| 10 Reviews | Review 10 submissions |
| 5 Referrals | Refer 5 friends who deposit |
| Top 10% Weekly | Finish in top 10% of weekly leaderboard |
| Fast Reviewer | Review 5 submissions within 24h of submission |

**Gold badges (hard — significant achievement):**
| Badge | Requirement |
|-------|-------------|
| 30-Day Streak | Active for 30 consecutive days |
| 100 Approvals | Get 100 submissions approved |
| $1K Earner | Earn $1,000 total |
| $5K Raised | Raise $5,000 through campaigns |
| 25 Referrals | Refer 25 friends who deposit |
| Top 3 Weekly | Finish in top 3 of weekly leaderboard |
| Perfect Week | Have every submission approved for a week |
| Community Choice | Most upvoted comment/review in a month |

---

## 3. The Constant Viral Loop

### Trigger Map (where sharing happens)

```
┌──────────────────────────────────────────────────────────────┐
│                   VIRAL LOOP TRIGGERS                         │
│                                                              │
│  CAMPAIGN CREATED ──────────► "Invite creators to apply!"    │
│       │                              │                       │
│       │                              ▼                       │
│       │                     Share link to campaign            │
│       │                     Referral code embedded            │
│       │                              │                       │
│       ▼                              ▼                       │
│  SUBMISSION APPROVED ──► "Share your success!"               │
│       │                              │                       │
│       │                              ▼                       │
│       │                     "I earned $X on Selah.fm!"       │
│       │                     Share → Instagram/TikTok/Twitter │
│       │                              │                       │
│       ▼                              ▼                       │
│  EARNINGS MILESTONE ────► "Unlock $10 referral bonus!"       │
│       │                              │                       │
│       │                              ▼                       │
│       │             "Invite a friend — you both get bonus!"  │
│       │                              │                       │
│       ▼                              ▼                       │
│  STREAK MILESTONE ──────► "Share your streak!"              │
│                                                              │
│  WEEKLY LEADERBOARD ────► "You're #5 this week!"            │
│                                                              │
│  BADGE UNLOCKED ────────► "I just earned the X badge!"      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Viral Coefficient Engineering

**Target:** K-factor > 1.0 (each user brings more than 1 new user)

**Formula:**
```
K = (Number of invites sent per user) × (Conversion rate of invites)

Current: 0 invites sent × 0% conversion = K = 0
Target: 3 invites sent × 35% conversion = K = 1.05
```

**Levers to pull:**

| Lever | Current | Target | How |
|-------|---------|--------|-----|
| Invites sent per user | 0 | 3 | In-product triggers (after campaign, after approval, after milestone) |
| Conversion rate | 0% | 35% | Activation-based rewards (both sides benefit), clear value prop in share text |
| Time to first referral | ∞ | 7 days | Nudge after first campaign creation, first approval, first $ earned |

### Share Text Templates

**After campaign creation (artist):**
```
"🎵 I just launched a campaign for my track on Selah.fm! 
Creators can earn $XX/1M views making TikToks & Reels with my music.
Join and earn: [link]
Refer a creator and you both get bonus budget! 🎶"
```

**After submission approval (creator):**
```
"🎬 My video just got approved on Selah.fm! 
Earned $XX so far for [XX] views. 
Want to make money creating content? Start here: [link]
Invite a friend and you both get bonus credits! 🚀"
```

**After donation (fan):**
```
"❤️ Just supported [Artist Name] on Selah.fm! 
Creators make TikToks & Reels with their music and get paid per view. 
Check it out: [link]"
```

**Weekly streak/share reminder:**
```
"🔥 You've been active on Selah.fm for [X] days straight!
Share your progress and invite a friend:
• You earn 10% of their deposits
• They get a 5% welcome bonus
[Share link]"
```

---

## 4. Implementation Plan

### Phase A: Foundation (Sprint 1, ~4h)
1. **Database migration** — Add `xp`, `level`, `streak_count`, `streak_last_date` to users table
2. **XP tracking** — Middleware function that awards XP on all key actions
3. **Referral rewards** — Update webhook: 10%/5% split on first deposit
4. **Badge definitions** — Create `achievements` table with all badge types

### Phase B: UI (Sprint 2, ~3h)
1. **Profile gamification section** — Show level, XP bar, streak, badges
2. **Referral dashboard** — Link, stats, referral list with status
3. **Streak widget** — Weekly calendar view with daily checkmarks
4. **Share triggers** — After campaign creation, after approval, after milestone

### Phase C: Social (Sprint 3, ~2h)
1. **Leaderboards** — Weekly/monthly/all-time by category
2. **Push notifications** — "You earned the X badge!", "Your streak is at risk!"
3. **Share-to-social** — Pre-written posts with referral link for Instagram/TikTok/Twitter

---

## 5. Economics Summary

| Transaction | Amount | Referrer | Referee | Platform | Notes |
|------------|--------|----------|---------|----------|-------|
| $10 deposit | $10 | $1 (10%) | $0.50 (5%) | **$0.50 net (5%)** | Minimum viable deposit |
| $50 deposit | $50 | $5 | $2.50 | **$2.50 net** | Typical first deposit |
| $100 deposit | $100 | $10 | $5 | **$5.00 net** | Average campaign |
| $500 deposit | $500 | $50 | $25 | **$25.00 net** | Serious artist |

At 21 users with $0 referred deposits: **$0 cost, 100% retention of 20% fee**
At 100 users with 30% referred: still highly profitable
At 1,000 users with 50% referred: sustainable growth engine
