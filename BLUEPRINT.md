# Selah.fm — Master Implementation Blueprint

**Date:** June 2, 2026
**Status:** Pre-execution audit — nothing built yet
**Scope:** Complete platform transformation from campaign-centric to artist-centric social hub
**Total:** 9 phases, 30+ files, ~2 weeks of work

---

## Table of Contents
1. [Research Findings](#research)
2. [Forum vs Comments Decision](#forum)
3. [Existing Infrastructure Audit](#audit)
4. [Complete Build List](#build-list)
5. [Edge Cases & Gotchas](#edge-cases)
6. [Execution Order](#execution)

---

## 1. Research Findings <a name="research"></a>

### Forum/Community Content & SEO

Research confirms that **forum-style user-generated content is a major SEO driver in 2026:**

- Google increasingly ranks forum/discussion content higher in SERPs (Search Engine Journal, 2025)
- Reddit threads consistently rank on page 1 for music-related queries
- "When fans talk about music, they use natural language. Search engines understand this language better today." (MusicianWebsiteBuilder)
- User-generated content creates "E-E-A-T" signals (Experience, Expertise, Authoritativeness, Trustworthiness)
- Fresh content from comments/forums triggers more frequent crawler re-visits

### Forum Decision <a name="forum"></a>

**Question:** Do we need a full forum (topics + replies) under each artist profile?

**Answer:** Not for v1. Start with **enhanced threaded comments**, which gives 80% of the SEO value with 20% of the complexity.

| Factor | Full Forum | Enhanced Comments (v1) |
|--------|-----------|----------------------|
| Unique URLs per topic | ✅ Many | ⚠️ One per artist |
| Fresh content velocity | ✅ High | ✅ High |
| Moderation burden | ❌ High | ✅ Low |
| Empty state problem | ❌ 2,158 empty forums | ✅ One comment section |
| Development time | 5-7 days | 1-2 days |
| User confusion | "Is this Reddit?" | "Makes sense" |

**Recommendation:** Build threaded comments on artist pages with sorting (newest, most liked) and replies. If engagement justifies it, add topic creation in v2 (the comment section becomes the "General" category).

---

## 2. Existing Infrastructure Audit <a name="audit"></a>

### ✅ Fully Built (No Work Needed)

| Feature | Files/Components | Notes |
|---------|-----------------|-------|
| **Direct Messaging** | `ChatWidget.tsx`, `MessageButton.tsx`, `app/messages/page.tsx`, `api/messages/route.ts` | Polling (15-30s), optimistic UI, unread badges, notification creation on send |
| **Ratings (1-5★)** | `RatingPrompt.tsx`, `RatingInput`, `RatingDisplay`, `api/ratings/route.ts` | Post-payout only, artist↔creator, unique per submission |
| **Notifications** | `NotificationBell.tsx`, `api/notifications` | 60s polling, mark read, type icons, link support |
| **Live Ticker** | `LiveTicker`, `live_ticker_events` table | Real-time feel on checkout |
| **Rate Limiting** | `lib/rate-limit.ts` | In-memory, IP/session-based, configurable window |
| **Artist Profiles** | `artist_profiles` table (2,039 rows), `/artist/[slug]` stats page | Needs repurposing for full profile |
| **Artist Search** | `/artist/` page, `api/artist/search` | Exists but limited |
| **Artist Metrics** | `lib/artist-metrics.ts` | Spotify, Deezer, YouTube, Instagram, TikTok scrapers |
| **Donation Flow** | `/checkout`, `campaign_donations` table, Stripe integration | Currently campaign-only, needs artist-level support |
| **Submission Flow** | `submissions` table, review page, payout | Per-campaign, needs artist-level filtering |
| **Auth** | Supabase SSR, Google OAuth, session management | Solid |

### ⚠️ Partially Built (Needs Modification)

| Feature | What Exists | What to Change |
|---------|------------|---------------|
| `/artist/[slug]/page.tsx` | Stats card only | Complete rewrite into full artist profile |
| `app/browse/BrowseClient.tsx` | Campaign grid only | Add Artists tab with toggle |
| `app/dashboard/page.tsx` | Campaign management | Add artist profile section + track management |
| `app/review/page.tsx` | Per-campaign filter | Add artist-grouped view |
| `app/claim/[code]/page.tsx` | Shows single campaign | Show artist profile + embed |
| `app/checkout/page.tsx` | Campaign donations only | Add `?artistId=X` support |
| `app/api/cron/outreach-pipeline/route.ts` | Skip on duplicate | Multi-track: add campaign to existing artist |
| `app/sitemap.ts` | Single sitemap | Split into index + sub-sitemaps |

### ❌ Not Built (Full Construction)

| Feature | Files Needed |
|---------|-------------|
| Page comments | `page_comments` table, `api/comments/route.ts`, `PageComments.tsx` component |
| Comment reactions | Add `reactions` column to `page_comments` or separate table |
| Video reactions (❤️) | `submission_reactions` table, `api/submissions/[id]/react/route.ts`, `SubmissionReactions.tsx` |
| Activity feed | `activity_events` table, `api/artists/[id]/activity/route.ts`, `ActivityFeed.tsx` |
| Artist API (GET/PATCH) | `api/artists/[slug]/route.ts`, `api/artists/route.ts` |
| Artist embed widget | `app/artist/[slug]/embed/route.tsx`, `ArtistEmbed.tsx` |
| Artist card component | `ArtistCard.tsx` |
| Genre landing pages | `app/browse/genre/[genre]/page.tsx` (×15) |
| Claim flow (artist-level) | Modified `app/claim/[code]/page.tsx` |
| Multi-track pipeline | Modified `outreach-pipeline/route.ts` |
| LLMO content generation | `lib/artist-content.ts` |

---

## 3. Complete Build List <a name="build-list"></a>

### Phase 0: Database Migrations (Sprint 0)

#### New Tables

```sql
-- 0A. Page comments (forum-like threads on artist pages)
CREATE TABLE page_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL CHECK (page_type IN ('artist', 'campaign')),
  page_id UUID NOT NULL,
  parent_id UUID REFERENCES page_comments(id) ON DELETE CASCADE,  -- threaded replies
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,  -- display name or "Anonymous"
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 1000),
  likes_count INTEGER DEFAULT 0,  -- denormalized for performance
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_page_comments_page ON page_comments(page_type, page_id, created_at DESC);
CREATE INDEX idx_page_comments_parent ON page_comments(parent_id);

-- 0B. Comment likes (who liked which comment)
CREATE TABLE comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES page_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (comment_id, user_id)
);

-- 0C. Submission reactions (fan ❤️ on creator videos)
CREATE TABLE submission_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reaction_type TEXT NOT NULL DEFAULT 'heart' CHECK (reaction_type IN ('heart', 'fire', 'clap', 'star')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (submission_id, user_id, reaction_type)
);
CREATE INDEX idx_sub_reactions_sub ON submission_reactions(submission_id);

-- 0D. Activity events (aggregated hype feed per artist)
CREATE TABLE activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES discovered_artists(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'donation', 'submission', 'comment', 'reaction_batch', 'rating', 'artist_claimed'
  )),
  actor_type TEXT NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'anonymous')),
  actor_name TEXT,  -- display name
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,  -- human-readable: "donated $25"
  metadata JSONB DEFAULT '{}',  -- { amount_cents, track_name, reaction_count }
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_activity_artist ON activity_events(artist_id, created_at DESC);
CREATE INDEX idx_activity_created ON activity_events(created_at DESC);

-- 0E. Add reactions_count to submissions (denormalized counter)
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS reactions_count INTEGER DEFAULT 0;
CREATE INDEX idx_submissions_reactions ON submissions(reactions_count DESC);

-- 0F. Add likes_count to page_comments (done in table creation above)

-- 0G. Artist slug sanity: add unique constraint
-- Note: some existing slugs are like 'artist-709772' — we'll regenerate
ALTER TABLE artist_profiles ADD COLUMN IF NOT EXISTS slug_clean TEXT;
CREATE UNIQUE INDEX idx_artist_slug_clean ON artist_profiles(slug_clean);
```

#### Data Migrations

```sql
-- 0H. Merge duplicate discovered_artists by artist_name
-- For artists with the same name, merge campaign_claims and artist_audits
-- into the oldest ID, then delete duplicates
-- SEE: scripts/merge-duplicate-artists.sql

-- 0I. Backfill artist_profiles for discovered_artists without one
INSERT INTO artist_profiles (artist_id, slug, created_at)
SELECT da.id,
  LOWER(REGEXP_REPLACE(da.artist_name, '[^a-z0-9]+', '-', 'g')) || '-' || SUBSTRING(da.id::text, 1, 6),
  NOW()
FROM discovered_artists da
WHERE NOT EXISTS (SELECT 1 FROM artist_profiles ap WHERE ap.artist_id = da.id);

-- 0J. Generate clean slugs for existing artist_profiles
UPDATE artist_profiles SET
  slug_clean = LOWER(REGEXP_REPLACE(
    (SELECT artist_name FROM discovered_artists WHERE id = artist_profiles.artist_id),
    '[^a-z0-9]+', '-', 'g'
  ))
WHERE slug_clean IS NULL;
-- Handle collisions by appending -2, -3, etc.
```

### Phase 1: API Routes (Sprint 1-2)

#### New Routes

| # | Route | Method | Purpose | Rate Limit |
|---|-------|--------|---------|-----------|
| 1A | `api/comments` | GET | List comments for a page (paginated, filtered by pageType+pageId) | 60/min |
| 1B | `api/comments` | POST | Create comment (`{ pageType, pageId, content, parentId? }`) | 10/min |
| 1C | `api/comments/[id]` | DELETE | Delete own comment (or admin) | 30/min |
| 1D | `api/comments/[id]/like` | POST | Toggle like on comment | 30/min |
| 1E | `api/submissions/[id]/react` | POST | Toggle reaction on submission | 30/min |
| 1F | `api/submissions/[id]/reactions` | GET | Get reaction counts | 60/min |
| 1G | `api/artists/[id]/activity` | GET | Get activity feed (paginated) | 60/min |
| 1H | `api/artists/[slug]` | GET | Full artist profile with tracks + social stats | 60/min |
| 1I | `api/artists/[slug]` | PATCH | Update artist profile (claimed artists only) | 10/min |
| 1J | `api/artists` | GET | List artists (paginated, filterable by genre/search/sort) | 60/min |

**1A: GET /api/comments?pageType=artist&pageId=X&sort=newest&limit=20&offset=0**
- Returns: `{ comments: [{ id, author_name, content, likes_count, created_at, replies: [...] }], total }`
- Sorts: `newest` (default), `oldest`, `most_liked`
- Authorization: None required for read
- Cache: 30s browser cache, revalidate on new comment

**1B: POST /api/comments**
- Body: `{ pageType, pageId, content, parentId?, authorName? }`
- Validation: content 1-1000 chars, pageType in ['artist', 'campaign']
- Authorization: Optional (anonymous allowed with `authorName`)
- Notifications: If artist.comment → notify artist (if claimed). If parent reply → notify parent author
- Activity: Create activity_event for artist
- Rate limit: 10 per minute per IP (stricter — prevents spam)

**1C: DELETE /api/comments/[id]**
- Authorization: Comment author OR admin
- Cascade: Deletes child replies (via ON DELETE CASCADE)

**1D: POST /api/comments/[id]/like**
- Body: none (toggle — like if not liked, unlike if liked)
- Authorization: Optional (anonymous not allowed for likes)
- Returns: `{ liked: boolean, likes_count: number }`

**1E: POST /api/submissions/[id]/react**
- Body: `{ type: 'heart' }` (start with only 'heart')
- Toggle: submit again = remove reaction
- Authorization: Optional (anonymous not allowed)
- Activity: Only creates activity event every 5 reactions (batch to avoid spam)
- Returns: `{ reactions: { heart: number } }`

**1F: GET /api/submissions/[id]/reactions**
- Returns: `{ heart: 24, fire: 8, clap: 3 }`

**1G: GET /api/artists/[id]/activity?limit=20&before=X**
- Returns last N activity events for the artist
- Cursor-based pagination (using created_at)
- Cache: 60s server-side, revalidate on new event

**1H: GET /api/artists/[slug]**
- Returns: `{ artist: {...}, tracks: [...], stats: { total_donations, total_views, total_submissions, comment_count }, recent_activity: [...] }`
- Combines data from: discovered_artists, artist_profiles, campaigns, campaign_donations, submissions, activity_events
- Cache: 30s CDN cache

**1I: PATCH /api/artists/[slug]**
- Body: `{ bio?, social_links?, profile_image?, tracks: [{ id, cpm_rate_cents, enabled }] }`
- Authorization: Artist must have claimed this profile
- Validation: Must own the associated campaigns

**1J: GET /api/artists?genre=electronic&sort=popular&page=1&limit=20**
- Returns: `{ artists: [...], total, page, limit }`
- Sorts: `popular` (track_count + monthly_listeners), `newest`, `name`, `listeners`
- Filters: genre (exact match), search (ILIKE on artist_name)
- No auth required

### Phase 2: UI Components (Sprint 2-3)

#### New Components

| # | Component | Purpose | Props |
|---|-----------|---------|-------|
| 2A | `PageComments.tsx` | Threaded comment section | `{ pageType, pageId }` |
| 2B | `CommentThread.tsx` | Single comment + replies | `{ comment, depth }` |
| 2C | `CommentForm.tsx` | Write a comment | `{ pageType, pageId, parentId?, onSubmitted }` |
| 2D | `SubmissionReactions.tsx` | ❤️🔥👏 buttons on videos | `{ submissionId, initialCounts }` |
| 2E | `ActivityFeed.tsx` | Live activity stream | `{ artistId }` |
| 2F | `ActivityEvent.tsx` | Single activity item | `{ event }` |
| 2G | `ArtistCard.tsx` | Reusable artist card | `{ artist }` |
| 2H | `ArtistHeader.tsx` | Artist page hero section | `{ artist }` |
| 2I | `TrackCatalog.tsx` | Grid of tracks with submit | `{ tracks, artistSlug }` |
| 2J | `ArtistEmbed.tsx` | Embed snippet generator | `{ artistSlug }` |

**2A: PageComments.tsx**
- States: loading, empty ("No comments yet. Be the first!"), error, populated
- Loading: Skeleton placeholders (3 rows)
- Empty: Friendly message + CTA to comment
- Error: "Couldn't load comments. [Retry]"
- Auth states: Anonymous user → "Sign in to comment" prompt. Logged in → show form
- Sort controls: Newest, Most liked
- Pagination: "Load more comments" button (20 per page)
- Real-time: Poll for new comments every 60s (or on page focus)

**2D: SubmissionReactions.tsx**
- States: loading (skeleton), loaded, error (hide reactions silently)
- Interactive: Heart button with count, click to toggle
- Optimistic update: Increment/decrement immediately, revert on error
- Auth: Anonymous → show count but button opens auth modal
- Animation: Scale bounce on click

**2E: ActivityFeed.tsx**
- States: loading (skeleton), empty ("No activity yet — be the first to support this artist!"), populated
- Empty state is shown for artists with zero activity
- Scrollable container with max-height, fade gradient at bottom
- Auto-poll: every 30s for new events
- Event types render differently:
  - `donation`: ❤️ Alex donated $25
  - `submission`: 🎬 Sam made a video
  - `comment`: 💬 Jordan commented
  - `reaction_batch`: ❤️ 5 people loved Sam's video
  - `rating`: ⭐ Mike rated 5★

### Phase 3: Pages (Sprint 3-4)

#### New/Modified Pages

| # | Page | Action | Purpose |
|---|------|--------|---------|
| 3A | `/artist/[slug]` | **REWRITE** | Full artist social profile |
| 3B | `/artist/[slug]/embed` | **NEW** | Embed widget |
| 3C | `/browse` | **MODIFY** | Add Artists tab |
| 3D | `/browse/genre/[genre]` | **NEW** | 15 SEO landing pages |
| 3E | `/c/[id]` | **MODIFY** | Add artist link + reactions + comments |
| 3F | `/checkout` | **MODIFY** | Support artist-level donations |
| 3G | `/messages` | **NO CHANGE** | Already built |
| 3H | `/dashboard` | **MODIFY** | Artist profile section |
| 3I | `/claim/[code]` | **MODIFY** | Artist profile claim |
| 3J | `/review` | **MODIFY** | Artist-grouped view |
| 3K | `/sitemap.ts` | **MODIFY** | Split into index |

**3A: `/artist/[slug]` — Complete Page Layout**

```
┌─ HEADER ───────────────────────────────────────────────┐
│ [Cover/Photo]                                           │
│ Artist Name         [Genre] [Genre] [Genre]             │
│ 🎵 1.2M monthly listeners · 📍 City, Country            │
│ Social: [IG] [TT] [YT] [Spotify] [Bandcamp] [Website]  │
│                                                         │
│ ┌──────────────────┐  ┌──────────────────┐             │
│ │ ❤️ Support      │  │ 🎬 Make a Video │             │
│ │ [Donate →]      │  │ [Start →]       │             │
│ └──────────────────┘  └──────────────────┘             │
├─ 🔥 ACTIVITY ──────────────────────────────────────────┤
│ Alex donated $25 · 2m ago                              │
│ Sam made a video · 15m ago                             │
│ Jordan commented · 1h ago                              │
│ 5 people loved Sam's video · 2h ago                    │
├─ TRACKS ───────────────────────────────────────────────┤
│ [Track A  $10/1M  Submit]  [Track B  $8/1M  Submit]   │
│ [Track C  $5/1M   Submit]                             │
├─ 🎬 VIDEOS ────────────────────────────────────────────┤
│ [Thumbnail] [Thumbnail] [Thumbnail]                     │
│ 24K · ❤️45     12K · ❤️28     8K · ❤️15               │
├─ ABOUT ────────────────────────────────────────────────┤
│ Bio paragraph for SEO...                                │
├─ 💬 COMMENTS ──────────────────────────────────────────┤
│ Alex: this is fire 🔥 · 2h ago                         │
│ └─ Artist: thank you! 🙏 · 1h ago                     │
│ Sam: been following since day 1 · 1d ago               │
│ [Write a comment...]                          [Send]   │
├─ FAQ ──────────────────────────────────────────────────┤
│ Q: How do I support [Artist]?                          │
│ A: Donate through Selah.fm...                          │
│                                                         │
│ 🔗 Embed this artist on your site: <iframe src="...">  │
│ [Claim this page] (small, footer)                       │
└─────────────────────────────────────────────────────────┘
```

**SEO metadata for 3A:**
- Title: `"[Artist Name] — Music Promotion & Fan Community | Selah.fm"`
- Description: `"Support [Artist Name] by donating, making videos, or joining the fan community. [N] tracks available. [Genre] artist with [X] monthly listeners."`
- Schema: MusicGroup, MusicRecording[], Product, VideoObject, FAQPage, BreadcrumbList
- Keywords: artist name, genre, track names, "support [artist]", "[artist] community"

**3D: Genre Pages — `/browse/genre/[genre]`**
- 15 pages: electronic, hip-hop, pop, rock, indie, r&b, jazz, metal, folk, country, ambient, punk, alternative, experimental, latin
- Each has: 300+ word SEO description (generated via DeepSeek), artist grid, related genres, pagination
- Schema: CollectionPage
- Meta: `"Browse [genre] artists on Selah.fm — Make videos, earn per view, and support your favorite [genre] musicians."`

### Phase 4: Pipeline Update

#### 4A: Multi-Track Discovery

**File:** `app/api/cron/outreach-pipeline/route.ts`

**Current behavior:**
```javascript
// Skip if artist already exists
const existing = await sql`SELECT id FROM discovered_artists WHERE artist_name = ${a.artist_name}`;
if (existing.length > 0) continue;  // ← LOSES THE TRACK
```

**New behavior:**
```javascript
// Check if artist exists
const existing = await sql`SELECT id FROM discovered_artists WHERE artist_name = ${a.artist_name}`;
if (existing.length > 0) {
  // Artist exists — add as new track/campaign
  CREATE campaign with artist_id = existing[0].id
  CREATE campaign_claim linking to existing[0].id
  // DON'T skip — track is added
} else {
  // New artist — full insert
  INSERT discovered_artist
  INSERT artist_profile
  CREATE campaign + claim
}
```

**Edge case:** If artist_name is "The Beatles" and another source finds "the beatles" — case-insensitive matching needed.

### Phase 5: Moderation & Anti-Spam

| # | Feature | Implementation |
|---|---------|---------------|
| 5A | Comment rate limit | 10 comments/min per IP (via rate-limit.ts) |
| 5B | Reaction rate limit | 30 reactions/min per user |
| 5C | Content filtering | Block common spam patterns (URLs in comments? allowed? block promotional URLs) |
| 5D | Report button | "Report" on comments (+ flag in page_comments table) |
| 5E | Admin moderation | Dashboard to view flagged comments, delete/hide |
| 5F | Email verification gate | Only verified users can comment (optional — reduces spam at cost of engagement) |

**Decision:** Allow anonymous comments (no auth required) but with:
- Rate limit of 10/min per IP
- Required `author_name` (min 2 chars)
- Disposable email check if email provided
- Akismet-style spam check on content (basic: block known spam patterns)

### Phase 6: Notifications Integration

| Event | Notification | Channel |
|-------|-------------|---------|
| New comment on artist page | "New comment from {name} on your page" | In-app + email (if claimed) |
| Reply to comment | "{name} replied to your comment" | In-app |
| Video reaction batch | "Your video got 10 ❤️ reactions!" | In-app |
| New donation | "{name} donated ${amount}!" | In-app + email |
| New submission | "{name} submitted a video for {track}" | In-app + email |

### Phase 7: Performance Considerations

| # | Concern | Solution |
|---|---------|----------|
| 7A | Artist page has 5+ DB queries | Single query with JOINs + Redis cache (or in-memory cache for MVP) |
| 7B | Activity feed grows unbounded | Archive events older than 30 days to `activity_events_archive` |
| 7C | 2,000+ artist sitemap entries | Generate dynamically, cache for 24h, split into chunks of 500 |
| 7D | Comment count on 2,000+ pages | Denormalize `comment_count` on artist_profiles, update on new comment |
| 7E | Submission reaction counts | Denormalize `reactions_count` on submissions, update via trigger |
| 7F | Embed widget iframe performance | Server-render HTML, 1h Cache-Control header, 10KB max size |
| 7G | Image loading on artist grid | Use `loading="lazy"`, low-quality placeholders, Next.js Image component |

### Phase 8: Edge Cases & Gotchas <a name="edge-cases"></a>

#### Data Edge Cases

| # | Scenario | Handling |
|---|----------|----------|
| 8A | Two artists with same name (e.g., "Katie" × 10) | Slug collision: append -2, -3. Match by Spotify ID first, then name |
| 8B | Artist has zero tracks (discovered but no campaign) | Show "No tracks yet — check back soon" with "Notify me" button |
| 8C | Artist has 50+ tracks | Paginate track catalog (20 per page) |
| 8D | Artist profile image is missing | Gradient fallback with first letter of name (like GitHub) |
| 8E | Campaign slug changes (artist renames) | 301 redirect from old slug to new slug, update sitemap |
| 8F | Donation to an artist with no campaigns | Create a "General Support" pseudo-campaign, or hold in escrow until claimed |
| 8G | Comment on a deleted artist page | Return 404, comment deletion cascaded via FK |
| 8H | Submission reactions after submission deleted | Cascade delete via FK |
| 8I | Artist claims page, then unclaims | Keep profile, remove edit access, keep donations/submissions |

#### UX Edge Cases

| # | Scenario | Handling |
|---|----------|----------|
| 8J | User not logged in, clicks ❤️ on video | Open auth modal, after auth re-apply reaction |
| 8K | User not logged in, clicks "Write a comment" | Focus textarea, show "Sign in to comment" overlay |
| 8L | Empty activity feed | "No activity yet. Be the first to support this artist!" |
| 8M | Empty comments | "No comments yet. Start the conversation!" |
| 8N | Empty tracks | "This artist hasn't added tracks yet. Check back soon." |
| 8O | Network error on comment submit | Show error toast, keep comment text in textarea |
| 8P | Network error on reaction | Revert optimistic update, show error toast |
| 8Q | Very long artist name (50+ chars) | truncate with ellipsis in cards, full in h1 |
| 8R | Very long comment (1000+ chars) | Enforce hard limit in API + UI character counter |
| 8S | Rapid-fire commenting (spam) | Rate limit + disable button on submit, re-enable after response |

#### Security Edge Cases

| # | Scenario | Handling |
|---|----------|----------|
| 8T | XSS in comment content | Sanitize all output: strip `<script>`, allow only `<b>`, `<i>`, `<em>` |
| 8U | SQL injection in search params | Parameterized queries everywhere (already done) |
| 8V | CSRF on comment/reaction endpoints | Already protected by SameSite cookies |
| 8W | Rate limit bypass via IP rotation | Rate limit on both IP AND session |
| 8X | Fake donations (card not charged) | Stripe webhook confirms payment before recording donation |
| 8Y | Bot scraping artist pages (2000+ pages) | Rate limit to 60 requests/min per IP for API, CDN cache for static |

#### SEO Edge Cases

| # | Scenario | Handling |
|---|----------|----------|
| 8Z | Index bloat from 2,000+ artist pages with thin content | Noindex pages with zero tracks, zero activity. Use `<meta robots="noindex">` |
| 8AA | Duplicate content from artist page + campaign page | Canonical URL to artist page, campaign page links to artist |
| 8AB | Sitemap too large (50,000+ URLs) | Split into sub-sitemaps of 500 URLs each, sitemap index |
| 8AC | Crawl budget wasted on low-quality pages | Artists with no activity → noindex. Artists with activity → index. |
| 8AD | LLM crawler rate limiting | Serve structured data from CDN cache, reduce server load |

---

## 4. File Change Summary <a name="file-summary"></a>

### New Files (19)

```
Database:
  scripts/migrations/001_social_tables.sql     — page_comments, comment_likes, submission_reactions, activity_events, +indexes
  scripts/migrations/002_artist_merge.sql       — duplicate merge + profile backfill

API Routes:
  app/api/comments/route.ts                     — POST/GET comments
  app/api/comments/[id]/route.ts                — DELETE comment
  app/api/comments/[id]/like/route.ts           — POST toggle like
  app/api/submissions/[id]/react/route.ts       — POST toggle reaction
  app/api/submissions/[id]/reactions/route.ts   — GET reaction counts
  app/api/artists/[id]/activity/route.ts        — GET activity feed
  app/api/artists/[slug]/route.ts               — GET/PATCH artist profile
  app/api/artists/route.ts                      — GET list artists

Pages:
  app/artist/[slug]/embed/route.tsx             — Embed widget
  app/browse/genre/[genre]/page.tsx             — 15 genre pages (catch-all dynamic route)

Components:
  components/PageComments.tsx                   — Comment section with threading
  components/CommentThread.tsx                  — Single comment + replies
  components/CommentForm.tsx                    — Comment input form
  components/SubmissionReactions.tsx            — ❤️ reaction buttons
  components/ActivityFeed.tsx                   — Activity stream
  components/ActivityEvent.tsx                  — Single activity item
  components/ArtistCard.tsx                     — Reusable card
  components/ArtistHeader.tsx                   — Artist hero section
  components/TrackCatalog.tsx                   — Track grid with submit
  components/ArtistEmbed.tsx                    — Embed snippet generator

Libraries:
  lib/artist-content.ts                          — LLMO content generation
  lib/internal-links.ts                         — Internal linking engine
```

### Modified Files (19)

```
Pages:
  app/artist/[slug]/page.tsx                    — COMPLETE REWRITE: artist social profile hub
  app/browse/page.tsx                           — Server-rendered SEO content for artist tab
  app/browse/BrowseClient.tsx                   — Add Artists tab toggle + artist cards
  app/c/[id]/page.tsx                           — Add "View artist profile" link + reactions/comments
  app/checkout/page.tsx                         — Support ?type=donation&artistId=X
  app/dashboard/page.tsx                        — Add artist profile section + track management
  app/claim/[code]/page.tsx                     — Show artist profile + embed after claim
  app/review/page.tsx                           — Add artist-grouped submission view
  app/sitemap.ts                                — Split into index + 5 sub-sitemaps

API Routes:
  app/api/submissions/route.ts                  — Add artistId filter parameter
  app/api/submissions/create/route.ts           — Accept artistId + trackId from artist page
  app/api/notifications/route.ts                — Wire new event types (comment, reaction, activity)
  app/api/cron/outreach-pipeline/route.ts       — Multi-track mode

Components:
  components/TopNav.tsx                         — Surface message/notification icons (already done)

Libraries:
  lib/internal-links.ts                         — NEW: linking engine
  lib/artist-content.ts                         — NEW: LLMO content generation

Config:
  railway.json                                  — May need env vars for new features
```

**Total: 38 files** (19 new, 19 modified)

---

## 5. Execution Order <a name="execution"></a>

```
Week 1:
  Mon:  Phase 0 (DB migrations + data backfill) + Phase 1A-1C (comments API)
  Tue:  Phase 1D-1J (reactions, activity, artists API)
  Wed:  Phase 2A-2D (comment UI + reaction UI)
  Thu:  Phase 2E-2J (activity feed UI + artist components)
  Fri:  Phase 3A (artist profile page — THE big one)

Week 2:
  Mon:  Phase 3B-3D (embed + browse + genre pages)
  Tue:  Phase 3E-3F (campaign page updates + checkout)
  Wed:  Phase 3G-3K (dashboard + claim + review + sitemap)
  Thu:  Phase 4 (multi-track pipeline) + Phase 5 (moderation)
  Fri:  Phase 6-7 (notifications + performance) + Phase 8 (edge cases)
```

---

## 6. Acceptance Criteria

Before marking any phase complete:
- [ ] TypeScript compiles with zero errors (`npx tsc --noEmit`)
- [ ] All states covered: loading, empty, error, populated
- [ ] Rate limiting applied to all new POST endpoints
- [ ] Notifications wired for all new social events
- [ ] Mobile-responsive (check: 375px, 768px, 1024px)
- [ ] SEO metadata correct (title, description, schema)
- [ ] Edge cases documented and handled
- [ ] Database indexes created for all new queries
