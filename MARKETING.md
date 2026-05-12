# Selah.fm — Marketing Strategy

**Goal:** 100 new users/day (50 artists + 50 creators)
**Starting point:** 2 users, 1 campaign, $0 revenue
**Budget:** $0 initially, bootstrap with organic + content + community
**Updated:** 2026-05-12

---

## Executive Summary

Selah.fm is a two-sided marketplace connecting independent musicians (who want promotion) with content creators (who want to earn). The cold-start challenge: artists won't post campaigns without creators, and creators won't join without campaigns to browse.

**Primary strategy:** Outbound artist marketing automation — find artists, audit their music, auto-create ready-to-use campaigns, and send personalized outreach. Artists do zero work to get started — they just click a link.

**Supporting channels:** SEO content, Reddit community, TikTok growth, Discord presence, YouTube tutorials, Product Hunt launch, referral program, strategic partnerships.

---

## ⭐ PRIMARY STRATEGY: Outbound Artist Marketing Automation

### The Core Idea

Instead of waiting for artists to discover Selah.fm, we proactively:

1. **Find** suitable independent artists across platforms
2. **Audit** their latest releases (music, cover art, videos, social presence)
3. **Create** a fully set-up Selah.fm campaign with their music, images, and video
4. **Send** a personalized outreach message with a link to their ready-to-use campaign
5. **Transfer** ownership when the artist claims their campaign

The artist does nothing but click a link and share their campaign page. Zero friction to activation. This is concierge onboarding at scale — powered by automated agents.

### Why This Works

- **Zero activation energy**: The campaign already exists. No "create account, set up campaign, upload art, write description" flow. The artist sees their music already promoted and thinks "I want this."
- **Psychological ownership**: Seeing their own music on a promotion platform creates instant FOMO. They want to claim it before someone else does.
- **Social proof at scale**: Even unclaimed campaigns show creator activity and views. A platform with 500 campaigns (even unclaimed) looks alive. A platform with 1 campaign looks dead.
- **Network effects bootstrapping**: Each claimed campaign brings an artist. Artists attract creators. Creators attract more artists. Flywheel starts.
- **Precedents**: Genius.com created lyric pages without artist permission → artists claimed them. Wikipedia created articles → subjects verified them. IMDb created actor pages → actors claimed them. This model is legally tested and socially accepted.

### Legal & Ethical Framework

**What we do:**
- Use publicly available assets (Spotify embeds, public cover art, social media content)
- Display a clear **"Unclaimed Campaign"** badge on every auto-generated campaign
- Include a disclaimer: "This campaign was created by the Selah.fm community to help promote this artist's music. The artist has not yet claimed this page."
- Allow the artist to claim ownership at any time with zero friction
- Remove any campaign immediately if the artist requests it

**What we DON'T do:**
- Impersonate the artist or claim to represent them
- Use copyrighted material beyond fair use (Spotify embeds are licensed)
- Send spam (outreach is one personalized message + one follow-up)
- Sell or monetize the artist's content without their consent

**Precedent:** This model has been tested by major platforms:
- **Genius.com**: Created millions of lyric pages without artist permission. Artists now actively claim and manage their pages.
- **Wikipedia**: Articles created about living people without consent. Subjects can request edits or removal.
- **IMDb**: Actor/director pages created by the community, claimed by the subjects.
- **Bandcamp / SoundCloud**: Fan accounts and unofficial pages are common and tolerated.

### Agent Architecture

Six specialized agents form the pipeline. Each has a single responsibility and passes structured data to the next.

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│ 1. DISCOVERY    │───▶│ 2. AUDIT     │───▶│ 3. CAMPAIGN     │
│ Find artists     │    │ Analyze       │    │ Creator          │
│ across platforms │    │ latest release│    │ Build campaign   │
└─────────────────┘    └──────────────┘    └─────────────────┘
                                                    │
                                                    ▼
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│ 6. CLAIM        │◀───│ 5. FOLLOW-UP │◀───│ 4. OUTREACH     │
│ Transfer         │    │ Monitor &     │    │ Craft & send     │
│ ownership        │    │ re-engage     │    │ personalized msg │
└─────────────────┘    └──────────────┘    └─────────────────┘
```

---

### Agent 1: Discovery Agent

**Purpose:** Find independent artists who would benefit from promotion.

**Data Sources (ordered by viability):**

| Source | Method | Volume | Quality |
|--------|--------|--------|---------|
| Spotify Search API | Search by genre + year filter for recent releases, filter by follower count | 50-200/day | ⭐⭐⭐⭐⭐ |
| Spotify Playlists | Scrape "Fresh Finds", "Independent Rising", genre-specific indie playlists | 20-50/day | ⭐⭐⭐⭐ |
| TikTok Trending Sounds | Search for original sounds with <10K video uses | 30-100/day | ⭐⭐⭐⭐ |
| Instagram Hashtags | #independentartist, #unsignedartist, #newmusic, #musicpromotion | 100+/day | ⭐⭐⭐ |
| Bandcamp New Releases | Scrape genre pages for recent uploads | 20-50/day | ⭐⭐⭐⭐ |
| SoundCloud Charts | Filter by "emerging" and genre | 20-50/day | ⭐⭐⭐ |
| Reddit | r/indiemusic, r/ThisIsOurMusic, r/userproduced | 10-20/day | ⭐⭐⭐ |

**Discovery Criteria (filters to apply):**
- Has released music in the last 6 months
- Follower count: 100 – 50,000 (small enough to need promotion, large enough to have fans)
- No major label affiliation (check Spotify artist page for label info)
- Has at least some social presence (Instagram or TikTok account linked)
- Not already a Selah.fm user
- Genre match: electronic, pop, indie, alternative, hip-hop, R&B, Christian/worship (our initial niches)

**Output per artist:**
```json
{
  "artist_name": "Luna Waves",
  "spotify_id": "7hJHsF7...",
  "genres": ["indie pop", "dream pop"],
  "followers": 3200,
  "social_links": {
    "instagram": "lunawavesmusic",
    "tiktok": "lunawavesmusic",
    "youtube": "@lunawaves"
  },
  "latest_release": {
    "track_name": "Neon Summer",
    "release_date": "2026-03-15",
    "spotify_url": "https://open.spotify.com/track/...",
    "cover_art_url": "https://i.scdn.co/image/..."
  },
  "discovery_source": "spotify_playlist_fresh_finds",
  "discovered_at": "2026-05-12T09:00:00Z"
}
```

**Implementation:** 
- Spotify Web API (free tier: rate-limited but sufficient for 50-200 artists/day)
- Serverless function triggered by cron (daily at 06:00 UTC)
- Deduplication by Spotify artist ID
- Stores results in `discovered_artists` table

---

### Agent 2: Audit Agent

**Purpose:** Deep-dive analysis of each artist's latest release to gather everything needed for a compelling campaign.

**Data gathered:**

| Data Point | Source | Use in Campaign |
|------------|--------|-----------------|
| High-res cover art | Spotify API (640x640 → upscale) | Campaign cover image |
| Track preview/audio | Spotify embed URL | Campaign media carousel |
| Music video (if exists) | YouTube Data API search | Campaign YouTube video embed |
| Artist bio | Spotify artist page | Campaign description |
| Genre tags | Spotify API | Campaign categorization |
| Similar artists | Spotify "Related Artists" API | CPM rate benchmarking |
| Social media follower counts | Instagram/TikTok public APIs | Campaign creator-visible stats |
| Best performing social post | Manual or automated scan | Outreach ice-breaker |

**CPM Rate Intelligence:**
- If the artist's genre has campaigns on Selah.fm, use average CPM for that genre
- If no genre data, use platform default ($0.10 CPM for electronic, $0.15 for pop, $0.20 for hip-hop)
- Research: CPM rates for music promotion average $0.10-0.50 depending on genre and competition

**Output per artist:**
```json
{
  "artist_name": "Luna Waves",
  "audit": {
    "cover_art_url": "https://i.scdn.co/image/...",
    "youtube_video_url": "https://youtube.com/watch?v=...",
    "spotify_embed": "<iframe src='...'></iframe>",
    "bio": "Luna Waves is an indie pop artist from Portland...",
    "genres": ["indie pop", "dream pop"],
    "recommended_cpm": 0.12,
    "recommended_budget": 50,
    "instagram_followers": 2400,
    "tiktok_followers": 5100,
    "similar_artists_on_platform": 0,
    "campaign_title": "Luna Waves — Neon Summer",
    "campaign_slug": "luna-waves-neon-summer",
    "hashtags": ["#indiepop", "#dream pop", "#newmusic"]
  }
}
```

**Implementation:**
- Orchestrated API calls (Spotify + YouTube)
- YouTube search: `"{artist_name} {track_name} official music video"`
- Fallback to audio-only if no video found
- Stores audit in `artist_audits` table
- Marks discovery as "audited"

---

### Agent 3: Campaign Creator Agent

**Purpose:** Programmatically create a fully set-up Selah.fm campaign for the artist.

**What it creates:**
1. Cover art: Downloads from Spotify CDN → saves to `/public/images/campaigns/` as JPEG
2. Campaign title: `{Artist Name} — {Track Title}` (SEO optimized)
3. Slug: `{artist-name}-{track-title}-{random-4chars}` (consistent with platform)
4. Track URL: Spotify open link
5. YouTube video: Embed URL if music video found
6. CPM rate: Genre-based recommendation from audit
7. Max budget: Default $100 (artist can adjust after claiming)
8. Platforms: TikTok, Instagram Reels, YouTube Shorts (all enabled)
9. Hashtag recommendations: Genre + vibe tags from audit
10. Requirements: Default template — "Create engaging short-form content featuring this track"
11. Status: `unclaimed` (new campaign status)

**Campaign statuses (extending current schema):**
- `draft` — being created by artist (existing)
- `active` — accepting submissions (existing)
- `unclaimed` — auto-generated, not yet claimed by artist (NEW)
- `claimed` — was unclaimed, now owned by artist (NEW)
- `completed` — finished (existing)

**Implementation:**
- Uses existing campaign creation API with a new flag `is_unclaimed: true`
- Cover art conversion handled by existing PATCH handler (base64 → file)
- Generates campaign link: `https://selah.fm/c/{slug}`
- Generates claim link: `https://selah.fm/claim/{claim_code}`
- Stores claim code in new `campaign_claims` table
- Campaign visible on browse page with "Unclaimed" badge

---

### Agent 4: Outreach Agent

**Purpose:** Craft and send a personalized outreach message to each artist.

**Outreach Channels (by priority):**

| Channel | Method | Deliverability | Volume Limit | Best For |
|---------|--------|---------------|--------------|----------|
| Instagram DM | Manual or Instagram Graph API (business accounts only) | High (if they follow back or accept message requests) | 50-100/day manual, 200/hr via API | Artists active on Instagram |
| Email | Find email from Spotify bio, website, or press kit | Medium (may go to spam) | 500/day (Resend) | Professional artists |
| TikTok DM | Manual only (no API for DMs) | Low (most have DMs restricted) | 20-30/day manual | Viral/genre artists |
| Twitter/X DM | Manual or API | Medium (open DMs vary) | 50/day | Music tech community |
| SoundCloud Message | Manual | Medium | 20/day | Electronic/indie |

**Outreach Template (personalized per artist):**

```
Subject: Your track "Neon Summer" — promotion campaign ready 🎵

Hey Luna,

I've been listening to "Neon Summer" on repeat — the dreamy synth 
line at 1:23 is genuinely special. 

I built a platform called Selah.fm where content creators on TikTok 
and Reels make videos using your music, and you only pay per verified 
view. No upfront cost. No black-box ads.

I actually went ahead and created a campaign for "Neon Summer" 
already — cover art, track link, everything set up:

👉 https://selah.fm/c/luna-waves-neon-summer-b3a2

You can claim it anytime by signing up — it takes 30 seconds. 
Or don't. No pressure. The page just sits there looking pretty 
until you want it.

Either way, your music deserves to be heard. I hope this helps.

— Robert-Jan
  Founder, Selah.fm
  (former indie musician who got tired of labels taking 98%)
```

**Template Variables:**
- `{artist_name}` — first name or artist name
- `{track_title}` — latest release title
- `{personal_detail}` — specific compliment about their music (from audit)
- `{campaign_url}` — link to their auto-generated campaign
- `{claim_url}` — direct claim link (if they want to skip browsing)

**Outreach Rules:**
- One initial message
- One follow-up at Day 5 if no response
- No third message (don't harass)
- Track all outreach in `outreach_log` table
- Respect opt-outs immediately

**Implementation:**
- For MVP: manual outreach via Instagram (highest engagement)
- Future: email automation via Resend API
- Future: Instagram Graph API for business account messaging
- Logs all outreach attempts with timestamps and status

---

### Agent 5: Follow-Up Agent

**Purpose:** Monitor campaign activity and re-engage artists who showed interest but didn't claim.

**Monitoring Triggers:**

| Trigger | Action |
|---------|--------|
| Artist viewed campaign page (page visit) | Log as "interested" |
| Artist clicked claim link but didn't complete | Send follow-up DM at Day 3 |
| Campaign got creator submissions | Notify artist: "3 creators want to promote your track!" (urgency) |
| Campaign got views but unclaimed after 7 days | Send: "Your campaign already has 1,200 views — want to claim it?" |
| No activity after 14 days | Mark as "dormant", no further action |
| Artist explicitly declines | Mark as "declined", never contact again |

**Implementation:**
- Query `outreach_log` for pending items daily
- Query `campaigns` with `status = 'unclaimed'` and `created_at > 7 days`
- Check campaign page view analytics (Google Analytics events)
- Automated follow-up via whatever channel was used for initial outreach

---

### Agent 6: Claim Agent

**Purpose:** Allow artists to claim their auto-generated campaign and take full ownership.

**Claim Flow:**

1. Artist clicks claim link: `https://selah.fm/claim/{claim_code}`
2. **Verification page** asks: "Are you Luna Waves? Prove it one of these ways:"
3. **Verification Options:**

| Method | How | Security Level | Friction |
|--------|-----|---------------|----------|
| **Spotify OAuth** | Artist logs into Spotify — we verify they have access to the artist profile | ⭐⭐⭐⭐⭐ (strongest) | Low |
| **Instagram verification** | Post a verification code on their Instagram story | ⭐⭐⭐⭐ | Medium |
| **Email verification** | Email matches artist's official domain | ⭐⭐⭐ | Low |
| **Manual admin approval** | Artist messages support → admin verifies and approves | ⭐⭐⭐⭐⭐ | High |

4. **On successful verification:**
   - Campaign `status` changes from `unclaimed` → `claimed`
   - Campaign `artist_id` is set to the user's account ID
   - User gets full dashboard access to manage the campaign
   - User can adjust CPM rate, max budget, requirements
   - User can review submissions, approve/reject
   - User can withdraw funds to Stripe Connect
   - The "Unclaimed" badge disappears
   - Auto-post to activity feed: "Luna Waves claimed their campaign!"

5. **Implementation:**
   - Claim codes: UUID v4, stored in `campaign_claims` table
   - Spotify OAuth: use existing Google OAuth flow pattern, add Spotify provider
   - Instagram verification: manual for MVP (admin reviews the story post)
   - Claim page: simple one-page flow with verification options
   - Post-claim onboarding: show artist their campaign dashboard

---

### Database Schema (New Tables)

```sql
-- Discovered artists from automated sourcing
CREATE TABLE discovered_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_name TEXT NOT NULL,
  spotify_id TEXT UNIQUE,
  genres TEXT[] DEFAULT '{}',
  followers INTEGER DEFAULT 0,
  social_links JSONB DEFAULT '{}',
  latest_track_name TEXT,
  latest_track_spotify_url TEXT,
  latest_track_cover_url TEXT,
  latest_release_date DATE,
  discovery_source TEXT, -- 'spotify_search', 'tiktok_trending', etc.
  status TEXT DEFAULT 'discovered', -- 'discovered', 'audited', 'campaign_created', 'outreach_sent', 'claimed', 'declined', 'dormant'
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Detailed audit per artist
CREATE TABLE artist_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discovered_artist_id UUID REFERENCES discovered_artists(id),
  youtube_video_url TEXT,
  spotify_embed_html TEXT,
  artist_bio TEXT,
  recommended_cpm_cents INTEGER,
  recommended_budget_cents INTEGER,
  instagram_followers INTEGER,
  tiktok_followers INTEGER,
  similar_artists_count INTEGER DEFAULT 0,
  campaign_title TEXT,
  campaign_slug TEXT,
  hashtags TEXT[] DEFAULT '{}',
  personal_angle TEXT, -- specific compliment/observation for outreach
  audited_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outreach log
CREATE TABLE outreach_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discovered_artist_id UUID REFERENCES discovered_artists(id),
  campaign_id UUID REFERENCES campaigns(id),
  channel TEXT NOT NULL, -- 'instagram_dm', 'email', 'tiktok_dm', 'twitter_dm'
  message_type TEXT NOT NULL, -- 'initial', 'follow_up_1', 'follow_up_2'
  message_text TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'replied', 'failed', 'opted_out'
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claim codes for campaign ownership transfer
CREATE TABLE campaign_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) NOT NULL UNIQUE,
  claim_code TEXT NOT NULL UNIQUE,
  verification_method TEXT, -- 'spotify_oauth', 'instagram_verify', 'email', 'manual'
  claimed_by_user_id UUID REFERENCES users(id),
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Admin Dashboard

A new admin page at `/admin/outreach` serves as the control center:

**Pipeline Overview:**
- Discovered: 847 artists
- Audited: 312 artists
- Campaigns created: 156
- Outreach sent: 89
- Claimed: 12
- Declined: 3
- Conversion rate: 13.5%

**Action buttons:**
- "Run Discovery Agent" — triggers Agent 1 for this session
- "Audit Selected (N)" — runs Agent 2 on selected discoveries
- "Create Campaigns (N)" — runs Agent 3 on audited artists
- "Send Outreach (N)" — preview messages, confirm, then send
- Individual artist cards with full pipeline status

**Quality Control:**
- Before outreach, admin reviews the auto-generated campaign
- Can edit title, CPM rate, description before sending
- Can skip artists that don't fit
- Can add personal notes to the outreach message

### Integration with Existing Systems

**Blog System:**
- When an artist claims their campaign, auto-generate a blog post: "Luna Waves Joins Selah.fm — 'Neon Summer' Now Open for Creator Promotion"
- Cross-link blog post to campaign page and vice versa
- Creates SEO content AND social proof simultaneously

**Content Hub:**
- "Outreach Pipeline" section showing live stats
- Quick link to `/admin/outreach`

**Browse Page:**
- Unclaimed campaigns shown with "Community Pick" or "Staff Pick" badge
- Filter option: "Show unclaimed campaigns"
- These populate the platform and make it look active

### Outreach Volume & Scaling

**Phase 1: Manual MVP (Month 1)**
- Discovery: 50 artists/day via Spotify API script
- Audit: Manual review of 10-20/day
- Campaign creation: Automated (5 min each via admin UI)
- Outreach: Manual Instagram DMs, 10-20/day
- **Target: 5-10 claimed campaigns in Month 1**

**Phase 2: Semi-Automated (Month 2-3)**
- Discovery: 100 artists/day automated
- Audit: Automated for top 50/day, manual spot-check
- Campaign creation: Fully automated
- Outreach: Semi-automated (preview + confirm button)
- Follow-up: Automated
- **Target: 20-50 claimed campaigns in Month 2**

**Phase 3: Full Automation (Month 4+)**
- Full pipeline automated with quality gates
- Manual override for edge cases
- A/B testing outreach templates
- **Target: 10+ claims/day, compounding**

### Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Spotify API rate limits | Medium | Medium | Cache results, spread requests, use multiple API keys |
| Instagram shadow-ban for DM automation | High | High | Manual DMs for MVP, stay under 50/day, use real account |
| Artist complains about unauthorized campaign | Low | High | Immediate removal policy, clear "unclaimed" badge, no monetization until claimed |
| Legal challenge over using artist content | Very Low | Critical | Fair use (promotional purpose), immediate takedown on request, consult lawyer before scaling |
| Low conversion rate (artists don't claim) | Medium | High | A/B test outreach templates, improve campaign quality, add social proof |
| Platform ToS violation (Instagram scraping) | Medium | High | Use official APIs only, no scraping, stay within rate limits |

### Claim Page UX

The claim page at `https://selah.fm/claim/{code}` should feel like unwrapping a gift:

```
┌─────────────────────────────────────────────┐
│                                             │
│   🎁  A campaign was created for YOU        │
│                                             │
│   [Cover Art Image]                         │
│                                             │
│   "Neon Summer" — Luna Waves                │
│                                             │
│   Someone who loves your music created      │
│   this promotion campaign so creators on    │
│   TikTok and Reels can feature your track.  │
│                                             │
│   3 creators have already submitted videos. │
│   1,247 verified views so far.              │
│                                             │
│   Want to claim it?                          │
│                                             │
│   [▶ Claim with Spotify] (30 sec)           │
│   [📸 Verify via Instagram]                 │
│   [✉️  Verify via Email]                    │
│                                             │
│   Not Luna Waves? [Report this page]        │
│                                             │
└─────────────────────────────────────────────┘
```

### Outreach Message Library

**Template A: The Music Lover (warm, genuine)**
Best for: indie/alternative artists, electronic producers
```
Hey {name},

I've had "{track}" on repeat this week. The way you {specific detail 
about the production/lyrics/vibe} is exactly what {genre} needs 
right now.

I run a platform where creators make TikToks using your music, and 
you only pay when their videos get verified views. No upfront costs. 
No sketchy playlist bots.

I actually went ahead and set up a campaign for "{track}" — cover 
art, links, the works:

{campaign_url}

It's ready to go. If you want it, just claim it (takes 30 seconds 
with Spotify). If not, no worries at all.

Your music deserves to be heard either way.

— Robert-Jan
```

**Template B: The Numbers Person (data-driven)**
Best for: hip-hop artists, pop artists who care about metrics
```
Hey {name},

Quick thing: I analyzed your Spotify stats and "{track}" is getting 
good traction but nowhere near what it deserves. With {follower_count} 
followers, you should be seeing 5-10x the streams.

Here's why: TikTok is where music discovery happens now. A single 
creator using your track can generate 50K+ streams on Spotify within 
48 hours. I've seen it happen.

I built Selah.fm so artists can hire TikTok/Reels creators directly, 
paying only per verified view. No label. No ad platform black box. 
Just direct artist-to-creator promotion.

I set up a campaign for "{track}" with your cover art and links:
{campaign_url}

CPM is set at ${cpm}. You pay nothing until a creator's video gets 
verified views. Claim it if you want — no strings.

— Robert-Jan
```

**Template C: The Short & Casual**
Best for: artists who seem busy or get a lot of DMs
```
{campaign_url} ← I made this for you. It's a promotion campaign for 
your track "{track}". Creators on TikTok/Reels can make videos with 
your music, you pay per verified view. No catch. Claim it or don't — 
just thought your music was worth promoting.

— Robert-Jan 🎵
```

---

### Implementation Roadmap (When We Build This)

**Phase 1: Database + API (3-4 hours)**
- [ ] Create migration for `discovered_artists`, `artist_audits`, `outreach_log`, `campaign_claims`
- [ ] Build API endpoints for each agent action
- [ ] Extend campaign creation API to support `unclaimed` status
- [ ] Build claim page at `/claim/[code]`

**Phase 2: Discovery + Audit Agent (2-3 hours)**
- [ ] Spotify API integration (search by genre, get artist details, get related artists)
- [ ] YouTube Data API for music video search
- [ ] Artist deduplication and filtering logic
- [ ] Store results in database

**Phase 3: Campaign Creator + Outreach Agent (2-3 hours)**
- [ ] Auto-campaign creation from audit data
- [ ] Cover art download and caching
- [ ] Outreach template rendering with personalization
- [ ] Outreach logging

**Phase 4: Admin Dashboard + Claim Flow (3-4 hours)**
- [ ] `/admin/outreach` page with pipeline view
- [ ] Quality control preview before sending
- [ ] Spotify OAuth for artist verification
- [ ] Claim page UX
- [ ] Post-claim onboarding flow

**Total build time: ~12 hours**

---

## Supporting Channels (Existing Strategy)

The outbound automation is the primary growth engine. These channels support and amplify it:

### 1. Reddit — Community Presence
(Content unchanged from previous strategy — 10 insightful comments/day, 1 quality post/week in r/musicmarketing, r/WeAreTheMusicMakers, r/indiemusic)

### 2. SEO + Content Marketing — Compound Growth
(Blog content calendar, CPM Calculator, Creator Earnings Estimator, Promotion Budget Planner — already live)

### 3. TikTok — Founder Story Content
(Daily posting, founder story, educational hooks — organic growth)

### 4. YouTube — Evergreen Tutorials
(1 video/week, tutorials, case studies)

### 5. Referral Program — Built, Needs Activation
(Referral links live, needs UI visibility + email campaign)

### 6. Strategic Partnerships
(DistroKid, TuneCore, LANDR integrations)

---

## 90-Day Marketing Roadmap

### Month 1 (Days 1-30): Outbound MVP + Content Foundation
- [ ] **Build outreach pipeline** (discovery → audit → campaign → outreach → claim agents)
- [ ] Publish 15 blog posts (voice-generated, every other day)
- [ ] Manual outreach: 10-20 artists/day via Instagram
- [ ] Post 30 TikToks (1x daily, founder story)
- [ ] Answer 10 Reddit questions/day
- [ ] Launch on Product Hunt (Day 15-20)
- **Target: 5-10 claimed campaigns, 30 total users**

### Month 2 (Days 31-60): Semi-Automation + Acceleration
- [ ] Automate discovery + audit agents (daily cron)
- [ ] Increase outreach to 50/day (semi-automated)
- [ ] A/B test outreach templates
- [ ] Continue blog (8 posts)
- [ ] Continue TikTok (5x/week)
- [ ] Publish 3 YouTube videos
- [ ] Start email newsletter
- **Target: 20-50 claimed campaigns, 100 total users**

### Month 3 (Days 61-90): Full Automation + Scale
- [ ] Full pipeline automation
- [ ] 100 artists/day discovery
- [ ] Automated follow-up sequences
- [ ] Pursue 3 strategic partnerships
- [ ] Blog: 4 posts/month
- [ ] YouTube: 1 video/week
- [ ] Test $200/month paid ads
- **Target: 100+ claimed campaigns, 300 total users**

### Month 4-6: Compound
- Outbound pipeline generating 5-10 claims/day
- SEO generating 50-200 visitors/day
- TikTok generating organic signups
- Referral flywheel spinning
- **Target: 100 users/day by Month 6**

---

## Key Metrics to Track

| Metric | Current | Month 1 | Month 3 | Month 6 |
|--------|---------|---------|---------|---------|
| **Outreach Pipeline** | | | | |
| Artists discovered | 0 | 500 | 3,000 | 10,000 |
| Campaigns created | 0 | 100 | 500 | 2,000 |
| Outreach sent | 0 | 50 | 300 | 1,000 |
| Campaigns claimed | 0 | 10 | 100 | 500 |
| Claim conversion rate | 0% | 10-20% | 20-30% | 30-50% |
| **Platform Growth** | | | | |
| Daily signups | 0 | 1-3 | 10-20 | 50-100 |
| Total users | 2 | 30 | 300 | 3,000+ |
| Active campaigns | 1 | 15 | 150 | 1,000+ |
| Creator submissions | 0 | 10 | 200 | 1,000+ |
| **Content** | | | | |
| Blog traffic/day | 0 | 5 | 50 | 500 |
| Tool traffic/day | 0 | 10 | 100 | 500 |
| TikTok followers | 0 | 500 | 3,000 | 15,000 |
| **Revenue** | | | | |
| Monthly revenue | $0 | $25 | $500 | $5,000+ |

---

## Budget

| Item | Month 1 | Month 2 | Month 3 | Month 6 |
|------|---------|---------|---------|---------|
| Spotify API (free tier) | $0 | $0 | $0 | $0 |
| YouTube API (free quota) | $0 | $0 | $0 | $0 |
| DeepSeek API (blog) | $0 | $0 | $0 | $0 |
| Instagram outreach (manual) | $0 | $0 | $0 | $0 |
| Email (Resend) | $0 | $0 | $20 | $50 |
| TikTok Spark Ads | $0 | $50 | $100 | $500 |
| Reddit Ads | $0 | $0 | $50 | $200 |
| Referral credits | $0 | $50 | $150 | $1,000 |
| **Total** | **$0** | **$100** | **$320** | **$1,750** |

---

## Immediate Next Actions (This Week)

1. **Research only — no execution until plan is reviewed:**
   - Verify Spotify API access and rate limits for artist discovery
   - Test Instagram DM deliverability for musician accounts
   - Draft 3 outreach message variants for A/B testing
   - Map out the claim page UX flow
2. **Platform prep:**
   - Publish 3 blog posts from voice library
   - Set up referral UI in dashboard
   - Prepare Product Hunt launch materials
