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
    ┌───────────────┐                     ┌───────────────┐
    │ INSTAGRAM DM   │                     │ INSTAGRAM DM   │
    │ Content-first  │                     │ Content-first  │
    │ loop           │                     │ loop           │
    └───────┬───────┘                     └───────┬───────┘
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

**Creator-facing content:** Every post links to relevant tools (CPM Calculator, Creator Earnings, Playlist Analyzer) and campaign pages. Internal linking brings both artists and creators into the funnel.

---

## Channel 2: Instagram DM — Content-First Outreach Loop

**Why Instagram:** 1,196 artists have campaigns but no email. They have Instagram handles. Instagram is where musicians live — it's their primary platform, not email.

**Why content-first:** Meta's API prohibits cold DM automation. The compliant approach:

```
POST → ENGAGE → DM
```

1. **Post:** Selah.fm posts about an artist's track (cover art + caption + @artist tag)
2. **Engage:** Artist sees it, likes/comments/views the story — now it's warm
3. **DM:** "Hey, we posted about your track. Actually, we built a campaign page for it..."

**This is not cold outreach.** It's responding to engagement about content featuring their music. Meta explicitly supports this pattern.

### Artist Outreach Loop

**Step 1: Content Creation (automated)**
- System queues artists from the `instagram_outreach` table
- Generates Instagram posts: track cover art (from DB) + caption with @artist_handle
- Human reviews and posts (or schedules)

**Step 2: Engagement Tracking**
- Check who engaged with the post
- Prioritize artists who liked/commented/viewed

**Step 3: DM (manual by Robert-Jan)**
- Personalized message about their track + campaign page link
- "No pressure, just claim it when ready"
- Signed as Robert-Jan (founder credibility)

**Step 4: Conversion Tracking**
- Track DM sent → campaign visited → campaign claimed → submissions received
- UTM: `?utm_source=instagram&utm_medium=dm&utm_campaign=artist_outreach`

### Creator Outreach Loop

Same pattern, different targeting:

**Step 1: Discovery**
- Find creators on Instagram/TikTok who make music-related content
- Dance, lip-sync, "songs you need to hear," music reviews
- Track in `discovered_creators` table with Instagram handle

**Step 2: Content Creation**
- Post about creator earnings potential on Selah.fm
- Statistics: "Creators earn ~$1,000/1M views. Artists set CPM. You choose the track."
- Link to CPM Calculator + Browse page

**Step 3: DM (manual)**
- "Hey, you make great music content. We have 2,500+ artists paying for verified views. Browse campaigns, pick a track, make a video, earn per view."

**Step 4: Tool-Based Attraction**
- Free tools bring creators organically: Playlist Analyzer, CPM Calculator, Creator Earnings
- Creators searching "How much does TikTok pay per view?" find our blog → discover Selah.fm

---

## Channel 3: Email (Opt-In, Post-Engagement)

**Role:** Email is no longer primary outreach. It's the follow-up channel after Instagram engagement.

**When we collect email:**
- Artist replies to DM → we ask for email for campaign updates
- Artist claims their page → email collected during signup
- Creator signs up for payouts → email collected during Stripe onboarding

**What email does now:**
- Campaign status updates (submissions received, views verified)
- Payout notifications
- Re-engagement for dormant artists/creators
- **No cold outreach.** Email addresses are opt-in only.

---

## MoneyPrinterTurbo — AI Video Generation for Creators

**What it is:** MoneyPrinterTurbo (https://github.com/harry0703/MoneyPrinterTurbo) is an open-source Python tool (15K+ GitHub stars) that turns a topic/keyword into a complete short-form video with AI-generated script, stock footage, voiceover, subtitles, and background music.

**Strategic value for Selah.fm:** The #1 barrier for creators is "I don't know how to make videos" or "It takes too long." MoneyPrinterTurbo removes this barrier. A creator can:
1. Pick a campaign track
2. Enter: "Why [track name] is the song of the summer"
3. Get a complete video with stock footage + artist's song + captions
4. Post it to TikTok/Reels/Shorts
5. Earn per verified view

**Integration plan:**

| Phase | What | When |
|-------|------|------|
| Phase 1 | Research + prototype: deploy MPT Docker on Railway, test API | Week 1-2 |
| Phase 2 | Build `/tools/video-generator` page: creator enters topic, gets video | Week 3-4 |
| Phase 3 | Auto-generate videos for campaigns: "Why [artist]'s [track] deserves more ears" | Month 2 |
| Phase 4 | Blog-to-video pipeline: auto-generate TikTok versions of blog posts | Month 3 |

**Technical approach:**
- Deploy MPT as a separate Docker service on Railway
- Expose via internal Railway network (not public — API only)
- Next.js calls MPT API: POST `/api/tools/generate-video` with track details
- MPT returns video URL (stored in Supabase Storage or our DB)
- Creator downloads and posts

**Alternative (lightweight):** If MPT is too heavy for Railway, build a Node.js equivalent using:
- DeepSeek for script generation (already integrated)
- Pexels API for stock footage (already integrated)
- Remotion (https://remotion.dev) for video composition in Node.js
- Or: use a cloud service (Shotstack, Creatomate) for rendering

---

## Daily Operations

### Morning (30 min)
- Review IG post queue (auto-generated from artist DB)
- Post 3-5 artist features on @selahfm
- Check engagement from yesterday's posts

### Midday (20 min)
- Send DMs to artists who engaged with posts
- 10-15 personalized messages with campaign links
- Record in `instagram_outreach_log`

### Afternoon (15 min)
- Send 5-10 DMs to new creator discoveries
- Review responses, follow up on conversations
- Update tracking

### Weekly Review
- Conversion metrics: posts → DMs → visits → claims
- Adjust messaging based on response rates
- Top up discovery queue (new artists, new creators)

---

## Key Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Artists ready for IG outreach | 1,196 | 973 with campaigns, 223 already emailed |
| Daily IG posts | 3-5 | 0 (starting) |
| Daily DMs sent | 20-25 | 0 (starting) |
| DM reply rate | 10-30% | TBD |
| Campaign claim rate | 5-15% of DMs | TBD |
| Creators discovered | 50+ new/week | 7 total (to be rebuilt) |
| Blog posts/day | 2 | 2 (automated) |
| Blog organic traffic | Growing | TBD (page_view tracking live) |

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
  post_url VARCHAR(500),        -- URL of the IG post that triggered this DM
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
  cover_art_url VARCHAR(500),
  caption TEXT,
  campaign_slug VARCHAR(200),
  posted_at TIMESTAMPTZ,
  post_url VARCHAR(500),
  engagement_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Files

| File | Purpose |
|------|---------|
| `app/api/cron/outreach-pipeline/route.ts` | Artist discovery → audit → campaign (automated) |
| `app/api/cron/instagram-outreach/route.ts` | IG post queue + DM prep (to be created) |
| `app/admin/outreach/instagram/page.tsx` | DM queue dashboard (to be created) |
| `lib/outreach.ts` | Artist audit + email scraping + AI message generation |
| `lib/outreach-instagram.ts` | IG message generation + post caption generation (to be created) |
| `lib/discovery.ts` | Multi-channel artist/creator discovery |
| `lib/blog-engine.ts` | DeepSeek article generation, founder answers |
| `lib/founder-answers.json` | Source of truth for AI-generated content |
