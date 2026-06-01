# Selah.fm — Outreach Strategy

**Last updated:** 2026-06-01  
**Primary channels:** Instagram DM (content-first), Blog SEO (organic)  
**Secondary channel:** Email (opt-in only, post-IG engagement)

---

## Strategy Overview

Selah.fm is a two-sided marketplace: **artists** set budgets and **creators** earn per verified view. Our outreach reflects this — we attract both sides through the same content engine but with different messaging.

```
                    ┌──────────────────────────┐
                    │     BLOG ENGINE           │
                    │  (2 posts/day, SEO)       │
                    │  Answer-first format       │
                    │  QAPage + Article schema   │
                    └──────────┬───────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                                     ▼
    ┌───────────────┐                     ┌───────────────┐
    │   ARTISTS      │                     │   CREATORS     │
    │   (supply)     │                     │   (demand)     │
    └───────┬───────┘                     └───────┬───────┘
            │                                     │
            ▼                                     ▼
    ┌───────────────────┐               ┌───────────────┐
    │ INSTAGRAM CONTENT  │               │ INSTAGRAM DM   │
    │ MoneyPrinterTurbo  │               │ Content-first  │
    │ AI video → @artist │               │ loop           │
    └─────────┬─────────┘               └───────┬───────┘
            │                                     │
            └──────────────────┬──────────────────┘
                               ▼
                    ┌──────────────────────────┐
                    │   SELAH.FM PLATFORM       │
                    │   Campaigns + Submissions  │
                    │   Stripe Payouts           │
                    └──────────────────────────┘
```

---

## Channel 1: Blog SEO (Organic Inbound)

**What it does:** Attracts both artists and creators through search. Every blog post answers a real question people are typing into Google.

**Format:** Answer-first — a direct answer block at the top (QAPage schema), followed by a founder-voice long-form article (Article schema). Less than 0.1% of websites use QAPage schema.

**Cadence:** 2 posts/day auto-generated via Railway cron. Sources questions from:
1. Reddit RSS (old.reddit.com, real questions people are asking)
2. AI-generated question pool (891 questions, 12 categories, priority-weighted)
3. Curated fallback questions

**Content pillars (priority order):**
1. Creator Marketplace — how to hire/find creators for music promo (zero competition)
2. CPM Mechanics — how CPM-based promotion works (we own this niche)  
3. Platform Strategy — TikTok/Reels/Shorts for musicians (low competition)
4. Creator Income — how creators earn from short-form video (high traffic)
5. Music Promotion — independent artist strategies (core product alignment)

---

## Channel 2: Instagram DM — Content-First Outreach Loop

**Why Instagram:** 1,196 artists have campaigns but no email. They have Instagram handles. Instagram is where musicians live — it's their primary platform, not email.

**Why content-first:** Meta's API prohibits cold DM automation. The compliant approach:

```
POST → ENGAGE → DM
```

1. **Post:** Selah.fm posts about an artist's track (AI-generated video + @artist tag)
2. **Engage:** Artist sees it, likes/comments/views the story — now it's warm
3. **DM:** "Hey, we featured your track. Actually, we built a campaign page for it..."

**This is not cold outreach.** Meta explicitly supports business-to-consumer messaging via their API. Content-first makes it compliant.

### Artist Outreach Loop

**Step 1: Content Creation (MoneyPrinterTurbo-powered)**

The Instagram content is AI-generated video. MoneyPrinterTurbo produces short vertical videos featuring an artist's track.

```
DB queue              MPT API                    Instagram
────────              ───────                    ─────────
Artist + track   →   Generate video        →   Post to @selahfm
Cover art (DB)   →   "Check out [track]    →   Tag @artist
Campaign URL     →    by [artist]"         →   Artist sees it
IG handle        →                         →   Engages → DM
```

**What MPT generates:**
- Script: "Independent artist [name] just dropped '[track]'. We built a campaign page for it — creators can make TikToks with this song and earn per view. Artist pays only for verified views. Link in bio."
- Stock footage: Pexels/Pixabay clips matching the music genre
- Voiceover: AI narration, subtitles auto-generated
- Background music: **The artist's actual track** (from campaign URL)
- Output: 9:16 vertical, 15-30 seconds, H.264 MP4

**The flow:**
1. Cron job picks 3-5 artists from queue (has IG handle, campaign, not yet posted)
2. MPT API generates video for each
3. Videos stored in Supabase Storage or DB (`instagram_posts` table)
4. Human review (Robert-Jan) — watch, approve or regenerate
5. Post to @selahfm with @artist tag + campaign link in bio
6. Artist sees their music featured → engages → warm DM conversation

**Step 2: DM (manual by Robert-Jan)**
- Personalized message: references their track specifically
- "No pressure, just claim it when ready"
- Campaign URL with UTM: `?utm_source=instagram&utm_medium=dm`

**Step 3: Conversion Tracking**
- Track: DM sent → campaign visited → campaign claimed → submissions
- UTM params captured by existing page_view analytics

### Creator Outreach Loop

Same pattern, different targeting:

**Step 1: Discovery**
- Find creators on Instagram/TikTok who make music-related content
- Dance, lip-sync, "songs you need to hear," music reviews
- Track in `discovered_creators` table with Instagram handle

**Step 2: DM (manual)**
- "You make great music content. We have 2,500+ artists paying for verified views. Browse campaigns, pick a track, make a video, earn per view."
- Link to CPM Calculator + Browse page

**Step 3: Tool-Based Attraction (organic)**
- Free SEO tools: Playlist Analyzer, CPM Calculator, Creator Earnings
- Creators searching "How much does TikTok pay" find blog → discover Selah.fm

---

## Channel 3: Email (Opt-In Only)

**Role:** Follow-up after Instagram engagement. No cold email.

- Artist replies to DM → ask for email for updates
- Artist claims page → email via signup
- Creator signs up for payouts → email via Stripe onboarding
- Campaign status updates, payout notifications, re-engagement

---

## MoneyPrinterTurbo — AI Video Engine for Instagram Content

**What it is:** Open-source Python tool (15K+ GitHub stars). Turns a topic into a complete short-form video: AI script → stock footage → voiceover → subtitles → background music → final MP4.

**How we use it (INTERNAL ONLY — NOT a creator tool):** MPT is our Instagram content factory. It generates the videos we post to @selahfm featuring artists' tracks. This is the fuel that drives the entire outreach loop.

**Integration plan:**

| Phase | What | Time |
|-------|------|------|
| 1 | Deploy MPT Docker on Railway, expose internal API | Day 1-2 |
| 2 | Build `/api/cron/generate-outreach-videos` cron route | Day 3-4 |
| 3 | Build video review dashboard at `/admin/outreach/videos` | Day 5-6 |
| 4 | Wire into daily ops: generate → review → post → DM | Week 2 |
| 5 | (Future) Open MPT to creators as a tool | Month 3+ |

**Technical architecture:**

```
Railway
├── selah.fm (Next.js)
│   ├── /api/cron/generate-outreach-videos  ← cron trigger
│   ├── /api/mpt/generate                   ← calls MPT
│   └── /admin/outreach/videos              ← review dashboard
│
└── mpt-service (Docker)
    └── MoneyPrinterTurbo Python API (:8080)
        ├── POST /api/v1/videos  ← { script, bgm_url, genre }
        └── returns { video_url, duration, thumbnail }
```

**Why MPT:**
- Already handles everything: script gen, footage sourcing, voiceover, subtitles, composition
- Supports DeepSeek (we have API key) + Pexels (we have API key)
- Docker deploy = one command on Railway
- 15K stars, MIT license, active maintenance

**Fallback:** If MPT is too heavy for Railway, use Shotstack API for rendering ($19/mo for 30 videos, $0.63/video, no GPU).

---

## Daily Operations

| Time | Action | Duration |
|------|--------|----------|
| Morning | Review MPT-generated videos, post 3-5 to @selahfm | 20 min |
| Midday | Check engagement, send DMs to artists who engaged | 20 min |
| Afternoon | Send DMs to new creator discoveries, follow up | 15 min |
| Weekly | Review metrics, adjust templates, top up queue | 30 min |

---

## Key Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Artists ready for IG outreach | 1,196 | 973 with campaigns |
| Daily IG posts | 3-5 | 0 (starting) |
| Daily DMs sent | 20-25 | 0 (starting) |
| DM reply rate | 10-30% | TBD |
| Campaign claim rate | 5-15% of DMs | TBD |
| Creators discovered | 50+ new/week | 7 total |
| Blog posts/day | 2 | 2 (automated) |

---

## Database Tables

### `instagram_outreach_log`
```sql
CREATE TABLE instagram_outreach_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discovered_artist_id UUID REFERENCES discovered_artists(id),
  campaign_id UUID REFERENCES campaigns(id),
  instagram_handle VARCHAR(100),
  message_text TEXT,
  post_url VARCHAR(500),
  dm_sent_at TIMESTAMPTZ,
  response_type VARCHAR(20),    -- replied, ignored, claimed
  response_at TIMESTAMPTZ,
  campaign_visited_at TIMESTAMPTZ,
  campaign_claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `instagram_posts`
```sql
CREATE TABLE instagram_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_name VARCHAR(200),
  track_name VARCHAR(200),
  instagram_handle VARCHAR(100),
  video_url VARCHAR(500),       -- MPT-generated video
  caption TEXT,
  campaign_slug VARCHAR(200),
  posted_at TIMESTAMPTZ,
  post_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Files

| File | Purpose |
|------|---------|
| `OUTREACH.md` | This document — full outreach strategy |
| `STATUS.md` | Project status + reference |
| `app/api/cron/outreach-pipeline/route.ts` | Artist discovery → audit → campaign (automated) |
| `app/api/cron/generate-outreach-videos/route.ts` | MPT video generation cron (to be created) |
| `app/admin/outreach/instagram/page.tsx` | DM queue dashboard (to be created) |
| `app/admin/outreach/videos/page.tsx` | Video review dashboard (to be created) |
| `lib/outreach.ts` | Artist audit + AI message generation |
| `lib/discovery.ts` | Multi-channel artist/creator discovery |
| `lib/blog-engine.ts` | DeepSeek article generation |
