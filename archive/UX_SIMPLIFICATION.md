<!--
================================================================================
ARCHIVED — See SELAH.md for current source of truth.

This file is preserved for historical reference only. All actionable content
has been consolidated into SELAH.md (the living document).
================================================================================
-->

# Selah.fm — UX Simplification Strategy
**Version 1.0 · June 2, 2026 · Research + Planning Only (No Execution)**

> **Goal:** Simplify Selah.fm to a level where a first-time visitor understands the value proposition in 5 seconds, knows exactly what to do next, and experiences zero cognitive friction. Modeled after GoFundMe, Kickstarter, Airbnb, Uber, and Fiverr.

---

## 1. CURRENT STATE AUDIT — What's Broken

### 1.1 Too Many Pages / Screens

| Current Page | Purpose | Problem |
|---|---|---|
| `/` Homepage | Landing | 8 distinct sections, too many CTAs, information overload |
| `/browse` | Campaign discovery | Functional but cluttered — search, filters, create CTA, nav |
| `/c/[id]` | Campaign detail | Strongest page but too many competing actions (join, donate, claim, listen, share, support, create) |
| `/login` | Auth | Standard, functional |
| `/onboarding` | New user flow | Too many questions upfront |
| `/dashboard` | Artist dashboard | Empty for new users — no guided first action |
| `/earnings` | Creator earnings | Functional but lonely (1 user) |
| `/review` | Submission review | Functional, recently improved |
| `/messages` | DMs | New, lightly used |
| `/settings` | Settings | Standard |
| `/creators/[id]` | Creator profile | New, untested |
| `/guides/*` | SEO pillar pages | Pure content, good |
| `/genre/[slug]` | Programmatic SEO | Dynamic, functional |
| `/blog/*` | Blog | Good content, growing |
| `/tools/*` | Free SEO tools | Attracts traffic, good |
| `/faq` | FAQ | Useful |
| `/tos`, `/privacy`, `/dmca` | Legal | Required |

**Problem:** 30+ public-facing routes. Users get lost. Most pages are empty or unused. The navigation has too many links.

### 1.2 Homepage — Section Bloat

Current homepage sections (in order):
1. **Hero** — good headline, live stats, 2 CTAs, sign-in link ✅
2. **Featured campaigns** — grid of 6 cards, "View all" link ✅
3. **Problem/Solution** — "The old way vs Selah way" comparison ⚠️ (useful but long)
4. **What's possible** — 3 example scenario cards ✅
5. **Trust pillars** — 4 badges ✅
6. **How it works** — 6-step breakdown for artists + creators ⚠️ (duplicates info)
7. **Founder story** — personal bio ⚠️ (should be on /about)
8. **FAQ mini** — 3 questions ⚠️ (duplicates /faq)
9. **Final CTA** — "Stop paying for bots" ✅

**Problem:** 9 sections. Average visitor scrolls through maybe 3. The most important actions (sign up, browse campaigns) are buried beneath 4 other sections. The homepage tries to answer every possible question instead of driving one clear action.

### 1.3 Campaign Page — Action Overload

The campaign page (`/c/[id]`) has these competing actions:
- **Join campaign** (creator CTA — primary) ✅
- **Donate** (fan CTA — secondary) ⚠️ 
- **Claim this campaign** (artist CTA — only for unclaimed) ⚠️
- **Share** (social) ⚠️
- **Listen on** (Spotify, YouTube, Apple Music, etc.) ⚠️
- **Download assets** (Google Drive) ⚠️
- **View submissions** (if any) ✅
- **Breadcrumbs** (SEO) ✅

**Problem:** A first-time visitor sees 7+ clickable actions. Decision paralysis. The primary action ("Join campaign") competes with donate, claim, listen, share, and download. Compare to GoFundMe: **one primary action** (Donate), everything else is secondary.

### 1.4 Navigation — Too Many Links

Current TopNav links (authenticated):
- Logo (home)
- Browse
- Dashboard
- Messages (with unread badge)
- Notifications (bell icon)
- Profile/Settings

Current footer links:
- FAQ, Blog, Open source, + legal links

**Problem:** The nav is clean for now, but the mental model is fragmented. An artist logs in and sees "Dashboard" + "Browse" + "Messages" — which one do they click? The answer should be obvious.

---

## 2. REFERENCE PLATFORM ANALYSIS

### 2.1 GoFundMe — The Gold Standard for Campaign Pages

**Campaign page anatomy (desktop):**
```
┌──────────────────────────────────────────────────────────┐
│ [Organizer photo] Organizer name · Verified badge        │
│ [Large hero image / video]                               │
│                                                          │
│ Campaign title (large, bold)                             │
│ Location · Category                                      │
│                                                          │
│ ┌──────────────────────┐  ┌──────────────────────────┐   │
│ │ $12,345 raised       │  │ [DONATE NOW]  ← GREEN    │   │
│ │ ████████░░░░ 62%     │  │   #02A95C, 48px tall,    │   │
│ │ $20,000 goal         │  │   full-width on mobile   │   │
│ │ 234 donors           │  │                          │   │
│ │ 12 days left         │  │  [Share] [Donate]        │   │
│ └──────────────────────┘  └──────────────────────────┘   │
│                                                          │
│ [TABS: Story | Updates | Comments | Donors]              │
│                                                          │
│ Story text (long-form, images, formatting)               │
│                                                          │
│ [Organizer section — photo, bio, contact]                │
│                                                          │
│ [Recent donors — names, amounts, messages]               │
└──────────────────────────────────────────────────────────┘
```

**Mobile:** Same structure but stacked vertically. CTA is **fixed to bottom** — always visible. "Donate now" button is always in reach.

**Key patterns:**
- **Single primary CTA.** Donate now. Everything else is secondary.
- **Trust signals immediately visible:** Verified organizer badge, platform guarantee ("GoFundMe Giving Guarantee"), transparent fee display.
- **Social proof at the top:** "234 donors" — not buried at the bottom.
- **Progress is emotional:** The progress bar + "$12,345 raised" makes you feel part of something bigger.
- **The "Donate now" button never leaves the screen** (sticky on desktop sidebar, fixed bottom on mobile).
- **Minimal navigation.** The campaign page IS the experience. No sidebar with 10 links.
- **Story first, details later.** The campaign story is front and center. FAQ/details are below.

**What Selah can steal:**
- One primary CTA per page (campaign page = "Join campaign")
- Sticky CTA that never leaves the screen
- Social proof at the top (donors → submissions, budget progress → funding progress)
- Trust signals immediately visible (verified views, platform guarantee)
- Tabs for content organization (About / Submissions / Requirements)

### 2.2 Kickstarter — Creator Credibility + Reward Tiers

**Campaign page anatomy (desktop):**
```
┌───────────────────────────────────┬─────────────────────┐
│ [Hero video/image]                │ [Back this project] │
│                                   │   GREEN button       │
│ Campaign title                    │                      │
│ Creator name · 3 projects · Bio   │ Reward tiers:       │
│                                   │ ┌─────────────────┐ │
│ $45,678 pledged                  │ │ Pledge $10       │ │
│ ████████████░░ 91%               │ │ Get a thank-you  │ │
│ 1,234 backers · 5 days to go     │ │ 23 backers       │ │
│                                   │ ├─────────────────┤ │
│ [Remind me] [Share] [Save]       │ │ Pledge $25       │ │
│                                   │ │ Get digital album│ │
├───────────────────────────────────┤ │ 89 backers       │ │
│ [TABS: Campaign | FAQ | Updates  │ ├─────────────────┤ │
│        | Comments | Community]    │ │ Pledge $50       │ │
│                                   │ │ Signed vinyl     │ │
│ Story + images + risks            │ │ LIMITED: 8 left  │ │
│                                   │ │ 42 backers       │ │
│ Creator bio + previous projects   │ └─────────────────┘ │
│                                   │                      │
│ [Environmental commitments]        │ Estimated delivery  │
└───────────────────────────────────┴─────────────────────┘
```

**Key patterns:**
- **Two-column layout** — content left, actions right. Perfect for desktop.
- **Reward tiers in card format** — scannable, compare-able, creates FOMO ("LIMITED: 8 left")
- **Creator credibility** — "3 projects created" builds trust through track record
- **Urgency via deadline** — "5 days to go" creates commitment
- **All-or-nothing model** — psychologically different from Selah but the reward tier pattern is adaptable

**What Selah can steal:**
- Two-column layout for campaign pages (content left, CTA + details right)
- "Tiers" pattern → CPM rate tiers ($500, $2K, $5K per 1M views as packages)
- Creator credibility → previous submissions count, approval rate, earnings
- Urgency → "X creators are viewing this campaign right now"

### 2.3 Airbnb — Product + Trust + Simple Booking

**Listing page anatomy:**
```
┌──────────────────────────────────────────────────────────┐
│ [Photo gallery — scrollable, full-width]                 │
│                                                          │
│ Title · Location · Host name · Superhost badge           │
│                                                          │
│ [Room details]          ┌──────────────────────────────┐ │
│ [Amenities]             │ $129 / night                  │ │
│ [Description]           │ ★ 4.92 · 234 reviews          │ │
│ [Where you'll sleep]    │                              │ │
│ [Map]                   │ [Check-in] [Check-out]        │ │
│ [House rules]           │ [Guests selector]             │ │
│ [Cancellation policy]   │                              │ │
│                         │ Price breakdown:              │ │
│ [Host section]          │ $129 x 3 nights = $387        │ │
│  Photo, bio, stats      │ Cleaning fee = $50            │ │
│  Response rate: 98%     │ Service fee = $55             │ │
│  Response time: <1hr    │ ─────────────────────         │ │
│                         │ Total = $492                  │ │
│ [Reviews — sorted,      │                              │ │
│  filterable, detailed]  │ [RESERVE]  ← BIG PINK BUTTON │ │
│                         │                              │ │
│                         │ You won't be charged yet      │ │
│                         └──────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Mobile:** Single column. Booking card becomes a **fixed bottom bar**: price + date + "Reserve" button. Always visible.

**Key patterns:**
- **Trust is everything:** Superhost badge, verified reviews, host response rate, transparent pricing — all before you book.
- **Price breakdown before commitment** — no surprises.
- **The "Reserve" button is always visible** (sticky sidebar desktop, fixed bottom mobile).
- **Reviews are prominent** — sorted, filterable, detailed.
- **Host credibility** — photo, bio, stats, response rate, languages.
- **"You won't be charged yet"** — reduces commitment anxiety.

**What Selah can steal:**
- Sticky CTA with price breakdown (earn $X per 1M views → how much per video)
- Trust signals on campaign page (verified views, platform guarantee, transparent fees)
- "You won't be charged / no upfront cost" messaging
- Creator credibility → submission history, approval rate, earnings shown
- Fixed bottom bar on mobile (price + action)

### 2.4 Uber — The Pinnacle of Simplicity

**Main screen:**
```
┌──────────────────────────────────────┐
│                                      │
│          [Where to?]                 │
│          One input field             │
│                                      │
│                                      │
│     [Recent destinations]            │
│     Home · Work · Gym               │
│                                      │
│     [Map showing nearby cars]        │
│                                      │
└──────────────────────────────────────┘
```

**Key patterns:**
- **ONE action.** Type where you want to go. That's it.
- **Price estimation before commitment** — you see the price before you book.
- **Cognitive load = zero.** No navigation, no filters, no settings. Just "Where to?"
- **Progressive disclosure** — details (car type, ETA, driver) come AFTER the main action.

**What Selah can steal:**
- Artists: "What's your track?" → upload → set budget → launch. One flow, minimal steps.
- Creators: "Find a track" → browse campaigns → submit video. One action per screen.
- Price transparency BEFORE commitment.

### 2.5 Fiverr — Gig Marketplace Patterns

**Key patterns:**
- **Three-tier packages** (Basic / Standard / Premium) with clear price comparison
- **Seller credibility** (Level 2 Seller, 4.9 stars, 1.2K reviews, response time)
- **Reviews are the main social proof**
- **"Order now" flow** — add requirements, choose delivery time, pay
- **FAQ section** at bottom of each gig page
- **"Compare packages" button** highlights the middle tier (anchoring effect)

**What Selah can steal:**
- CPM rate displayed as packages/tiers ($500/1M, $2K/1M, $5K/1M)
- Creator credibility badges based on submissions approved
- FAQ section on campaign pages
- Price comparison table

---

## 3. UNIVERSAL PATTERNS FROM SUCCESSFUL PLATFORMS

### 3.1 The Law of One Action
Every successful platform has **one primary action** per page:
- GoFundMe → Donate
- Kickstarter → Back this project
- Airbnb → Reserve
- Uber → Where to?
- Fiverr → Order now

Selah.fm currently has 3-7 actions per page. This is the #1 thing to fix.

### 3.2 Sticky CTA
Every platform keeps the primary CTA visible at all times:
- Desktop: sticky sidebar card (Airbnb, Kickstarter)
- Mobile: fixed bottom bar (GoFundMe, Airbnb, Kickstarter)

Selah.fm campaign page has a sticky bar on scroll but it competes with the share button and progress ring.

### 3.3 Trust Signals Up Front
Trust is earned before the user takes action:
- GoFundMe: Verified organizer, Giving Guarantee, transparent fees
- Airbnb: Superhost badge, verified reviews, host response rate
- Kickstarter: Creator track record, project updates, transparent risks

Selah.fm needs: platform guarantee, transparent fee breakdown, "verified views" badge.

### 3.4 Social Proof at the Top
- GoFundMe: "234 donors" + progress bar
- Kickstarter: "1,234 backers" + "5 days to go"
- Airbnb: "★ 4.92 · 234 reviews"

Selah.fm should show: "X submissions" + "X creators watching" at the top of campaign pages.

### 3.5 Progressive Disclosure
- Uber: "Where to?" → price estimate → car options → confirm
- Airbnb: Photos → details → reviews → book
- Fiverr: Gig overview → packages → seller info → reviews → FAQ

Selah.fm should reveal information progressively, not all at once.

### 3.6 Empty State as Opportunity
- Airbnb new listings: "Be one of the first to stay here"
- Fiverr new seller: "New seller — be their first client"
- Kickstarter new campaign: "Be the first backer"

Selah.fm: "Be the first creator to submit" instead of hiding the zero count.

---

## 4. SIMPLIFICATION PLAN — What Changes

### 4.1 Homepage → Radical Simplification

**Current:** 9 sections, multiple CTAs, founder story, FAQ, trust pillars.
**Target:** 3 sections max. One primary CTA.

```
NEW HOMEPAGE STRUCTURE:

┌──────────────────────────────────────────────────┐
│                                                  │
│           [Logo]          [Sign in]              │
│                                                  │
│     Your music, real creators, real views.       │
│                                                  │
│   Vetted creators make TikToks, Reels & Shorts   │
│   with your track. You approve every video.      │
│   You only pay for verified views.               │
│                                                  │
│  [Promote your music]    [Browse campaigns]      │
│   (indigo gradient)       (outlined white)       │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  2,500+ active campaigns · 16 artists      │  │
│  │  $35 funded · Creators earning now         │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  Free to start. No credit card. Open source.     │
│                                                  │
└──────────────────────────────────────────────────┘
         ↓ (scroll)
┌──────────────────────────────────────────────────┐
│                                                  │
│     How it works (3 steps, visual)              │
│                                                  │
│  Artists: 1. Create  2. Review  3. Pay          │
│  Creators: 1. Browse  2. Create  3. Earn         │
│                                                  │
│     [Explore campaigns →]                        │
│                                                  │
└──────────────────────────────────────────────────┘
         ↓ (scroll)
┌──────────────────────────────────────────────────┐
│                                                  │
│     Featured campaigns (grid of 6-8 cards)       │
│                                                  │
│     [Campaign card] [Campaign card] [Campaign]   │
│                                                  │
│     [View all 2,500+ campaigns →]                │
│                                                  │
│     Footer: FAQ · Blog · Open source · Legal     │
│                                                  │
└──────────────────────────────────────────────────┘
```

**What gets cut:**
- Problem/Solution comparison (too long, move to /welcome-artists)
- Example scenario cards (move to /welcome-artists or /welcome-creators)
- Founder story (move to /about, already there)
- Trust pillars (integrate into hero as badges)
- FAQ mini (keep /faq, remove from homepage)
- Final CTA section (redundant — hero already has CTAs)

**Result:** 3 sections instead of 9. Clear mental model. Less scrolling. One primary CTA.

### 4.2 Campaign Page → GoFundMe Style

**Current:** Hero with cover art → stats ring → 4+ CTAs → how-to → donations → requirements → related campaigns. Plus sticky bar on scroll.

```
NEW CAMPAIGN PAGE STRUCTURE:

┌──────────────────────────────────────────────────┐
│ [Breadcrumb: Selah / Browse / Track Title]       │
├──────────────────────────────────────────────────┤
│                                                  │
│  [Large cover art — full width on mobile,        │
│   60% width on desktop]                          │
│                                                  │
│  Track Title — Artist Name                       │
│  ★ Verified artist badge · Campaign created X    │
│                                                  │
│  ┌──────────────────────┐                        │
│  │ $15 spent of $35     │                        │
│  │ ████████░░░░ 43%     │                        │
│  │ 2 submissions        │                        │
│  │ $5,000/1M views      │                        │
│  └──────────────────────┘                        │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │                                          │    │
│  │  [JOIN CAMPAIGN]                         │    │
│  │  Earn $5,000 per 1M verified views        │    │
│  │  No upfront cost · You keep 100%          │    │
│  │                                          │    │
│  │  [Share]  [Donate]                       │    │
│  │                                          │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  [TABS: About | Requirements | Submissions]      │
│                                                  │
│  [Tab content — progressive disclosure]          │
│                                                  │
│  Default tab "About": campaign description,      │
│  listen links, artist bio                        │
│                                                  │
│  Requirements tab: what creators need to know    │
│                                                  │
│  Submissions tab: approved videos (social proof) │
│                                                  │
│  [More campaigns — grid at bottom]               │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Key changes:**
- **One primary CTA** — "Join campaign" is the star. Donate, share are secondary.
- **Tabs** for content organization (About/Requirements/Submissions) — less scroll, more scan.
- **Desktop two-column** layout (content left, CTA card right).
- **Sticky CTA** on scroll — the "Join campaign" button stays visible.
- **Mobile fixed bottom bar** — price + action button, always reachable.
- **Remove:** Claim CTA (move to settings or make it a subtle link), Listen on (keep but collapse), Download assets (keep in Requirements tab), Support card (merge into CTA area).

### 4.3 Browse Page → Lightly Touch

The browse page is already functional. Minor improvements:
- **Simplify filters** — remove CPM min/max sliders, replace with preset buttons ($0-500, $500-2K, $2K-5K, $5K+)
- **Reduce TopNav weight** — move "Create campaign" to a floating action button (bottom-right)
- **Better empty state** for filtered results

### 4.4 Navigation → Consolidate

**Current authenticated nav:**
- Browse | Dashboard | Messages | Notifications | Settings

**New authenticated nav:**
- **Campaigns** (browse + search = one page)  
- **Dashboard** (personal home — your campaigns, your submissions, your earnings)
- **Inbox** (messages + notifications merged)
- Avatar dropdown (Settings, Logout)

**Key changes:**
- Merge Browse and Campaigns into one page
- Merge Messages and Notifications into "Inbox" (bell icon shows total unread)
- Dashboard becomes the central hub for both artists and creators
- Footer simplified: Blog · FAQ · Open source · Legal (4 links)

### 4.5 Dashboard → Action-First

**Current:** Shows counts (campaigns, submissions, earnings) but is empty for new users.
**Target:** Guided first action.

```
NEW DASHBOARD (ARTIST):

┌──────────────────────────────────────────────────┐
│                                                  │
│  👋 Welcome, [Name]                             │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │  🎵 Create your first campaign           │    │
│  │  Upload a track, set your budget, and    │    │
│  │  let creators promote your music.        │    │
│  │                                          │    │
│  │  [Upload a track →]                      │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  Your campaigns (0)                              │
│  No campaigns yet — create one above.            │
│                                                  │
│  Your submissions (0)                            │
│  Browse campaigns to find tracks to promote.     │
│  [Browse campaigns →]                            │
│                                                  │
└──────────────────────────────────────────────────┘
```

**After first campaign:**
```
┌──────────────────────────────────────────────────┐
│  Your campaigns (1)                              │
│  ┌──────────────────────────────────────────┐    │
│  │ [Cover] Track Title          $15 spent    │    │
│  │         Artist · $35 budget   ████░░ 43%  │    │
│  │         2 submissions · 0 pending review  │    │
│  │         [View campaign →]                 │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  [+ Create new campaign]                         │
│                                                  │
│  Quick stats: $35 deposited · $15 spent          │
│               2 submissions · $0 paid             │
│                                                  │
│  Referral link: selah.fm/login?ref=you@email.com  │
│  [Copy link]  5% bonus on referrals              │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 4.6 Onboarding → 2 Minutes Max

**Current:** Multi-step form (role, profile, Stripe, preferences).
**Target:** 

- **Step 1:** "What's your name?" + email/Google sign-in (30s)
- **Step 2:** "I want to..." [Promote my music] or [Earn as a creator] (5s)
- **Step 3 (artist):** Upload your first track → set CPM → set budget → launch (90s)
- **Step 3 (creator):** Browse campaigns → pick one → submit first video (60s)

**Key change:** Move Stripe connect and profile details to "later" — only ask when the user needs to receive/send money.

### 4.7 Pages to CUT or Merge

| Page | Action |
|------|--------|
| `/welcome-artists` | Merge into onboarding flow |
| `/welcome-creators` | Merge into onboarding flow |
| `/earnings` | Merge into Dashboard |
| `/review` | Keep — critical artist function |
| `/messages` | Merge into Inbox (with notifications) |
| `/settings` | Keep — simplified |
| `/guides/music-promotion` | Keep — valuable SEO |
| `/guides/creator-earnings` | Keep — valuable SEO |
| `/guides/cpm-rates` | Keep — valuable SEO |
| `/genre/[slug]` | Keep — programmatic SEO |
| `/creators/[id]` | Keep — creator profiles |
| `/login` | Keep — simplified |
| `/onboarding` | Keep — simplified (see above) |

**Result:** ~30 routes → ~18 routes. Less cognitive overhead for users and maintainers.

---

## 5. DESIGN SYSTEM — What Stays, What Goes

### 5.1 Keep (strong foundation)
- **Righteous font** for headings — distinctive, memorable ✅
- **Poppins/system-ui** for body — clean, readable ✅
- **Dark theme** (#0F0F23 / #080817) — premium feel, good for music ✅
- **Indigo (#4338CA) + Green (#22C55E)** color system — good contrast, memorable ✅
- **Glass-morphism cards** (bg-white/[0.03], border-white/[0.06]) — distinctive ✅
- **Framer Motion animations** — smooth, premium feel ✅
- **Shadcn/ui components** — consistent, accessible ✅

### 5.2 Change
- **Reduce section count** on every page (max 3-4 sections)
- **Increase whitespace** — let content breathe
- **Simplify CTAs** — one primary per page, secondary as text links
- **Use tabs** for content organization (campaign pages, dashboard)
- **Fixed bottom bars** on mobile for primary actions
- **Sticky sidebars** on desktop for CTAs

### 5.3 Cut
- **Founder story** from homepage (it's already on /about)
- **Problem/Solution comparison** from homepage (move to a landing page)
- **FAQ mini** from homepage (use /faq only)
- **Duplicate CTAs** — pick one per page
- **Over-engineered animations** — keep them, but don't let them distract

---

## 6. CONVERSION PSYCHOLOGY — Principles to Apply

### 6.1 Hick's Law
> The more choices you give, the longer it takes to decide.

**Apply:** One CTA per page. One action per screen during onboarding. No decision paralysis.

### 6.2 Fitts's Law
> The time to reach a target depends on distance and size.

**Apply:** Primary CTA always in thumb-reachable zone (fixed bottom on mobile). Large, easy-to-tap buttons (min 48px).

### 6.3 Jakob's Law
> Users prefer your site to work the same as all other sites.

**Apply:** Use GoFundMe/Kickstarter patterns because users already understand them. Don't reinvent campaign pages.

### 6.4 Peak-End Rule
> People judge an experience by its peak and its end.

**Apply:** The "peak" should be the campaign creation moment (artist) or submission approval (creator). The "end" should be a satisfying confirmation, not a dead-end page.

### 6.5 Aesthetic-Usability Effect
> Beautiful things are perceived as more usable.

**Apply:** Keep the dark theme, Righteous font, glass-morphism. Polish the details. Premium feel = trust.

### 6.6 Social Proof
> People follow the actions of others.

**Apply:** Show submission counts, donor counts, "X creators are viewing this" at the top. Never hide zero — frame it as "Be the first."

### 6.7 Scarcity & Urgency
> Limited availability increases perceived value.

**Apply:** "Limited budget remaining" on campaign cards. "X days since last submission" for campaigns with activity. "New campaign — early submissions earn more" for fresh campaigns.

---

## 7. IMPLEMENTATION PHASES (When We Execute)

### Phase 1: Kill What Doesn't Work (1-2 days)
1. Remove 4 sections from homepage (Problem/Solution, Example Scenarios, Founder, FAQ mini)
2. Remove duplicate CTAs from campaign pages
3. Simplify footer to 4 links
4. Redirect `/welcome-artists` and `/welcome-creators` to `/onboarding`

### Phase 2: Restructure (2-3 days)
1. Redesign campaign page in GoFundMe style (tabs, single CTA, two-column desktop)
2. Merge Browse + search into one page
3. Merge Messages + Notifications into Inbox
4. Dashboard redesign (action-first for new users)
5. Onboarding simplification (3 steps max)

### Phase 3: Polish (1-2 days)
1. Sticky CTAs on all key pages
2. Fixed bottom bars on mobile
3. Social proof indicators everywhere
4. Trust signals (verified views badge, platform guarantee)
5. Animation polish

### Phase 4: Test & Iterate (ongoing)
1. A/B test CTA copy ("Join campaign" vs "Start earning")
2. Track conversion: homepage → browse → campaign → join click → submission
3. Monitor time-on-page and bounce rate changes

---

## 8. KPIs TO TRACK (After Redesign)

| Metric | Current (baseline) | Target |
|--------|-------------------|--------|
| Homepage bounce rate | Unknown | <50% |
| Homepage → Browse click rate | Unknown | >20% |
| Campaign page → Join click rate | Unknown | >5% |
| Browse → Campaign click rate | Unknown | >30% |
| Onboarding completion rate | Unknown | >80% |
| First action after signup (24h) | Unknown | >50% |
| Time to first submission | Never (0 creators active) | <24h |
| Return rate (7-day) | Unknown | >30% |

---

## 9. SUMMARY — The Vision

Selah.fm simplified feels like this:

**Homepage** — "Your music, real creators, real views." Two buttons. One below the fold. Social proof counters. Featured campaigns you can scroll through. That's it.

**Campaign page** — Beautiful cover art. One green button that never leaves the screen. "Earn $X per 1M views." Tabs you can explore. Social proof at the top. Feels like GoFundMe but for music.

**Dashboard** — Your home. If you're new: here's exactly what to do next. If you're returning: here's what happened since you left.

**Everything else** — Inbox (messages + notifications). Settings. That's all. 18 pages total. No distractions. No dead ends.

---

*This document is research and planning only. No code has been changed. All phases are proposals for discussion.*
