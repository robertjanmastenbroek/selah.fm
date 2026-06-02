# Artist Model — Full Architecture Plan

**Date:** June 2, 2026
**Objective:** Transform selah.fm from campaign-centric to artist-centric while keeping per-track CPM/budget granularity
**Existing infrastructure:** 2,158 discovered artists · 2,039 artist_profiles · 1,911 campaign_claims

---

## Architecture Principle

```
Artist profile (permalink, SEO hub, identity)
  ├── Track A (campaign with CPM/budget, submissions, views)
  ├── Track B (campaign with CPM/budget, submissions, views)
  └── Track C (campaign with CPM/budget, submissions, views)
              ↓
        Creator picks a track → submits video → artist approves/rejects per track
```

No database migrations needed. The data exists — we surface it differently.

---

## Phase 1: Artist Profile Pages (New Route)

### 1A. `/artist/[slug]` — Server Component Page

**File:** `app/artist/[slug]/page.tsx` (MODIFY existing — currently only shows stats card)

**What it renders:**

```
┌──────────────────────────────────────────────────────┐
│ [Cover Image / Artist Photo]                         │
│                                                      │
│  Artist Name                [Genre] [Genre] [Genre]  │
│  🎵 1.2M monthly listeners · 3 tracks available      │
│  Bio: "Independent artist from..."                   │
│                                                      │
│  Social: [IG] [TT] [YT] [Spotify] [Bandcamp]        │
│                                                      │
│  ── Tracks ──                                        │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Cover 1  │  │ Cover 2  │  │ Cover 3  │           │
│  │ Track A  │  │ Track B  │  │ Track C  │           │
│  │ $10/1M   │  │ $8/1M    │  │ $5/1M    │           │
│  │ [Submit] │  │ [Submit] │  │ [Submit] │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│                                                      │
│  ── Videos for this artist ──                        │
│  [Public gallery of approved submissions]            │
└──────────────────────────────────────────────────────┘

Widget embed code: <iframe src="/artist/[slug]/embed">
```

**Data query:**
```sql
-- Fetch artist + all tracks/campaigns
SELECT da.*, ap.slug, ap.spotify_image_url, ap.total_followers, ap.total_streams,
       ap.total_platforms
FROM discovered_artists da
LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
WHERE da.artist_name = $decodedSlug OR ap.slug = $slug

-- Fetch all campaigns for this artist
SELECT c.* FROM campaigns c
JOIN campaign_claims cc ON cc.campaign_id = c.id
WHERE cc.discovered_artist_id = $artistId
ORDER BY c.created_at DESC
```

**SEO metadata:**
- Title: `"[Artist Name] — Promote their music catalog on Selah.fm"`
- Description: `"Create videos for [Artist Name]'s music and earn per view. [N] tracks available. [Genre] artist with [X] monthly listeners."`
- Schema: `MusicGroup` (artist) + `MusicRecording` for each track + `BreadcrumbList`
- OG image: artist photo or latest track cover art

**URL structure:** `/artist/robert-jan-mastenbroek`, `/artist/sufjan-stevens-c33e9f`
- Slug from `artist_profiles.slug` with fallback to slugified `artist_name`
- Canonical URL prevents duplicate indexing

### 1B. Embed Widget Route

**File:** `app/artist/[slug]/embed/route.tsx` (NEW — server-rendered iframe)

**What it returns:** Full HTML page (no client JS needed) that renders:

```
┌────────────────────────────────┐
│ [Cover Art]                    │
│                                │
│ Artist Name · Genre            │
│ N tracks available             │
│                                │
│ [🎬 Make content for this      │
│  artist — earn per view →]     │
│                                │
│ Powered by Selah.fm ────────  │
└────────────────────────────────┘
```

**Dimensions:** 300×400px iframe, responsive via CSS
**Tracking:** `utm_source=embed&utm_medium=artist_widget` on all links
**Cache:** 1-hour cache header, revalidated on artist update

### 1C. Artist API Routes

**NEW:** `app/api/artists/[slug]/route.ts` — GET artist with tracks
```json
{
  "artist": { "id", "name", "genres", "image", "monthly_listeners", "followers", "social_links", "bio" },
  "tracks": [{ "id", "title", "cover_art_url", "cpm_rate_cents", "slug", "submissions_count" }],
  "stats": { "total_tracks", "total_views", "total_paid" }
}
```

**MODIFY:** `app/api/artists/route.ts` — List artists with filters
- `GET /api/artists?genre=electronic&sort=popular&page=1&limit=20`
- Returns paginated artist list with track counts
- Aggregates campaign stats per artist

---

## Phase 2: Embed Widget Distribution

### 2A. Embed HTML + JS Snippet

**File:** `components/ArtistEmbed.tsx` (NEW)

Renders the embed code that artists can copy-paste:

```html
<!-- Paste this on your site to embed your Selah.fm artist profile -->
<iframe 
  src="https://selah.fm/artist/[slug]/embed" 
  width="300" 
  height="400" 
  style="border:none;border-radius:12px;max-width:100%"
  title="Promote [Artist Name] on Selah.fm">
</iframe>
```

**Auto-generated for every artist** with a campaign. Shown in:
- Artist dashboard (after claiming)
- Campaign claim page (`/claim/[code]`)
- Artist profile page (`/artist/[slug]`)

### 2B. Embed CTA in Existing Flows

**MODIFY:** `app/claim/[code]/page.tsx` — After claim CTA, add "Embed on your site" section with copy-paste code
**MODIFY:** `app/dashboard/page.tsx` — Add "Embeddable widget" section to artist view
**MODIFY:** `app/c/[id]/page.tsx` — Add "View artist profile →" link in campaign header

---

## Phase 3: Artist-Centric Browse

### 3A. Browse Toggle

**MODIFY:** `app/browse/page.tsx` (server component) + `app/browse/BrowseClient.tsx`

Add tab toggle at the top:

```
[ Campaigns ]  [ Artists ]     ← NEW toggle
```

**Artists tab renders** a grid of artist cards:
```
┌────────────────────┐  ┌────────────────────┐
│ [Artist Photo]     │  │ [Artist Photo]     │
│                    │  │                    │
│ Artist Name        │  │ Artist Name        │
│ 🎵 Electronic      │  │ 🎵 Hip-Hop         │
│ 3 tracks · 1.2M ML│  │ 1 track · 500K ML  │
│ [Browse tracks →]  │  │ [Browse tracks →]  │
└────────────────────┘  └────────────────────┘
```

**Data query:**
```sql
SELECT da.id, da.artist_name, da.genres, 
       ap.slug, ap.spotify_image_url, ap.total_followers,
       COUNT(DISTINCT c.id) as track_count,
       COALESCE(da.monthly_listeners, 0) as monthly_listeners
FROM discovered_artists da
LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
LEFT JOIN campaign_claims cc ON cc.discovered_artist_id = da.id
LEFT JOIN campaigns c ON c.id = cc.campaign_id
WHERE c.status IN ('active', 'draft')
  AND ($genre IS NULL OR da.genres::text ILIKE $genre)
GROUP BY da.id, ap.id, ap.slug, ap.spotify_image_url
ORDER BY track_count DESC, monthly_listeners DESC
LIMIT 20 OFFSET $offset
```

**Genre filter** works for both tabs:
- Campaigns tab: filters by campaign genre (existing)
- Artists tab: filters by artist genre (new)

**Search** works across both:
- Campaigns: search by track title or artist name (existing)
- Artists: search by artist name or genre (new)

**Pagination:** Add page query param `/browse?tab=artists&page=2`

### 3B. Artist Card Component

**NEW:** `components/ArtistCard.tsx` — Reusable card for artist grid

Props: `{ artist_name, genres, slug, image_url, track_count, monthly_listeners, followers }`

---

## Phase 4: Pipeline Update — Multi-Track Artists

### 4A. Discovery Pipeline

**MODIFY:** `app/api/cron/outreach-pipeline/route.ts`

**Current behavior:** Skip if artist already exists in `discovered_artists`
**New behavior:** If artist exists, add track as a NEW campaign under same artist

Flow:
```
Discover artist
  ├── Not in DB → INSERT discovered_artist + artist_profile + campaign + claim
  └── Already in DB → INSERT campaign (new track) + claim (link to existing artist)
```

**Implementation:**
```sql
-- Replace the "skip if exists" check with:
const existingArtist = await sql`
  SELECT id FROM discovered_artists 
  WHERE ${
    a.spotify_id 
      ? sql`spotify_id = ${a.spotify_id}` 
      : sql`artist_name = ${a.artist_name}`
  } LIMIT 1
`;

if (existingArtist.length > 0) {
  -- Artist exists — add as new track/campaign
  CREATE campaign linked to existingArtist.id
  CREATE campaign_claim linked to existingArtist.id
  continue; -- (don't INSERT to discovered_artists again)
} else {
  -- New artist — full insert
  INSERT into discovered_artists...
  INSERT into artist_profiles... (if not exists)
  CREATE campaign + claim
}
```

**Duplicate detection:** Multiple discovered_artists rows for the same artist (e.g., "Raveena" appears twice with different tracks) should be merged. Run a one-time migration to merge duplicates before enabling multi-track mode.

### 4B. One-Time Merge Migration

**Script:** `scripts/merge-duplicate-artists.ts`

For artists with the same name:
- Pick the oldest `discovered_artists` row as canonical
- Re-link all `campaign_claims` to the canonical ID
- Re-link all `artist_audits` to the canonical ID
- Merge `social_links` (deep merge JSONB)
- Delete duplicate `discovered_artists` rows
- Create artist_profiles for any without one

---

## Phase 5: Dashboard — Artist Profile View

### 5A. Artist Section in Dashboard

**MODIFY:** `app/dashboard/page.tsx`

When user is an artist (has claimed campaigns), show:

```
┌─ Artist Profile ──────────────────────────────────────┐
│ [Photo]  Artist Name          [Edit Profile]          │
│          Genre: Electronic, Ambient                   │
│          Social links: IG, TT, YT, Spotify           │
│                                                        │
│  ── Your Tracks ──                                     │
│  [Add new track]                                       │
│                                                        │
│  Track A     Cover  ·  3 subs  ·  50K views  ·  $10   │
│  Track B     Cover  ·  1 sub   ·  12K views  ·  $8    │
│  Track C     Cover  ·  0 subs  ·  0 views    ·  $5    │
│                                                        │
│  ── Embeddable Widget ──                               │
│  <iframe src="...">  [Copy]                           │
└────────────────────────────────────────────────────────┘
```

**Track management per artist:**
- Set per-track CPM rates
- Set per-track budgets
- Enable/disable individual tracks
- Add new track (with cover art, audio URL)

### 5B. Claim Flow Update

**MODIFY:** `app/claim/[code]/page.tsx`

After claiming, instead of just showing the campaign page, show:
1. "Your artist profile is ready"
2. "You have N tracks available for promotion"
3. Per-track CPM/budget settings
4. Embed widget code
5. "Go to your profile →" CTA

### 5C. Artist Profile Edit API

**NEW:** `app/api/artists/[slug]/route.ts` (PATCH)

Allows claimed artists to update:
- Bio text
- Social links
- Profile image
- Track CPM rates and budgets
- Add/remove tracks

---

## Phase 6: Programmatic SEO

### 6A. Genre Landing Pages

**NEW:** `app/browse/genre/[genre]/page.tsx`

```
/browse/genre/electronic
/browse/genre/hip-hop
/browse/genre/pop
/browse/genre/rock
/browse/genre/indie
/browse/genre/rnb
/browse/genre/jazz
/browse/genre/metal
/browse/genre/folk
/browse/genre/country
/browse/genre/ambient
/browse/genre/punk
/browse/genre/alternative
/browse/genre/experimental
/browse/genre/latin
```

Each page renders:
```
┌─────────────────────────────────────────────────────────┐
│ Genre Name (h1)                                        │
│ 200+ words of content about promoting this genre       │
│ (AI-generated, unique per page, optimized for SEO)     │
│                                                         │
│ N artists · M tracks available                         │
│                                                         │
│ Grid of artist cards (filtered by genre)               │
│                                                         │
│ [Page 1] [Page 2] [Page 3] ...                         │
│                                                         │
│ Related genres: [link] [link] [link]                    │
└─────────────────────────────────────────────────────────┘
```

**SEO optimization:**
- Unique h1 per genre: "Electronic Music Promotion — Find Artists & Campaigns"
- Meta description: "Browse [genre] artists promoting their music on Selah.fm. Create videos and earn per view. [N] tracks available for [genre] music."
- Schema: `CollectionPage` with genre keywords
- Sitemap entry in `/sitemap-genre.xml`
- Internal links to related genres + artist pages

### 6B. Sitemap Split

**MODIFY:** `app/sitemap.ts`

Current: single sitemap
New: sitemap index with:
```
/sitemap-static.xml     — Home, About, FAQ, Tools, etc.
/sitemap-campaigns.xml  — All campaign pages (/c/[slug])
/sitemap-artists.xml    — All artist pages (/artist/[slug])
/sitemap-blog.xml       — All blog posts (exists)
/sitemap-genre.xml      — All genre landing pages
```

Submit to Google Search Console.

### 6C. Browse Pagination

**MODIFY:** `app/browse/page.tsx` + `app/browse/BrowseClient.tsx`

Add `?page=N` support with:
- Unique meta title per page: "Artists on Selah.fm — Page 2 | Promote Music & Earn"
- Unique meta description per page
- `rel=next` / `rel=prev` for crawlers
- Server-rendered first page content for SEO

### 6D. Internal Linking Engine

When rendering any artist page or campaign page, auto-link to:
- 3 related genre pages (based on artist's genres)
- 3 related artists (same genre, different artist)
- 3 related blog posts (from blog pipeline)

Links are server-rendered in the HTML, not loaded via JS.

Implementation: helper function `getInternalLinks(artist, genre)` that queries DB for related content.

---

## Phase 7: Submission/Approval Flow

### 7A. Submission API Update

**MODIFY:** `app/api/submissions/route.ts`

Current: `submission.campaign_id` → `campaigns`
No change needed — submissions remain per-track (campaign_id).
The review page filters by campaign (track), which is already per-track.

**ADD:** `GET /api/submissions?artistId=X` — Get all submissions for an artist across all their tracks

### 7B. Review Page Update

**MODIFY:** `app/review/page.tsx`

Current: filter by campaign (track) dropdown
**Add option:** filter by artist — "All submissions for [Artist Name]"

Group submissions by track within the artist view:
```
┌─ Artist Name ─────────────────────────────────────────┐
│                                                        │
│ ┌─ Track A ──────────────────────────────────────────┐ │
│ │ Submission 1  [Approve] [Reject]                    │ │
│ │ Submission 2  [Approve] [Reject]                    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                        │
│ ┌─ Track B ──────────────────────────────────────────┐ │
│ │ Submission 3  [Approve] [Reject]                    │ │
│ └─────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### 7C. Submission Form

**MODIFY:** Components that render the submission form (currently per-campaign)

When the creator is on an artist profile page (not a campaign page):
- Show track picker dropdown: "Which track did you use?"
- Creator picks a track → submits video URL → stored with that campaign_id

Add `/api/submissions/create` endpoint that accepts `{ artist_id, track_id, content_url, platform }`

---

## Phase 8: Data Migration + Pipeline Setup

### 8A. One-Time Merge (from Phase 4)

Run the duplicate artist merge script before enabling multi-track mode.

### 8B. Artist Profile Backfill

For `discovered_artists` rows without `artist_profiles` rows:
```sql
INSERT INTO artist_profiles (artist_id, slug, created_at)
SELECT id, 
  LOWER(REGEXP_REPLACE(artist_name, '[^a-z0-9]+', '-', 'g')) || '-' || SUBSTRING(id::text, 1, 6),
  NOW()
FROM discovered_artists da
WHERE NOT EXISTS (SELECT 1 FROM artist_profiles ap WHERE ap.artist_id = da.id)
```

### 8C. Artist Slug Sanity

Some existing slugs are auto-generated IDs like `artist-709772`. For better SEO:
- Generate human-readable slugs: `sufjan-stevens` instead of `sufjan-stevens-c33e9f`
- Add unique suffix only on collision: `sufjan-stevens-2`
- Set up 301 redirects from old slugs to new slugs

### 8D. Pipeline Switch

Flip the outreach pipeline (`outreach-pipeline/route.ts`) to multi-track mode after the merge is complete.

---

## File Change Summary

| File | Action | What |
|------|--------|------|
| `app/artist/[slug]/page.tsx` | MODIFY | Add track catalog, embed CTA, SEO metadata overhaul |
| `app/artist/[slug]/embed/route.tsx` | NEW | Server-rendered iframe widget |
| `app/artist/page.tsx` | MODIFY | Link to new artist search with profile results |
| `app/api/artists/[slug]/route.ts` | NEW | GET artist+tracks, PATCH for claimed artists |
| `app/api/artists/route.ts` | NEW | LIST artists with filters, pagination |
| `app/browse/BrowseClient.tsx` | MODIFY | Add Artists tab, toggle, artist cards grid |
| `app/browse/page.tsx` | MODIFY | Server-rendered SEO content for artist tab |
| `app/browse/genre/[genre]/page.tsx` | NEW | Genre landing page grid |
| `app/c/[id]/page.tsx` | MODIFY | Add "View artist profile" link |
| `app/claim/[code]/page.tsx` | MODIFY | Add embed snippet + artist setup flow after claim |
| `app/dashboard/page.tsx` | MODIFY | Add artist profile section with track management |
| `app/review/page.tsx` | MODIFY | Add artist-filtered view, group by track |
| `app/sitemap.ts` | MODIFY | Split into index + 5 sub-sitemaps |
| `components/ArtistCard.tsx` | NEW | Reusable artist card component |
| `components/ArtistEmbed.tsx` | NEW | Embed snippet generator |
| `app/api/cron/outreach-pipeline/route.ts` | MODIFY | Multi-track mode: add campaigns to existing artists |
| `app/api/submissions/route.ts` | MODIFY | Add artistId filter parameter |
| `app/api/submissions/create/route.ts` | NEW | Accept artist_id + track selection from submission form |
| `lib/internal-links.ts` | NEW | Internal linking helper (related artists, genres, posts) |
| `scripts/merge-duplicate-artists.ts` | NEW | One-time merge of duplicate discovered_artists |

**Total: 21 files** (13 modified, 8 new)

---

## Execution Order

### Sprint 1 (Days 1-2): Foundation
1. Run duplicate artist merge + profile backfill
2. Build `/api/artists/[slug]` GET route
3. Build `/api/artists` LIST route with filters
4. Modify `/artist/[slug]/page.tsx` — add track catalog, SEO metadata

### Sprint 2 (Days 3-4): Distribution
5. Build embed widget route + iframe
6. Build `ArtistCard` component
7. Modify browse page with Artists tab + toggle
8. Build `ArtistEmbed` snippet + add to dashboard and claim page

### Sprint 3 (Days 5-6): Full Integration
9. Modify dashboard with artist section
10. Build genre landing pages
11. Build internal linking engine
12. Split sitemap + submit to GSC

### Sprint 4 (Days 7-8): Polish
13. Modify review page for artist-filtered view
14. Update submission form for track selection
15. Update pipeline for multi-track mode
16. Add embed CTA to campaign page (link to artist profile)

---

## Key Metrics After Ship

| Metric | Before | After (1 week) | After (1 month) |
|--------|--------|----------------|-----------------|
| Indexed artist pages | ~0 | 2,000+ | 2,000+ |
| Indexed genre pages | 0 | 15 | 15 |
| Embed widgets installed | 0 | 50+ (target) | 200+ (target) |
| Artist pages with >1 track | 1 | 50+ | 500+ |
| Organic search visits/day | ? | 100+ | 500+ |
| Artists with claimed profiles | 0 | 10+ | 50+ |
