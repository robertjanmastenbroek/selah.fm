# Selah.fm — Status & Reference
**Version:** 1.2 · **Live:** https://selah.fm · **Updated:** 2026-05-14

---

## Current Focus: Platform Polish & Conversion

The outbound pipeline is running autonomously. Focus has shifted to:
1. **Campaign page UX** — Creator-primary, one dominant CTA, scannable instructions
2. **Homepage conversion** — Apple-grade visual quality, clear value prop, live stats
3. **Persistent auth** — Sessions no longer drop unexpectedly
4. **Image reliability** — Campaign images stored in DB (survives Railway deploys)

---

## Pipeline Status

| Table | Rows | Notes |
|-------|------|-------|
| discovered_artists | 1,800+ | Multi-channel discovery (Bandcamp + YouTube + Reddit) |
| artist_audits | 111+ | YouTube video search + social scraping |
| campaigns (active) | 54 | Mix of claimed + unclaimed auto-generated |
| campaign_claims | 50+ | UUID claim codes, cumulative count |

**Cron schedule:** Pipeline 02:00 + 14:00 UTC, Follow-up 18:00 UTC
**DM channels:** Instagram + TikTok (both handles supported, IG prioritized)

---

## Recent Changes (2026-05-14)

### Campaign Page v2 (3 files, 2 commits)
| Change | Details |
|--------|---------|
| P0: CPM consistency | All displays read from `campaign.cpm_rate_cents`. Creator cut shown as "80% — $X" in parentheses. |
| P0: Loading state fix | LiveTicker 8-second safety timeout → "Be the first creator on this track." |
| P1: Dominant creator CTA | Full-width "Join campaign" button. Donate demoted to small text link. |
| P1: Single donation panel | Removed duplicates. One panel below creator flow, visually de-emphasized. |
| P1: Scannable instructions | Essentials block (6 bullets) + collapsible Full Guidelines. |
| P1: Asset download first | Google Drive moved above How to Participate. Step 1 leads with download. |
| P2: Submission confirmation | "You're in!" + 3-step timeline (review → verify → payout). |

### Homepage v2 (`components/HomePageClient.tsx`)
- Deeper `#080817` background + SVG grain texture + softer ambient light
- 3-line hero headline ("Your music / real creators / real views")
- Live campaign count from API total (not LIMITed page)
- Open source badge in hero
- Equal-height campaign cards with reserved title space
- Problem/Solution comparison with more visceral copy
- Trust pillars row (Verified views, You own everything, Open source, Built by musicians)

### Equal-Height Campaign Cards (`BrowseClient.tsx` + `HomePageClient.tsx`)
- `h-full flex flex-col` with `flex-1 justify-between` on card body
- `min-h-[2.5rem]` on titles — all cards same height regardless of title length
- Bottom section (budget bar + CPM) pinned to card bottom

### Persistent Auth (`lib/auth.ts`)
- Replaced `require('next/headers')` with static `import { cookies }`
- Fixed cookie header regex: `/(?:^|;\s*)session=([^;]+)/`
- Added `.selah.fm` cookie domain (works on www + root domain)
- `secure` flag checks both `NODE_ENV` and `NEXT_PUBLIC_URL`

### Image Storage — campaign_images table
- Images stored as `BYTEA` in DB (survives Railway ephemeral filesystem)
- Serving route: `/images/campaigns/[filename]`
- Download function with browser headers + magic byte validation + Bandcamp page scraping
- All 4 campaign creation paths store images: admin API, cron pipeline, POST /api/campaigns, PATCH /api/campaigns/[id]

### TikTok DM Support
- Campaigns created for artists with TikTok handles (not just Instagram)
- `discoverSocialLinks` validates TikTok handle existence (rejects "Couldn't find this account")
- Outreach DM opens TikTok tab alongside Instagram when both exist

### Browse Page
- Campaign cards show artist name above track title
- Equal-height card grid with reserved title space
- `campaigns_created` stat from `campaign_claims` (cumulative, never decreases)

---

## Design System

- **Style:** Dark, premium — `#080817` base
- **Colors:** Primary `#4338CA` (indigo), Accent `#22C55E` (green)
- **Fonts:** Righteous (headings) + Poppins (body)
- **Homepage:** Grain texture, glass-morphism cards, 1px subtle borders, wide ambient glow shadows

---

## Key Architecture Decisions

- **Creator-primary campaign pages** — One dominant CTA (Join), donation is secondary
- **Instagram + TikTok DM** — Both handles supported. No IG = campaign blocked at creation.
- **AI outreach messages** — DeepSeek API, founder voice, genre-specific, anti-spam guardrails
- **$0 budget auto-campaigns** — Artists can fund after claiming
- **DB image storage** — `campaign_images` table (BYTEA). Filesystem is ephemeral on Railway.
- **Spotify removed** — Bandcamp API provides all needed artist data
- **Stateless sessions** — HMAC-signed cookies, 7-day expiry, no DB tokens needed

---

## Key Files

| File | Purpose |
|------|---------|
| `app/c/[id]/page.tsx` | Campaign detail page (metadata + server component) |
| `app/c/[id]/CampaignDetailClient.tsx` | Campaign page client (all UI + flows) |
| `components/HomePageClient.tsx` | Homepage v2 (hero, campaigns, problem/solution, etc.) |
| `app/browse/BrowseClient.tsx` | Browse page with equal-height campaign cards |
| `app/api/admin/outreach/route.ts` | All outreach API actions + repair |
| `app/api/cron/outreach-pipeline/route.ts` | Autonomous pipeline (cron) |
| `app/api/cron/outreach-followup/route.ts` | Day-7 follow-up system (cron) |
| `lib/auth.ts` | Session management (HMAC cookies, domain support) |
| `lib/outreach.ts` | Artist audit + AI outreach messages |
| `lib/discovery.ts` | Multi-channel artist discovery |
| `components/EarnModal.tsx` | Creator submission flow with confirmation |
| `components/LiveTicker.tsx` | Activity ticker with empty-state handling |

---

## Important Rules

- **CPM source of truth:** `campaign.cpm_rate_cents` only — never hardcode rate strings
- **Creator-primary pages:** One dominant Join CTA, donation is secondary link
- **Donations panel:** ONE instance, below creator flow, visually de-emphasized
- **Image fallback chain:** DB binary → external URL → og-image.jpg
- **Campaign count:** Uses `campaign_claims` table (cumulative)
- **OG images:** Root layout must NOT set `openGraph.images`
- **UI safety:** All buttons disable during loading, global actions lock all cards
- **Session cookies:** `.selah.fm` domain, 7-day maxAge, secure in prod

---

## Testing

```bash
npx tsc --noEmit     # zero errors
node e2e/test.js     # 44 tests, 100% passing
```
