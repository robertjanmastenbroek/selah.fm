# Selah.fm — Marketing Strategy

**Goal:** 100 artists/day claiming their auto-generated campaign
**Strategy:** Find artists → audit their presence → build a rich campaign → send one detailed outreach message → they claim and share
**Budget:** $0 (Spotify API free tier, manual Instagram DMs, existing infra)
**Updated:** 2026-05-12

---

## The Core Loop

```
FIND → AUDIT → BUILD → OUTREACH → CLAIM → SHARE
  ↑                                              │
  └────────────── viral loop ────────────────────┘
```

An artist claims their campaign. They share it with friends, family, fans. Those people become creators (making TikToks with the track) or funders (chipping in a few dollars). Their activity attracts more artists. Repeat.

---

## Phase 1: FIND — The Right Prospects

**Where we look, in order of priority:**

### Spotify Search API (primary source)

Specific queries that return unsigned, active independent artists:

```
Genre searches (repeat for each genre):
  genre:"electronic" year:2025-2026
  genre:"indie pop" year:2025-2026
  genre:"hip-hop" year:2025-2026
  genre:"alternative" year:2025-2026
  genre:"christian" year:2025-2026

Label exclusion (major label keyword filter):
  - NOT: "Universal", "Sony", "Warner", "Atlantic", "Columbia", 
    "Interscope", "Capitol", "Def Jam", "Republic", "RCA"

Follower range: artists with 100–50,000 monthly listeners
```

### Spotify Playlists (secondary source)

Curated playlists featuring unsigned/independent artists:
- "Fresh Finds" (Spotify's official indie discovery)
- "Independent Rising" 
- "Fresh Finds: [Genre]" (genre-specific variants)
- "Lorem" (indie/alternative)
- "Pollen" (emerging artists)
- Genre-specific: "Electronic Rising", "Indie Pop Road Trip", etc.

Scrape playlist tracks → extract artists → filter by follower count and label status.

### Bandcamp New & Notable

Scrape genre pages for recent releases. Bandcamp artists are almost always independent. Filter by: has at least 1 review, released within 6 months.

### TikTok Trending Original Sounds

Search for sounds categorized as "Original" with <10K video uses. These are artists uploading their own music. Cross-reference with Spotify to verify.

### What makes a "right" prospect:

| Criteria | Why |
|----------|-----|
| 100–50K monthly Spotify listeners | Small enough to need promotion, big enough to have fans who'll share |
| Released music in last 6 months | Active. Has something to promote NOW |
| No major label affiliation | Independent artists are our market — labels won't use Selah.fm |
| Has Instagram or TikTok presence | We need a channel to reach them |
| Has at least 1 music video or visual content | Campaign needs rich media |
| Engaged fanbase (comments on posts, shares) | These people become creators and funders |

---

## Phase 2: AUDIT — Gather Everything

For each discovered artist, we pull:

### From Spotify API
- **Monthly listeners** — key metric for the outreach message
- **Total streams on latest track** — shows we did our homework
- **High-res cover art (640×640)** — campaign image
- **Artist bio** — campaign description
- **Genre tags** — determines CPM rate
- **Related artists** — CPM rate benchmarking
- **Spotify URI/URL** — embed in campaign

### From YouTube Data API
- **Official music video** — search `"{artist_name} {track_title} official music video"`
- **Fan uploads / lyric videos** — fallback if no official video

### From Instagram (public profile)
- **Recent posts** — screenshots or embedded posts for campaign gallery
- **Follower count** — social proof in outreach
- **Engagement rate** — shows active fanbase
- **Last post date** — shows they're active

### From TikTok (public profile)
- **Best performing video** — embed or screenshot
- **Follower count**
- **Video count and average views**

### From artist's website (if exists)
- **Email address** — alternative outreach channel
- **Press photos** — higher quality than Spotify cover art

### Audit Output (what goes into the outreach message)

```
ARTIST AUDIT: Luna Waves
━━━━━━━━━━━━━━━━━━━━━━━━
Monthly Spotify listeners: 3,247
Streams on "Neon Summer": 12,843
Instagram: @lunawavesmusic · 2,401 followers · Last post: 3 days ago
TikTok: @lunawavesmusic · 5,100 followers · 3 videos this month
YouTube: Official video · 847 views

Personal angle for outreach:
"The way the synth line drops at 1:23 in Neon Summer — 
that's the moment that made me stop scrolling."
```

---

## Phase 3: BUILD — The Campaign

Every auto-generated campaign includes:

### Rich media
- **Cover art** — downloaded from Spotify CDN, cached locally
- **YouTube video embed** — if music video exists
- **Gallery images** — screenshots from Instagram/TikTok (artist's own content)
- **Spotify embed** — play the track directly on the campaign page

### Campaign settings
- **CPM rate:** $0.10–0.20 based on genre (electronic: $0.10, pop: $0.15, hip-hop: $0.20)
- **Max budget:** $100 default (artist adjusts after claiming)
- **Platforms:** TikTok, Instagram Reels, YouTube Shorts (all enabled)
- **Hashtags:** genre + mood tags from the audit
- **Requirements:** friendly, encouraging template

### Designed for sharing

The campaign page is built to be shared. Every element is optimized for the artist to send to their friends, family, and fans:

- **Headline:** `Someone made this for Luna Waves` (before claiming)
- **Subtitle:** `A promotion campaign for "Neon Summer" — share this with your people`
- **"Share this page" button** — prominent, generates a pre-written message:
  ```
  Someone built a promotion campaign for my track "Neon Summer" 🎵
  If you make TikToks or Reels, you can earn money featuring my song.
  Even $5 helps fund the campaign. Check it out:
  selah.fm/c/luna-waves-neon-summer
  ```
- **"Chip in" button** — friends/family can donate any amount. "$5 helps a creator make a video with this track"
- **"Create a video" callout**: "Got a phone? You can submit a TikTok with this track and earn per view. No follower minimum. Just good content."

### Unclaimed vs Claimed

**Before claiming (unclaimed):**
- "Unclaimed Campaign" badge
- Disclaimer: "Created by Selah.fm community. Luna Waves hasn't claimed this page yet."
- The share message says "Someone made this for Luna Waves"
- Donations and creator submissions still work

**After claiming:**
- Badge disappears
- Artist gets full dashboard access
- Can adjust CPM, max budget, requirements
- Can review and approve creator submissions
- Can withdraw funds
- The share message changes to "I'm promoting my track on Selah.fm"

---

## Phase 4: OUTREACH — The One Message

**Primary channel: Instagram DM**

Why Instagram:
- Musicians live on Instagram. It's where they post about new releases, tours, studio sessions.
- DMs have high visibility (notification on their phone).
- Direct, personal, not filtered to spam.
- We can reference their recent posts ("Loved your studio video from 3 days ago").

**The outreach message template:**

```
Hey Luna,

I've been listening to "Neon Summer" — the way the synth drops 
at 1:23 stopped me mid-scroll. 12,843 streams on Spotify and 
I think it deserves 10x that.

I run Selah.fm — a platform where people make TikToks and Reels 
with your music. You only pay when their videos get verified views. 
No upfront cost.

Here's the thing: I already made a campaign page for "Neon Summer" 
with your cover art, the music video, and everything:

👉 selah.fm/c/luna-waves-neon-summer

It's ready to share with your people. Friends and family can chip 
in a few dollars to fund it. Anyone can submit a TikTok — even your 
cousin with 300 followers. You only pay if their video actually 
gets views.

Claim it whenever you want (takes 30 seconds). Or don't. The page 
just sits there until you're ready.

— Robert-Jan
  Founder, Selah.fm
  (former musician who got tired of labels taking 98%)
```

**Why this message works:**

1. **Specific compliment** ("synth drops at 1:23") — proves we actually listened
2. **Data point** ("12,843 streams") — proves we did research
3. **Zero friction** ("I already made a campaign page") — no work required
4. **Social proof** ("even your cousin with 300 followers") — anyone can participate
5. **No pressure** ("Or don't.") — removes the sales feeling
6. **Founder credibility** ("former musician who got tired of labels") — shared experience

**Alternative channels (fallback):**
- **Email** — if found on artist website or press kit
- **TikTok DM** — if they're more active there
- **Twitter/X DM** — for music-tech adjacent artists
- **SoundCloud message** — for electronic/beat-focused artists

**Outreach rules:**
- One message per artist. Ever.
- One follow-up at Day 7 if they viewed the campaign page but didn't claim.
- Never a third message.
- If they say no, mark "declined" and move on.
- Track everything in `outreach_log`.

---

## Phase 5: CLAIM — Zero Friction

Artist clicks the campaign link → sees their music beautifully presented → clicks "Claim this campaign" → verifies identity → done.

**Verification options (ordered by preference):**

1. **Spotify OAuth** — artist logs into Spotify, we verify they have access to that artist profile. Instant. Secure.
2. **Instagram DM verification** — we DM them a code, they reply with it.
3. **Email verification** — email matches their official domain.
4. **Manual admin approval** — for edge cases.

**Post-claim experience:**
- Campaign is now officially theirs
- "Share with your people" is the first thing they see
- One-click share buttons (Instagram Story, TikTok, Twitter, copy link)
- "Your campaign page is live. Here's how to share it →"

---

## Phase 6: SHARE — The Viral Loop

**The campaign page is designed to be shared by three audiences:**

### 1. The artist shares with their fans
"Someone built a promotion page for my track! If you make TikToks, you can earn money featuring my song. Check it out →"

### 2. Friends & family share to support
"I just chipped in $5 to help promote my friend's music. Anyone else want to throw in? →"

### 3. Creators share their submissions
"I just earned $12 making a TikTok with this track. Check out the campaign →"

**This creates the loop:**
```
Artist shares → fans see it → some fans become creators → 
creators earn money → creators share their earnings → 
more artists see it → more artists want campaigns → 
we reach out to those artists → loop continues
```

**The funding loop:**
```
Artist shares → friends/family chip in $5-20 → 
campaign has budget → creators see funded campaign → 
creators submit videos → views happen → artist is happy → 
artist shares results → loop continues
```

---

## Why Friends & Family Are the First Creators

The genius of this model: the artist doesn't need to find professional creators. Their friends, family, and fans ARE the first creators.

- **Low barrier:** "Got a phone? You can make a TikTok with my song."
- **Emotional investment:** Friends want to help. Family wants to support. Fans want to engage.
- **Zero cost to them:** The campaign budget pays creators per view. They're not spending their own money.
- **Authentic content:** A friend's genuine TikTok performs better than a paid influencer's ad.

This solves the marketplace cold-start problem. We don't need 1,000 professional creators on day one. We need each artist's circle of 10-20 people to make one video each.

---

## The Campaign Page UX (What The Artist Shares)

The page an artist shares should feel like receiving a gift:

```
┌─────────────────────────────────────────────────┐
│  🎁  Someone made this for Luna Waves           │
│                                                 │
│         [Album Cover — Large]                   │
│                                                 │
│     ▸ "Neon Summer" — Listen on Spotify         │
│                                                 │
│  This is a promotion campaign. Creators make    │
│  TikToks and Reels with this track. You only    │
│  pay when their videos get verified views.      │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  📊  Campaign Stats                      │    │
│  │  3 creators submitted videos             │    │
│  │  1,247 verified views                    │    │
│  │  $12.47 earned by creators               │    │
│  │  $87.53 remaining budget                 │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  💰  Support this artist                  │    │
│  │  Chip in any amount to fund promotion    │    │
│  │  [$5]  [$10]  [$25]  [Custom]            │    │
│  │  3 people have chipped in $35            │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  📱  Want to create a video?              │    │
│  │  Use this track in a TikTok or Reel      │    │
│  │  and earn per verified view.             │    │
│  │  No minimum followers required.          │    │
│  │  [Submit a video →]                      │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  Is this your track? [Claim it →]        │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  [📤 Share this page]    [❤️ Chip in $5]        │
└─────────────────────────────────────────────────┘
```

---

## Database (New Tables Needed)

```sql
discovered_artists   — Spotify ID, name, genres, followers,
                       social links, latest track, discovery source,
                       pipeline status column

artist_audits        — Monthly listeners, stream counts, social stats,
                       YouTube video URL, cover art URL, personal_angle,
                       recommended CPM/budget, hashtags

outreach_log         — Channel, message type, status timestamps
                       (delivered, read, replied, opted_out)

campaign_claims      — Claim code, campaign_id, verification method,
                       claimed_by_user_id, claimed_at
```

---

## Implementation Plan (~12 hours)

| Phase | What | Time |
|-------|------|------|
| 1. DB + API | Migration, API endpoints, `unclaimed` campaign status, claim page | 3–4h |
| 2. Discovery + Audit | Spotify API, YouTube API, Instagram scraping, dedup, store results | 2–3h |
| 3. Campaign Builder | Auto-create campaigns with rich media, cover art cache, share-optimized UX | 2–3h |
| 4. Outreach + Claim | Template rendering, IG DM, outreach logging, Spotify OAuth claim flow, `/admin/outreach` dashboard | 3–4h |

---

## Scaling Plan

| Phase | Discovery | Outreach | Claims/Day |
|-------|-----------|----------|------------|
| Month 1 (manual) | 50/day | 10–20 DMs/day | 2–5 |
| Month 2 (semi-auto) | 100/day auto | 50/day semi-auto | 5–15 |
| Month 3 (full auto) | 200+/day | Auto + follow-ups | 20–50 |
| Month 6 | 500+/day | Full pipeline | 100 |

---

## Key Metrics

| Metric | Month 1 | Month 3 | Month 6 |
|--------|---------|---------|---------|
| Artists discovered/day | 50 | 200 | 500 |
| Campaigns created | 100 | 500 | 3,000+ |
| Outreach sent | 50 | 300 | 1,000+ |
| Campaigns claimed | 10 | 100 | 500+/month |
| Claim conversion rate | 20% | 30% | 50%+ |
| Avg. friends/family funders per campaign | 2 | 5 | 10 |
| Avg. creator submissions per campaign | 1 | 5 | 15 |

---

## Budget

$0. Spotify API is free. YouTube API is free. Instagram is manual (free). DeepSeek is already paid for. Railway handles everything. The only cost is time.

---

## Immediate Next Step

Build Phase 1: database migration + API endpoints for the pipeline. Everything else flows from there.
