# Selah.fm — Marketing Strategy

**Goal:** 50 artists/day reached via Instagram/TikTok DM
**Strategy:** Find artists on Bandcamp → audit their social presence → build a $0-budget campaign → send one AI-personalized DM → they claim and share
**Budget:** $0 (Bandcamp API free, YouTube Data API free tier, Reddit JSON API free, manual Instagram DMs, existing infra)
**Updated:** 2026-05-13 — Spotify removed entirely. Bandcamp API provides everything: artist name, track title, cover art, genre, band URL. YouTube Data API for music video enrichment. Reddit for high-signal self-promotion posts. DeepSeek API generates unique outreach messages per artist matching founder voice.

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

**Multi-channel strategy** — find artists where they actually promote themselves, then cross-reference with Spotify for authoritative data.

### Discovery Channels (in order of signal quality)

**Reddit (highest signal)**
Artists self-promote on Reddit constantly. Real humans, real music, real engagement.

Subreddits scanned: r/indiemusic, r/listentothis, r/WeAreTheMusicMakers, r/ThisIsOurMusic, r/music, r/indie_rock, r/electronicmusic, r/hiphopheads

What we extract from each post:
- Artist name + track title (parsed from post title)
- Spotify/YouTube links (from post body or URL)
- Genre hints (from title tags like [indie rock])
- Engagement signal (upvotes, comments)

Filtering: minimum 3 upvotes, must contain a Spotify or YouTube link, skip non-music domains (imgur, reddit self-posts without links).

**Bandcamp (high signal)**
All artists on Bandcamp are independent by definition. No major labels.

Genre pages scraped: electronic, hiphop-rap, rock, pop, folk, metal, punk, experimental, ambient, indie, alternative, r-b-soul, jazz, country (4 random genres per run)

What we extract:
- Artist name + album/track title
- Cover art URL
- Genre tag
- Bandcamp URL for direct link

**YouTube (medium signal)**
Small music channels with real videos and low view counts.

Search terms (3 random per run): "official music video unsigned", "independent artist music video", "debut music video", "underground music video", "indie music video 2026"

Filtering: 100–100K views (small enough to be independent), video duration medium, ordered by date.

**No Spotify needed** — Bandcamp provides complete artist data (name, track, cover art, genre, band URL). YouTube adds music video enrichment. Cross-reference with Spotify was removed — our Railway IP got rate-limited and the data wasn't adding value that Bandcamp + YouTube don't already provide.

### AI Artist Detection (applied at candidate stage)

AI-generated music is flooding every platform. We filter BEFORE Spotify lookup to save API calls.

| Signal | Detection |
|--------|-----------|
| Generic AI name pattern | Regex: "lofi", "chill", "study beats", "synth waves", "ambient", "sleep", "focus" |
| Name too short | < 3 characters |

Skip if 2+ signals. More signals checked at Spotify cross-reference stage (no profile images, no genres).

### What makes a "right" prospect:

| Criteria | Why |
|----------|-----|
| 50–500K Spotify followers | Small enough to need promotion, big enough to have fans who'll share |
| Discovered on Reddit/Bandcamp (real self-promotion) | Active. Has something to promote NOW |
| No major label affiliation | Independent artists are our market — labels won't use Selah.fm |
| Has Spotify presence | We need cover art, track data, and embed URL for the campaign |
| Has at least some engagement | Upvotes on Reddit, views on YouTube, or followers on Spotify |

---

## Phase 2: AUDIT — Gather Everything

For each discovered artist, we pull:

### From Bandcamp API
- **Artist name + track/album title** — campaign content
- **Genre tags** — campaign targeting
- **Cover art (from Bandcamp CDN)** — campaign image
- **Band URL** — link in outreach + social scraping source

### From Bandcamp artist page (scraped for social links)
- **Instagram handle** — `instagram.com/username`
- **TikTok handle** — `tiktok.com/@username`
- **Website URL** — if linked from Bandcamp bio

### From YouTube Data API
- **Official music video** — search `"{artist_name} {track_title} official music video"`
- **Fan uploads / lyric videos** — fallback if no official video

### Audit Output (what goes into the outreach message)

```
ARTIST AUDIT: Luna Waves
━━━━━━━━━━━━━━━━━━━━━━━━
Source: Bandcamp (electronic)
YouTube: Official video · 847 views

Personal angle for outreach:
"The way 'Neon Summer' hits — that's the moment 
I knew Luna Waves deserves way more ears."
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
- **CPM rate:** $0.10 default across all genres. Artists can adjust after claiming. The goal is low barrier — we want creators to see campaigns as easy money, and artists to see promotion as affordable.
- **Max budget:** $100 default (artist adjusts after claiming)
- **Platforms:** TikTok, Instagram Reels, YouTube Shorts (all enabled)
- **Hashtags:** pulled from the audit — whatever genre/vibe tags apply
- **Requirements:** "Make a video featuring this track. Any style. Any length. No minimum followers. Just good content." — welcoming, not gatekeeping

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

**The outreach message — AI-powered, unique per artist:**

Every message is generated by DeepSeek API using the founder's voice profile
(same engine as the blog system). No two messages are the same.

FOUNDER VOICE PROFILE (embedded in generation prompt):
- Warm, direct, rough-around-the-edges
- References real experiences: busking, record deal, losing everything
- Contractions always, variable sentence length
- Anti-spam rules: no generic compliments, no "I came across your profile",
  no template language, max 1 exclamation mark
- Genre-specific opening angles (electronic/rock/indie/metal/pop/folk/hip-hop/experimental)

FALLBACK TEMPLATE (when DeepSeek API unavailable):
```
Hey {name},

{genre-specific opening angle from 8 options}

Look, here's the thing. I run Selah.fm — a platform where people make
TikToks and Reels with your music. You set the terms. You approve every
video. You only pay when views actually happen. No upfront cost. No bots.

I already built a campaign page for "{track}" with your cover art
and everything.

👉 {campaign_url}

Your friends and fans can chip in a few bucks to fund it. Anyone can
submit a video — even someone with 300 followers. You're in control
the whole time.

Claim it when you want. Or don't. No pressure. No rush. The page just
sits there working in the background.

— Robert-Jan
  Founder, Selah.fm
  (former musician who got tired of labels taking 98%)
```

GENRE-SPECIFIC OPENING LINES (used in both AI + fallback):
- electronic: "I've been digging through new electronic music and \"{track}\" stopped me mid-scroll."
- rock: "Heard \"{track}\" and it hit me — this is the kind of rock that deserves way more ears."
- indie: "\"{track}\" has that raw, honest indie energy that's getting harder to find."
- metal: "The production on \"{track}\" is tight. This is the metal I wish I heard more of."
- pop: "\"{track}\" is catchy in the best way — not manufactured, just genuinely good pop."
- folk: "\"{track}\" has that storytelling quality you don't hear much anymore."
- hip-hop: "The flow on \"{track}\" caught me. Real delivery, no gimmicks."
- experimental: "\"{track}\" is doing something different. That's rare these days."

**Why this message works:**

1. **Specific compliment** ("synth drops at 1:23") — proves we actually listened
2. **Data point** ("12,843 streams") — proves we did research
3. **Zero friction** ("I already made a campaign page") — no work required
4. **Social proof** ("even your cousin with 300 followers") — anyone can participate
5. **No pressure** ("Or don't.") — removes the sales feeling
6. **Founder credibility** ("former musician who got tired of labels") — shared experience

**DM workflow (admin dashboard → one click):**

1. Open `/admin/outreach` — see "Ready for Outreach" queue
2. Click any artist row → message copies to clipboard + Instagram DM opens
3. If TikTok handle found → TikTok profile also opens
4. Paste the message, send
5. Click "Mark sent" → artist status updates to `outreach_sent`

**Social link discovery:**
- Bandcamp artist pages scraped for `instagram.com/username` and `tiktok.com/@username`
- Handles stored in `artist_audits` table
- Visible on artist cards as 📸 @handle and 🎵 @handle

**Outreach rules:**
- One message per artist. Ever.
- One follow-up at Day 7 if they viewed the campaign page but didn't claim.
- Never a third message.
- If they say no, mark "declined" and move on.
- Track everything in `outreach_log`.

---

### Campaign Page Optimizations Needed

The current campaign page (`/c/[slug]`) was designed for professional creators.
For the friends/family strategy, it needs these changes:

**Before claiming (unclaimed state):**
- Hero section: "🎁 Someone made this for {artist name}" instead of generic campaign title
- Replace "Create campaign" CTA with "Claim this campaign" for the artist
- "Share" button generates a message tailored to each audience (artist→fans, friend→friends, creator→followers)
- Funding progress bar: "3 people chipped in $35 of $100 goal" — motivates more donations
- Creator slots: "0 people have made videos so far. Be the first!" — FOMO for friends
- Remove any intimidating language about "submission requirements" or "approval process"
- Add: "Got a phone? That's all you need."

**After claiming:**
- First screen: "Now share this with your people" with one-click share buttons
- Artist dashboard light: key stats visible without overwhelming
- "Invite creators" button that generates a DM template for friends

**For all visitors (regardless of claim status):**
- Donation section always visible and prominent
- Pre-set donation amounts: $5, $10, $25, Custom
- Social proof: "{count} people have supported this campaign"
- "Submit a video" flow must be extremely simple — paste a TikTok/Reels link, done
- Remove "minimum video length" and "FTC disclosure" requirements — too corporate for friends/family

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

## Implementation Status

| Phase | What | Status |
|-------|------|--------|
| 1. DB + API | Migration (4 tables), API endpoints (8 actions), `unclaimed` campaign status, claim page | ✅ Done |
| 2. Discovery | Multi-channel (Bandcamp API + Reddit + YouTube), dedup, 369 artists stored | ✅ Done |
| 3. Audit | YouTube video search + Bandcamp social scraping (IG/TikTok handles) | ✅ Done |
| 4. Campaign Builder | Auto-create campaigns ($0 budget, artist-name-track-name slug, Bandcamp cover art) | ✅ Done |
| 5. Outreach | AI-powered messages (DeepSeek, founder voice), one-click IG/TikTok DM queue | ✅ Done |
| 6. Cron | Railway cron (2× daily pipeline + follow-up), X-Cron-Secret header auth | ✅ Done |
| 7. Design | UI/UX Pro Max dark design system applied across 34 files | ✅ Done |
| 8. Security | CRON_SECRET rotated, git history cleaned, pre-commit hook installed | ✅ Done |
| 9. Browse | Pin system, utilization-based sorting, "more campaigns" priority | ✅ Done |
| 10. Stats | Homepage trust bar: campaigns · artists · funded · paid | ✅ Done |

### Pipeline Status (Production)
- 369 artists discovered (Bandcamp, 10 genres)
- 15 audited (YouTube video search + social links)
- 10 campaigns created ($0 budget, unclaimed)
- 354 remaining ready for audit
- Railway cron: 02:00 + 14:00 UTC daily

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

$0. Spotify API is free for direct artist lookups. YouTube Data API is free (10K units/day). Reddit JSON API is free (no auth needed). Bandcamp is scraped (no API). Instagram outreach is manual (free). DeepSeek is already paid for. Railway handles everything. The only cost is time.

---

## Immediate Next Steps

1. **Run migration** on Railway to create pipeline tables
2. **Set env vars** — `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `YOUTUBE_API_KEY`, `CRON_SECRET`
3. **Trigger first discovery** from `/admin/outreach` dashboard
4. **Verify pipeline**: check that artists flow through discover → audit → campaign → outreach
5. **Schedule cron**: Railway cron for `/api/cron/outreach-pipeline` (daily) and `/api/cron/outreach-followup` (daily)
