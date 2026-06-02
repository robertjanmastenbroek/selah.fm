# Selah.fm — Complete Platform Vision

**Date:** June 2, 2026
**Revision:** 2 (added social layer — comments, reactions, hype feed)
**Concept:** A global SEO/LLMO database of every artist — where fans donate, creators make content, artists don't need to lift a finger, and everyone hypes each other up.

---

## Core Principle

The platform works **without requiring artists to participate**.

Every discovered artist gets a fully-featured profile page. Fans can donate, comment, and react. Creators can submit videos. The money flows, content gets made, hype accumulates. The artist doesn't need to claim, approve, or even know about it. Claiming is a **value-add** (control, CPM settings, payout withdrawal) — never a requirement.

---

## The Loop

```
SELAH.FM ARTIST DATABASE (2,158 artists, growing daily)
         │
         ├── SEO / LLMO crawlers index every page
         │     → Traffic arrives at artist profiles
         │
         ├── Fan lands on /artist/[slug]
         │     → Donates $5 → promotion pool
         │     → Comments "love this artist!" on page
         │     → ❤️ reacts to submitted videos
         │     → Gets notified when artist responds
         │
         ├── Creator lands on /artist/[slug]
         │     → Picks a track, makes a video, submits
         │     → Earns per verified view from the pool
         │     → Gets hyped by fan reactions & comments
         │     → Messages artist directly
         │
         └── Artist discovers their page
               → Claims it → controls CPM, approves videos
               → Responds to fan comments
               → Messages creators directly
               → Sees "X people donated $Y, Z fans ❤️ this video"
               → Embeds widget → more traffic → loop intensifies
```

---

## Three User Types, One Platform

### 1. Fans (donors + hypemen)
- **Trigger:** Searches "[artist name] support" or lands on page
- **Actions:**
  - Donates $5-100 to promotion pool
  - Comments on artist page ("this is fire 🔥")
  - ❤️ reacts to submitted creator videos
  - Shares artist page on social media
- **Incentive:** Supports artists they love, public recognition
- **Conversion:** Donation prompt + comment box + reaction buttons on every artist page
- **Retention:** Notification when artist responds to their comment, when their donation helped reach a milestone

### 2. Creators (video makers)
- **Trigger:** Searches "earn making music videos" or lands on browse/artist page
- **Actions:**
  - Picks a track from artist's catalog
  - Makes a video, submits the link
  - Earns per verified view from promotion pool
  - Gets ❤️ reactions and comments from fans
  - Messages artist directly for collaboration
  - Rates artist 1-5★ after payout
- **Incentive:** Real money + fan recognition + artist relationships
- **Conversion:** Track picker + submission form on every artist page
- **Retention:** Fan reaction notifications, earnings dashboard, new track alerts

### 3. Artists (optional claim)
- **Trigger:** Searches own name, gets emailed, friend tells them
- **Actions:**
  - Claims page (simple auth + Stripe Connect)
  - Sets per-track CPM rates
  - Approves/rejects submissions
  - Responds to fan comments
  - Messages creators directly
  - Rates creators 1-5★ after payout
  - Withdraws donated funds
  - Embeds widget on own site
- **Incentive:** Free promotion, fan donations, creator content, fan engagement
- **Conversion:** Claim flow (auth + Stripe) → dashboard
- **Retention:** Notification when new donation, new comment, new submission, new reaction

---

## Social Layer Architecture

### Feature 1: Page Comments (New)

**What:** Public comment threads on artist profile pages and campaign pages.
**Who:** Fans comment, artists/fans reply, everyone reads.
**Where:** Bottom of `/artist/[slug]` page and `/c/[slug]` page.

**Table:** `page_comments`
```
id          UUID       PK
page_type   TEXT       'artist' | 'campaign'
page_id     UUID       FK to discovered_artists.id or campaigns.id
user_id     UUID       FK to users (nullable — anonymous allowed)
author_name TEXT       Display name (from user or manual entry)
content     TEXT       Max 500 chars
created_at  TIMESTAMPTZ
```

**API:**
- `GET /api/comments?pageType=artist&pageId=X` — paginated comments
- `POST /api/comments` — create comment (`{ pageType, pageId, content, authorName? }`)
- `DELETE /api/comments/[id]` — own comment or admin

**UI on artist page:**
```
┌─ 💬 Comments ──────────────────────────────────────┐
│                                                     │
│  Alex: this is fire 🔥 🔥 🔥                     │   2h ago
│  └─ Artist replied: thank you so much! 🙏          │   1h ago
│                                                     │
│  Sam: been following since day 1, so proud ❤️     │   1d ago
│                                                     │
│  [Write a comment...]                    [Send]    │
└─────────────────────────────────────────────────────┘
```

**Notifications:** When someone comments on an artist page:
- If artist is claimed → notify the artist
- If commenter replies to another comment → notify the original commenter

**SEO/LLMO benefit:** Comments add fresh, user-generated content to every page. Google and LLMs love fresh content. Every new comment is a reason for crawlers to re-index.

### Feature 2: Video Reactions (New)

**What:** ❤️ reaction buttons on submitted creator videos. Fans can react to show appreciation.
**Who:** Any visitor (fan, creator, artist) can react.
**Where:** On artist profile page (submissions gallery) and campaign page.

**Table:** `submission_reactions`
```
id             UUID       PK
submission_id  UUID       FK to submissions
user_id        UUID       FK to users (nullable — anonymous allowed)
reaction_type  TEXT       'heart' | 'fire' | 'clap' | 'star' (start with just 'heart')
created_at     TIMESTAMPTZ
UNIQUE         (submission_id, user_id, reaction_type)  — one reaction per type per user
```

**API:**
- `POST /api/submissions/[id]/react` — toggle reaction (`{ type: 'heart' }`)
- `GET /api/submissions/[id]/reactions` — get reaction counts

**UI on artist page submissions gallery:**
```
┌────────────────────────────────────────────────────┐
│  [Video Thumbnail]                                 │
│  Creator: @sam_makes_music                         │
│  Track A · 12.4K views · Earned $8.40             │
│  ❤️ 24 fans loved this · 🔥 8 · 👏 3              │
│  [❤️ React]                                         │
└────────────────────────────────────────────────────┘
```

**Notifications:** When a creator's video gets reactions:
- Notify the creator (if signed up)
- "Your video for [Track] got 10 new ❤️ reactions!"

**Social proof:** Reaction count displayed prominently on submission cards. High-reaction videos get featured on the artist's profile.

### Feature 3: Activity/Hype Feed (New)

**What:** A live feed of everything happening around an artist. Donations, new videos, comments, reactions.
**Where:** Sidebar or section on the artist profile page.

**Data source:** Combine events from:
- `campaign_donations` — "Alex donated $25"
- `submissions` — "Sam made a video for Track A"
- `page_comments` — "Jordan commented: 🔥"
- `submission_reactions` — "5 fans loved Sam's video"
- `ratings` — "Mike rated the artist 5★"

**Or simpler:** Create a single `activity_events` table:
```
id             UUID       PK
artist_id      UUID       FK to discovered_artists
event_type     TEXT       'donation' | 'submission' | 'comment' | 'reaction' | 'rating'
actor_name     TEXT       Display name
actor_id       UUID       FK to users (nullable)
message        TEXT       Human-readable: "donated $25"
metadata       JSONB      Extra context
created_at     TIMESTAMPTZ
```

**API:**
- `GET /api/artists/[id]/activity?limit=20` — recent activity

**UI:**
```
┌─ 🔥 Activity ─────────────────────────────────────┐
│                                                     │
│  ❤️  Alex  donated $25  ·  2m ago                  │
│  🎬  Sam made a video for Track A  ·  15m ago       │
│  💬  Jordan commented: "legendary"  ·  1h ago       │
│  ❤️  5 people loved Sam's video  ·  2h ago          │
│  ⭐  Mike rated artist 5★  ·  3h ago                │
│  🎬  Taylor made a video for Track B  ·  5h ago     │
│  ❤️  Rob donated $10  ·  1d ago                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Feature 4: Existing Infrastructure (Already Built, Just Surface)

The following are **already built** and just need to be surfaced on the artist profile pages:

| Feature | Built? | Where It Shows | What to Add |
|---------|--------|---------------|-------------|
| **Direct messaging** | ✅ `ChatWidget`, `MessagesPage`, `MessageButton`, API | TopNav bell + `/messages` | Add "Message" button on artist page next to "Support" CTA |
| **Ratings (artist↔creator)** | ✅ `RatingPrompt`, API, DB | Review page (artist rates creator), Earnings page | Show average rating on creator profiles, artist profiles after claim |
| **Notifications** | ✅ `NotificationBell`, API, DB | TopNav bell | Wire up new events (comments, reactions, activity) to notification system |
| **Live Ticker** | ✅ `LiveTicker`, DB | Checkout page | Reuse on artist profile for "real-time" activity feel |

---

## Complete Page Architecture

### `/artist/[slug]` — Artist Profile (THE page)

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADER                                                          │
│  [Artist Photo]  Artist Name     [Genre] [Genre] [Genre]        │
│                  🎵 1.2M monthly listeners                        │
│                  🌐 Instagram · TikTok · Spotify · Bandcamp     │
│                                                                  │
│  ┌────────────────────────┐  ┌────────────────────────┐         │
│  │ ❤️ Support [Artist]   │  │ 🎬 Make a Video      │         │
│  │ $5 · $10 · $25 · $50  │  │ Pick a track → earn   │         │
│  │ [Donate $10 →]        │  │ [Start Creating →]    │         │
│  └────────────────────────┘  └────────────────────────┘         │
│                                                                  │
│  ── 🔥 Activity ───────────────────────────────────────────── │
│  ❤️ Alex donated $25 · 2m ago                                  │
│  🎬 Sam made a video for Track A · 15m ago                     │
│  💬 Jordan commented: "legendary" · 1h ago                     │
│  5 people loved Sam's video · 2h ago                           │
│                                                                  │
│  ── Tracks ────────────────────────────────────────────────── │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Cover Art    │  │ Cover Art    │  │ Cover Art    │         │
│  │ Track A      │  │ Track B      │  │ Track C      │         │
│  │ $10/1M views │  │ $8/1M views  │  │ $5/1M views  │         │
│  │ [Submit]     │  │ [Submit]     │  │ [Submit]     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ── 🎬 Recent Videos ──────────────────────────────────────── │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Thumbnail   │  │ Thumbnail   │  │ Thumbnail   │            │
│  │ 24K views   │  │ 12K views   │  │ 8K views    │            │
│  │ ❤️ 45 · 🔥12 │  │ ❤️ 28 · 🔥8  │  │ ❤️ 15 · 🔥3  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                  │
│  ── About [Artist] ─────────────────────────────────────────── │
│  Bio paragraph for SEO/LLMO...                                  │
│                                                                  │
│  ── 💬 Comments ───────────────────────────────────────────── │
│  Alex: this is fire 🔥 · 2h ago                                │
│  Sam: been following since day 1 ❤️ · 1d ago                  │
│  [Write a comment...]                                [Send]    │
│                                                                  │
│  ── FAQ ────────────────────────────────────────────────────── │
│  Q: How do I support [Artist]?                                  │
│  A: You can donate through Selah.fm...                          │
│                                                                  │
│  [Claim this page] (small, footer link)                         │
└──────────────────────────────────────────────────────────────────┘
```

### `/browse` — Browse Hub (Modified)
- **Tabs:** [ Artists ] [ Campaigns ]
- Artist tab: grid of artist cards with track count, monthly listeners, genre
- Genre filter, search, sort

### `/browse/genre/[genre]` — Genre Landing Pages (New)
- 15 pages: electronic, hip-hop, pop, rock, indie, r&b, jazz, metal, folk, country, ambient, punk, alternative, experimental, latin
- SEO-optimized with 300+ word genre descriptions
- Grid of artist cards in that genre

### `/c/[slug]` — Campaign/Track Page (Modified)
- Primary: "Submit a video for this track"
- Include: submission gallery with fan reactions, comment thread
- Secondary: "View [Artist]'s full catalog"
- Link to artist profile

### `/checkout` — Donation/Deposit (Modified)
- Support both: `?type=donation&artistId=X` (fan donates) and `?type=deposit&campaignId=X` (artist deposits)
- Show artist photo, recent supporters, activity feed

### `/messages` — Messages Page (Already Built)
- Conversation list + message threads
- Direct message any user
- Polling for new messages
- Notification badges

### `/dashboard` — Artist Hub (Modified)
- **Unclaimed artist view:** "Your page exists! Claim it to manage."
- **Claimed artist view:** Profile, tracks, submissions, donations, comments moderation, embed widget

---

## LLMO Strategy

### Structured Data Per Artist Page
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {"@type": "MusicGroup", "name": "...", "genre": "...", "followerCount": ...},
    {"@type": "MusicRecording", "name": "...", "byArtist": {...}},
    {"@type": "Product", "name": "Support [Artist]", "offers": {"@type": "AggregateOffer"}},
    {"@type": "VideoObject", ...},
    {"@type": "FAQPage", "mainEntity": [
      {"@type": "Question", "name": "How do I support [Artist]?",
       "acceptedAnswer": {"@type": "Answer", "text": "Donate through Selah.fm..."}},
      {"@type": "Question", "name": "How do I make a video for [Artist]?",
       "acceptedAnswer": {"@type": "Answer", "text": "Pick a track, create a video..."}},
    ]},
  ]
}
```

### Semantic HTML Checklist
Every `/artist/[slug]`:
- [ ] `<h1>`: Artist Name
- [ ] `<h2>About [Artist]` — bio
- [ ] `<h2>Tracks by [Artist]` — track list
- [ ] `<h2>How to Support [Artist]` — explainer
- [ ] `<h2>How to Make Videos for [Artist]` — explainer
- [ ] `<h2>Recent Videos` — submission showcase
- [ ] `<h2>Frequently Asked Questions` — 3-5 Q&A
- [ ] JSON-LD schemas
- [ ] Internal links to genre + related artists

Every `/browse/genre/[genre]`:
- [ ] `<h1>`: Genre Name + "Artists"
- [ ] 300+ word description
- [ ] Artist grid with links
- [ ] JSON-LD CollectionPage
- [ ] Internal links to related genres

---

## Data Model

### New Tables Needed

```sql
-- Page comments (artist pages, campaign pages)
CREATE TABLE page_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL CHECK (page_type IN ('artist', 'campaign')),
  page_id UUID NOT NULL,
  parent_id UUID REFERENCES page_comments(id),  -- for replies
  user_id UUID REFERENCES users(id),            -- null for anonymous
  author_name TEXT,                              -- display name
  content TEXT NOT NULL CHECK (length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_page_comments_page ON page_comments(page_type, page_id, created_at DESC);

-- Submission reactions (fan ❤️ on videos)
CREATE TABLE submission_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),            -- null for anonymous
  reaction_type TEXT NOT NULL DEFAULT 'heart',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (submission_id, user_id, reaction_type)
);
CREATE INDEX idx_sub_reactions_sub ON submission_reactions(submission_id);

-- Activity feed (aggregated events per artist)
CREATE TABLE activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES discovered_artists(id),
  event_type TEXT NOT NULL,
  actor_name TEXT,
  actor_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_activity_artist ON activity_events(artist_id, created_at DESC);
```

### Existing Tables (No Changes)

- `messages` — direct messaging (already built)
- `ratings` — artist↔creator ratings after payout (already built)
- `notifications` — notification system (already built)
- `live_ticker_events` — real-time events (already built)

---

## Conversion Funnel Design

### Artist Profile: Primary CTAs

```
┌────────────────────────────────────────────────────────────┐
│  HEADER AREA                                                │
│                                                             │
│  ┌────────────────────────────┐  ┌────────────────────────┐│
│  │ ❤️ Support [Artist]      │  │ 🎬 Make a Video       ││
│  │ (Primary, high contrast)  │  │ (Primary, high contrast)││
│  └────────────────────────────┘  └────────────────────────┘│
│                                                             │
│  ── Activity Feed (social proof) ──                        │
│  "Alex donated $25 · 2m ago"                               │
│  "Sam made a video · 15m ago"                              │
│                                                             │
│  ── Tracks (for creators) ──                               │
│  [Submit] [Submit] [Submit]                                 │
│                                                             │
│  ── Recent Videos (social proof) ──                        │
│  [❤️ 45] [❤️ 28] [❤️ 15]                                   │
│                                                             │
│  ── Comments (engagement) ──                               │
│  "Write a message of support"                               │
│                                                             │
│  ── Footer (secondary) ──                                  │
│  Claim this page (small link)                               │
└────────────────────────────────────────────────────────────┘
```

The page serves all three audiences simultaneously. Each section targets a specific user type with a clear CTA.

---

## Implementation Plan: 5 Sprints, 30 Files

### Sprint 0 (Pre-work): Database
1. Create `page_comments` table
2. Create `submission_reactions` table
3. Create `activity_events` table
4. Run duplicate artist merge + profile backfill

### Sprint 1 (Days 1-2): Foundation Pages
5. Build `GET /api/artists/[slug]` — artist with tracks, comments, activity
6. Build `GET /api/artists` — list with filters
7. Rewrite `/artist/[slug]/page.tsx` — full profile with donate + create CTAs
8. Add JSON-LD schemas + LLMO content generation

### Sprint 2 (Days 3-4): Social Layer
9. Build `POST/GET /api/comments` — page comments API
10. Build `POST /api/submissions/[id]/react` — reaction toggle
11. Build `GET /api/artists/[id]/activity` — activity feed
12. Wire notifications for comments, reactions, activity
13. Build comment component + reaction buttons + activity feed UI

### Sprint 3 (Days 5-6): Distribution + Browse
14. Build embed widget `app/artist/[slug]/embed/route.tsx`
15. Build `ArtistCard` component
16. Modify `BrowseClient.tsx` — add Artists tab
17. Build `/browse/genre/[genre]/page.tsx` — 15 genre pages
18. Split sitemap

### Sprint 4 (Days 7-8): Donation + Creation + Messages
19. Modify checkout for `?type=donation&artistId=X`
20. Add "Message" button on artist page
21. Build submission form with track picker
22. Update dashboard with artist profile section + embed widget
23. Build claim flow

### Sprint 5 (Days 9-10): Pipeline + Polish
24. Update outreach pipeline for multi-track mode
25. Modify review page for artist-filtered view
26. Update campaign page with "View artist profile" link
27. Moderation tools for comments (report, hide)
28. Activity feed cleanup (auto-archive old events)

---

## File Change Summary

**Total: 30 files** (17 modified, 13 new)

### New Files (13)
- `app/api/comments/route.ts` — POST/GET comments
- `app/api/comments/[id]/route.ts` — DELETE comment
- `app/api/submissions/[id]/react/route.ts` — POST reaction toggle
- `app/api/artists/[id]/activity/route.ts` — GET activity feed
- `app/api/artists/[slug]/route.ts` — GET artist with tracks + social
- `app/api/artists/route.ts` — LIST artists
- `app/artist/[slug]/embed/route.tsx` — embed widget
- `app/browse/genre/[genre]/page.tsx` — 15 genre pages
- `components/ArtistCard.tsx` — reusable card
- `components/ArtistEmbed.tsx` — snippet generator
- `components/ActivityFeed.tsx` — activity feed UI
- `components/PageComments.tsx` — comment thread UI
- `components/SubmissionReactions.tsx` — ❤️ reaction buttons
- `lib/artist-content.ts` — LLMO content generation
- `scripts/migrations/001_social_tables.sql` — new table migrations

### Modified Files (17)
- `app/artist/[slug]/page.tsx` — complete rewrite with social
- `app/browse/BrowseClient.tsx` — add Artists tab
- `app/browse/page.tsx` — SEO content
- `app/checkout/page.tsx` — support artistId param
- `app/c/[id]/page.tsx` — add artist link + reactions
- `app/dashboard/page.tsx` — artist profile section
- `app/claim/[code]/page.tsx` — embed + profile setup
- `app/review/page.tsx` — artist-filtered
- `app/sitemap.ts` — split sitemaps
- `app/api/submissions/route.ts` — artistId filter
- `app/api/submissions/create/route.ts` — accept artistId + trackId
- `app/api/cron/outreach-pipeline/route.ts` — multi-track
- `app/api/notifications/route.ts` — wire new event types
- `components/TopNav.tsx` — message/notification icons (already done)
- `lib/internal-links.ts` — linking helper

---

## Why This Wins

1. **No permission needed** — 2,158 artist pages created without anyone signing up
2. **SEO + LLMO compounds** — every artist page is unique content with fresh UGC (comments, reactions, activity)
3. **Self-funding** — fan donations feed creator payouts
4. **Social proof engine** — reactions, comments, and activity feed create the "this place is alive" feeling that converts visitors
5. **Chat brings retention** — direct messaging between fans, creators, and artists creates stickiness
6. **Differentiation** — SubmitHub/Groover = transactions. Selah.fm = community.
7. **All three sides fuel each other** — fans bring money AND hype, hype attracts creators, creators attract artists, artists attract fans
