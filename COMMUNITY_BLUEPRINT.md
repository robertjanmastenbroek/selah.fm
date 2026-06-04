# Selah.fm — Community & Social Feature Blueprint

**Date:** June 4, 2026  
**Research Sources:** UX_COMPETITOR_RESEARCH.md (25 platforms), Letterboxd deep-dive, Bandcamp Clubs analysis, Spotify Blend/Jam research, Discord community tactics

---

## Research Synthesis

### World-Class Community Platforms Studied

| Platform | Key Pattern | Why It Works |
|----------|-------------|-------------|
| **Letterboxd** | Diary as social object, poster-driven UI, half-star micro-interactions, green/orange palette, no algorithmic feed | Treats content (film) with reverence. Social features serve the content, not engagement metrics. Community without toxicity through structural design (no downvotes, no follower counts). |
| **RateYourMusic** | 0.5-5 star rating, cataloging + social, community charts, genre tagging, lists | Turns personal cataloging into communal discovery. Social recommendation engine based on actual listening/rating patterns. |
| **Bandcamp** | Artist-to-fan direct, music feed, fan collections, artist recommendations, **Bandcamp Clubs** (curator-led monthly picks, listening parties, exclusive content) | 30% of monthly sales driven by community features. "Subscribe-to-own" model. Human curation (no algorithms). |
| **Spotify** | Blend (collaborative daily playlists), Jam (real-time shared listening), Listening Activity (real-time friend sharing) | Social features as retention mechanism. 15-25% higher save rates for artists whose fans use Blend. Passive organic discovery through trusted social connections. |
| **Discord** | Server channels, roles, events, AMAs, polls, listening parties, giveaways | Belongs to creators, not the platform. Highest engagement of any social platform. Real-time voice + text creates genuine community. |
| **Genius** | Line-by-line annotations, community edits, IQ points (gamification) | Turns passive consumption into active participation. Annotation as a social object. |
| **Reddit (music)** | Upvote/downvote, subreddit communities, AMAs, album release threads | Best-in-class for topical discussion. Upvote system surfaces quality. Subreddits create belonging. |

### Universal Community Patterns

**Pattern 1: Social Objects Anchor Everything**
Every successful community platform has a core "social object" — the thing people gather around:
- Letterboxd: The diary entry (date watched + rating + review)
- Bandcamp: The album/track page + fan collection
- Spotify: The Blend playlist + Jam session
- Genius: The lyric annotation
- → **Selah's social object**: The track page + submission video + campaign

**Pattern 2: Low-Friction Participation**
- Letterboxd: Log a film in 3 taps (search → rate → done)
- Spotify Blend: Share a link → auto-generated
- Bandcamp: Buy → downloads instantly
- → **Selah gap**: Submitting a video requires more taps than it should. "Quick react" missing.

**Pattern 3: Identity Through Taste**
- Letterboxd: Your profile IS your taste (poster grid of everything you've watched)
- RYM: Your catalog IS your identity (rated albums, custom charts)
- Bandcamp: Your collection IS your identity (albums you own, wantlist)
- → **Selah gap**: Creator/artist profiles don't show their "taste" — no favorite tracks, no activity history as identity.

**Pattern 4: Community Without Toxicity Through Design**
- No downvotes (Letterboxd, Spotify)
- No visible follower counts by default (Letterboxd)
- Chronological feed, not algorithmic (Letterboxd)
- Every interaction anchored to a specific object (all platforms)
- → **Selah gap**: No downvote mechanism (good), but also no upvote/voting mechanism (bad). No "recommended by community" signal.

**Pattern 5: Gamification for Retention**
- Letterboxd: Year in Review, stats, diary streaks
- RYM: Custom charts, user rankings
- Genius: IQ points, contributor levels
- Duolingo: Streaks, XP, leagues (from UX_COMPETITOR_RESEARCH.md §18)
- → **Selah gap**: No gamification at all. No streaks, no achievements, no community rank.

---

## Current State Audit

### What We Already Have (Good Foundation)

| Feature | File(s) | Works? | Notes |
|---------|---------|--------|-------|
| Threaded comments | `PageComments.tsx` | ✅ | Per-artist page, sortable, threaded |
| 5-star reviews | `ReviewSection.tsx` | ✅ | On artist pages |
| ❤️ reactions | `SubmissionReactions.tsx` | ✅ | On submission videos |
| Activity feed | `ActivityFeed.tsx` | ✅ | Per-artist, cursor-paginated |
| Live ticker | `LiveTicker.tsx` | ✅ | Real-time donation/submission events |
| Chat/DM | `ChatWidget.tsx` | ✅ | Full messaging with SSE |
| Notifications | `NotificationBell.tsx` | ✅ | 60s polling, type icons |
| Follow system | `artists/[slug]/follow/route.ts` | ✅ | Server + localStorage fallback |
| Ratings | `RatingPrompt.tsx` | ✅ | Post-payout, artist↔creator |

### What We're Missing (Community Expansion)

| Feature | Reference Platform | Impact | Priority |
|---------|-------------------|--------|----------|
| **Music discovery feed** (personalized, genre-based home page) | Bandcamp, Spotify | New users discover artists without searching | 🔴 High |
| **"Track diary"** — log that you listened/reviewed a track (Letterboxd-style) | Letterboxd, RYM | Turns passive listeners into active community | 🔴 High |
| **Fan collections/wantlists** (save tracks, build collections) | Bandcamp, RYM | Ownership feeling, return visits | 🔴 High |
| **Listening parties** (real-time shared listening on campaign pages) | Spotify Jam, Bandcamp Clubs | Event-based community gathering | 🟡 Medium |
| **Upvoting on submissions** (community-voted best content) | Product Hunt, Reddit | Surfaces quality content algorithm-free | 🟡 Medium |
| **Creator/artist activity streak** ("X days active") | Duolingo | Retention driver for power users | 🟡 Medium |
| **"Year in Review" stats** (Letterboxd/Spotify Wrapped style) | Letterboxd, Spotify | Shareable social proof, viral potential | 🟡 Medium |
| **Community charts** (top-rated tracks this week/month) | RYM, Product Hunt | Discovery through community consensus | 🟡 Medium |
| **Real-time presence** (who's viewing this campaign/page) | Figma, Google Docs | Social proof, FOMO | 🟡 Medium |
| **Campaign comments** (not just artist page comments) | Kickstarter, GoFundMe | Conversation around specific campaigns | 🟡 Medium |
| **Genre-based communities** (subreddit-style genre rooms) | Reddit, Discord | Belonging, repeated visits | 🟢 Low |
| **AMA / Q&A with artists** | Reddit, Discord | High-value events, content generation | 🟢 Low |

---

## Community Vision: Selah as a Music Hub

### The Four User Types

```
┌──────────────────────────────────────────────────────────┐
│                    SELAH.FM COMMUNITY                     │
│                                                          │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ ARTISTS  │  │ CREATORS │  │   FANS   │  │ CURATORS │ │
│  │          │  │          │  │          │  │          │ │
│  │ Promote  │  │  Earn $  │  │ Discover │  │  Review  │ │
│  │  music   │  │ Create   │  │ Support  │  │  Rate    │ │
│  │  Set CPM │  │ content  │  │  Donate  │  │  Lists   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       │              │             │              │       │
│       └──────────────┼─────────────┼──────────────┘       │
│                      │             │                      │
│              ┌───────▼─────────────▼───────┐              │
│              │  SHARED SOCIAL OBJECTS       │              │
│              │  • Tracks                   │              │
│              │  • Submissions (videos)      │              │
│              │  • Reviews & Ratings        │              │
│              │  • Comments & Discussion    │              │
│              │  • Collections & Wantlists  │              │
│              │  • Activity Feed            │              │
│              └─────────────────────────────┘              │
└──────────────────────────────────────────────────────────┘
```

### Key Insight: Fans + Curators Are the Missing Piece

Currently Selah.fm is optimized for Artists + Creators (the transaction side). To become a music hub, it needs:

1. **A reason for fans to visit daily** → music discovery feed, track diary, collections
2. **A reason for fans to stay** → community discussion, reviews, activity streaks
3. **A reason for fans to invite friends** → social features (Blend-like), shareable stats

### Recommended Phasing

**Phase A (Foundation):** Track diary + Fan collections + Discovery feed
- Turns passive browsing into active participation
- Gives users a reason to create profiles even if they don't create content
- Foundation for all social features

**Phase B (Community):** Campaign comments + Upvoting + Activity streaks
- Makes the platform feel alive
- Drives daily return visits
- Surfaces quality content

**Phase C (Events):** Listening parties + AMAs + Community charts
- High-value events for marketing
- Content generation for blog pipeline
- PR opportunities

---

## Research Gaps Still Open

| Topic | Notes |
|-------|-------|
| Stripe Connect onboarding optimization | Not part of community research |
| Apple Pay / Google Pay patterns | Not part of community research |
| Dynamic color extraction | Not part of community research |

---

*This document researched June 4, 2026. Sources: Letterboxd design analysis (blakecrosley.com), Spotify Blend/Jam (chartlex.com), Bandcamp Clubs (recordoftheday.com), UX_COMPETITOR_RESEARCH.md, RYM Wikipedia entry.*
