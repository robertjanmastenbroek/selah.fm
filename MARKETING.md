# Selah.fm — Marketing Strategy

**Goal:** 100 new users/day (50 artists + 50 creators)
**Strategy:** Automated campaign creation + personalized artist outreach
**Budget:** $0 (Spotify API free tier, manual Instagram DMs, existing infra)
**Updated:** 2026-05-12

---

## The Strategy

**We don't wait for artists to find us. We find them, build their campaign for them, and send them a link.**

---

## The Pipeline

Six agents. One job each. Data flows left to right.

```
DISCOVERY → AUDIT → CAMPAIGN CREATOR → OUTREACH → FOLLOW-UP → CLAIM
```

---

## Agent 1: Discovery — Find Artists

**Job:** Find independent artists who'd benefit from promotion.

| Source | Volume/day | Quality |
|--------|-----------|---------|
| Spotify Search API (genre + year + follower filter) | 50–200 | ⭐⭐⭐⭐⭐ |
| Spotify indie playlists ("Fresh Finds", genre-specific) | 20–50 | ⭐⭐⭐⭐ |
| TikTok trending original sounds (<10K uses) | 30–100 | ⭐⭐⭐⭐ |
| Bandcamp new releases by genre | 20–50 | ⭐⭐⭐⭐ |
| Instagram #independentartist, #unsignedartist | 100+ | ⭐⭐⭐ |

**Filters:** 100–50K followers, released music in last 6 months, no major label, has social presence, not already a Selah.fm user. Genres: electronic, pop, indie, alternative, hip-hop, R&B, Christian/worship.

**Output per artist:** name, Spotify ID, genres, follower count, social links, latest track name/URL/cover art, discovery source.

---

## Agent 2: Audit — Analyze Their Release

**Job:** Gather everything needed for a compelling campaign + personalized outreach.

Grabs from Spotify API: high-res cover art, artist bio, genre tags, related artists.
Grabs from YouTube API: official music video for the latest track.
Calculates: recommended CPM based on genre (or Selah.fm averages), recommended budget, hashtags.

**Critical output for outreach:** a `personal_angle` — one specific, genuine compliment about their music that makes the DM feel human.

---

## Agent 3: Campaign Creator — Build the Campaign

**Job:** Programmatically create a fully set-up campaign on Selah.fm.

Creates: cover art (downloads from Spotify CDN → saves to `/public/images/campaigns/`), title (`{Artist Name} — {Track Title}`), SEO slug, Spotify track link, YouTube embed, genre-based CPM, default $100 max budget, all platforms enabled, genre hashtags.

Sets campaign status to `unclaimed` — visible on browse with an "Unclaimed" badge and disclaimer. Generates a unique claim code for ownership transfer.

---

## Agent 4: Outreach — Send the Message

**Job:** Craft and send a personalized DM to the artist.

**Primary channel:** Instagram DM (highest engagement for musicians). Manual for MVP, Instagram Graph API later.

**Template (warm/genuine):**
```
Hey {name},

I've had "{track}" on repeat. {personal_angle}

I built Selah.fm — a platform where creators make TikToks/Reels 
using your music, and you only pay per verified view. No upfront cost.

I made a campaign for "{track}" already — cover art, links, everything:
👉 {campaign_url}

Claim it anytime (30 seconds). Or don't. No pressure.

— Robert-Jan
  Founder, Selah.fm
```

**Rules:** One initial message. One follow-up at Day 5 if no reply. No third message. Track everything in `outreach_log`. Respect opt-outs immediately.

---

## Agent 5: Follow-Up — Re-engage

**Job:** Monitor activity and nudge artists who showed interest.

| Trigger | Action |
|---------|--------|
| Artist viewed campaign page | Log as "interested" |
| Clicked claim link, didn't complete | Follow-up DM at Day 3 |
| Campaign got creator submissions | "3 creators want to promote your track!" |
| Views accrued, unclaimed after 7 days | "Your campaign has 1,200 views — want it?" |
| No activity after 14 days | Mark "dormant", stop outreach |
| Artist declines | Mark "declined", never contact again |

---

## Agent 6: Claim — Transfer Ownership

**Job:** Let the artist prove they are who they say they are and take over.

Artist gets a unique claim link: `selah.fm/claim/{code}`. Verification options:

| Method | Security | Friction |
|--------|----------|----------|
| Spotify OAuth (prove access to artist profile) | ⭐⭐⭐⭐⭐ | Low |
| Post verification code on Instagram story | ⭐⭐⭐⭐ | Medium |
| Email matches official domain | ⭐⭐⭐ | Low |
| Manual admin approval | ⭐⭐⭐⭐⭐ | High |

On success: campaign status → `claimed`, assigned to their account, full dashboard access, can adjust CPM/budget, review submissions, withdraw funds. "Unclaimed" badge disappears.

---

## Why This Works

- **Zero activation energy.** The campaign already exists. The artist just clicks a link. No signup flow, no setup, no uploading assets.
- **Psychological ownership.** Seeing your music already promoted on a platform creates FOMO. You want to claim it.
- **Social proof at scale.** A platform with 500 campaigns (even unclaimed) looks alive. A platform with 1 looks dead.
- **Network effects.** Each claimed campaign = 1 artist. Artists attract creators. Creators attract more artists. Flywheel.
- **Proven model.** Genius.com (lyric pages), Wikipedia (articles), IMDb (actor pages) all started this way. Legally tested, socially accepted.

---

## Legal Framework

**We do:** Use publicly available assets (Spotify embeds, public cover art). Show an "Unclaimed Campaign" badge with disclaimer. Allow claim at any time with zero friction. Remove immediately on artist request.

**We don't:** Impersonate artists. Use copyrighted material beyond fair use. Spam (1 message + 1 follow-up max). Monetize unclaimed campaigns.

---

## Database (New Tables Needed)

```sql
discovered_artists   — artist metadata, Spotify ID, status pipeline column
artist_audits        — detailed analysis, recommended CPM, personal_angle
outreach_log         — every message sent, channel, status, timestamps
campaign_claims      — claim codes, verification method, claimed_by
```

---

## Implementation Plan (~12 hours total)

| Phase | What | Time |
|-------|------|------|
| 1. DB + API | Migration, API endpoints, `unclaimed` campaign status, claim page | 3–4h |
| 2. Discovery + Audit | Spotify API, YouTube API, dedup, store results | 2–3h |
| 3. Campaign Creator + Outreach | Auto-create campaigns, cover art cache, template rendering, outreach logging | 2–3h |
| 4. Admin Dashboard + Claim Flow | `/admin/outreach` pipeline view, QC preview, Spotify OAuth, claim UX | 3–4h |

---

## Scaling Plan

| Phase | Discovery | Outreach | Claim Target |
|-------|-----------|----------|-------------|
| Month 1 (manual MVP) | 50 artists/day | 10–20 DMs/day | 5–10 claims |
| Month 2 (semi-auto) | 100/day automated | 50/day semi-auto | 20–50 claims |
| Month 3+ (full auto) | 100+/day | Automated + follow-ups | 10+ claims/day |

---

## Key Metrics

| Metric | Month 1 | Month 3 | Month 6 |
|--------|---------|---------|---------|
| Artists discovered | 500 | 3,000 | 10,000+ |
| Campaigns created | 100 | 500 | 2,000+ |
| Outreach sent | 50 | 300 | 1,000+ |
| Campaigns claimed | 10 | 100 | 500+ |
| Claim conversion rate | 10–20% | 20–30% | 30–50% |
| Total platform users | 30 | 300 | 3,000+ |

---

## Supporting Channels (Secondary)

These exist but are not the focus. The outreach pipeline is the engine.

- **Blog / SEO:** Content generated from the voice library. Grows passively. The blog answers real questions from Reddit — these same questions can be used in outreach ("I wrote an article answering exactly this question you asked...").
- **CPM Calculator / Tools:** Already live. Link-worthy assets that build domain authority.
- **Referral program:** Already built (auto-credit on deposit). Artists who claim campaigns get a referral link. Natural viral loop.
- **Product Hunt:** One-time launch event. Good for initial backlinks and visibility.

---

## Budget

$0. Spotify API is free. YouTube API is free. Instagram DMs are manual (free). DeepSeek API is already paid for. Existing Railway infra handles everything.

---

## Immediate Next Step

**Build the pipeline.** Start with Phase 1 (database migration + API endpoints). Everything else flows from there.
