<!--
================================================================================
ARCHIVED — See SELAH.md for current source of truth.

This file is preserved for historical reference only. All actionable content
has been consolidated into SELAH.md (the living document).
================================================================================
-->

# Selah.fm Artist Pages — SEO + LLMO Execution Plan
**Date:** 2026-06-03
**Goal:** Top 0.01% worldwide — artist pages that are both SEO goldmines and LLM-citation magnets
**Current score:** SEO 6/10 · LLMO 3/10
**Target score:** SEO 9.5/10 · LLMO 9/10

---

## The Thesis

Artist pages are potentially Selah.fm's highest-value SEO asset:
- 2,000+ unique, server-rendered pages
- Each page targets: `[artist name] music promotion`, `support [artist name]`, `[artist name] TikTok`
- Combined with campaign pages (`/c/[slug]`): 4,500+ indexable pages
- Each page is a landing page for BOTH search queries AND LLM citations

The current gap: pages have near-zero body content, generic metadata, and may be returning 404s.

---

## Phase 0: Fix Critical Issues (1 hour)

### 0.1 — Debug Artist Page 404s

**Problem:** Live test of `selah.fm/artist/hildegunn-iseth` returned "Artist not found" despite the artist having a campaign at `/c/hildegunn-iseth-meandering-faae`.

**Investigation needed:**
1. Check if `hildegunn-iseth` exists in `artist_profiles.slug`
2. Check if this artist's ID exists in `discovered_artists`
3. Check if the campaign_claims link works correctly
4. Add a fallback query that searches `discovered_artists.artist_name` when `artist_profiles.slug` returns 0 rows

**Code change in `app/artist/[slug]/page.tsx`:**
```typescript
// After the main query returns null, try fallback:
if (!artist) {
  // Try finding by artist name (slug might match artist_name slugified)
  const slugName = slug.replace(/-/g, ' ');
  [artist] = await sql`
    SELECT ... FROM discovered_artists da
    LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
    WHERE LOWER(da.artist_name) LIKE ${'%' + slugName + '%'}
    ORDER BY da.monthly_listeners DESC NULLS LAST
    LIMIT 1
  `;
}
// Also log 404s for monitoring
if (!artist) {
  console.error(`[ARTIST 404] No artist found for slug: ${slug}`);
}
```

### 0.2 — Fix Sitemap lastmod Type Error

**File:** `app/sitemap.ts` ~line 77

**Current (broken):**
```sql
MAX(GREATEST(at.updated_at, da.updated_at, COALESCE(da.comment_count, 0))) as lastmod
```

**Fix:**
```sql
MAX(GREATEST(at.updated_at, da.updated_at)) as lastmod
```

`da.comment_count` is an integer, not a timestamp. Including it in `GREATEST` with date types causes a type error or NULL result. Remove it — `at.updated_at` and `da.updated_at` are sufficient for freshness signals.

### 0.3 — Fix Orphaned ArtistCardClient.tsx

**Problem:** 439-line component `app/artist/[slug]/ArtistCardClient.tsx` defines `ArtistCardClient` (a metrics dashboard page) but is not imported by any page.

**Options:**
- **Option A:** Delete it (if the metrics dashboard is not needed)
- **Option B:** Export as a named component and import into the artist page as a "Stats" section
- **Option C:** Wire in as a route: create `app/artist/[slug]/card/page.tsx`

**Recommendation:** Option B — extract the `MetricCard` grid and `useCountUp` hook, integrate into `ArtistProfileClient.tsx` as a "Live Stats" section. This surfaces the rich streaming data (followers, streams per platform) that's currently hidden.

---

## Phase 1: SEO Foundation (2 hours)

### 1.1 — Enrich Meta Descriptions

**File:** `app/artist/[slug]/page.tsx` — `generateMetadata()`

**Current:**
```typescript
const desc = `Support ${name} on Selah.fm. ${trackLabel} available. ${genres.slice(0, 2).join(', ')} artist. Donate, make videos, and earn per view.`;
```

**New (keyword-rich, includes track name, CPM, listeners):**
```typescript
const topTrack = tracks[0]?.track_title || '';
const topCpm = tracks[0]?.cpm_rate_cents ? (tracks[0].cpm_rate_cents / 100).toFixed(2) : null;
const listenerStr = monthlyListeners > 0
  ? `${monthlyListeners >= 1000 ? (monthlyListeners / 1000).toFixed(1) + 'K' : monthlyListeners} monthly listeners`
  : '';

const desc = `Support ${name} on Selah.fm. ${trackLabel}${topTrack ? ` including "${topTrack}"` : ''}${listenerStr ? `. ${listenerStr}` : ''}${topCpm ? `. Earn $${(parseFloat(topCpm) * 1000).toFixed(0)} per 1M views` : ''}. ${genres.slice(0, 2).join(' / ')} artist. Donate, create content, and earn per verified view.`;
```

**Impact:** 158 vs 160 chars but keyword density increases from ~3 to ~10+ relevant keywords. Each artist page now has a UNIQUE meta description.

### 1.2 — Add description + aggregateRating to MusicGroup Schema

**File:** `app/artist/[slug]/page.tsx`

**Add to the MusicGroup node:**
```typescript
{
  '@type': 'MusicGroup',
  name: artist.artist_name,
  description: (bio || `Independent ${genres.slice(0, 2).join(' and ')} artist on Selah.fm`).slice(0, 200),
  genre: artist.genres?.join(', ') || undefined,
  image: artist.spotify_image_url || undefined,
  identifier: artist.spotify_id ? `spotify:${artist.spotify_id}` : undefined,
  ...(supporterCount > 0 ? {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Math.min(5, Math.max(1, Math.round((supporterCount / 10) * 10) / 10)), // scale to 1-5
      bestRating: 5,
      ratingCount: supporterCount,
      reviewCount: supporterCount,
    }
  } : {}),
}
```

**Impact:** Knowledge Panel eligibility + star ratings in SERPs.

### 1.3 — Make FAQPage Schema Dynamic

**File:** `app/artist/[slug]/page.tsx` — JSON-LD section

**Current:** 2 hardcoded questions for all 2,000+ artists.

**New approach:**
```typescript
// Dynamic FAQ generation
const faqQuestions = [
  {
    '@type': 'Question',
    name: `How do I support ${artist.artist_name} on Selah.fm?`,
    acceptedAnswer: {
      '@type': 'Answer',
      text: `Donate to ${artist.artist_name}'s campaign on Selah.fm. Your donation funds promotion of their music, and creators earn per verified view for making videos featuring their tracks. ${genres.slice(0, 2).join(' and ')} artist — support their next release.`,
    },
  },
  {
    '@type': 'Question',
    name: `How can creators earn money making videos for ${artist.artist_name}?`,
    acceptedAnswer: {
      '@type': 'Answer',
      text: `Pick a track from ${artist.artist_name}'s catalog, create a short video on TikTok, Instagram Reels, or YouTube Shorts featuring the official audio, submit it, and earn ${topCpm ? `$${(parseFloat(topCpm) * 1000).toFixed(0)} per 1M` : 'per'} verified views. No upfront cost for creators.`,
    },
  },
  {
    '@type': 'Question',
    name: `What genre is ${artist.artist_name}?`,
    acceptedAnswer: {
      '@type': 'Answer',
      text: `${artist.artist_name} creates ${genres.slice(0, 3).join(', ')} music. ${monthlyListeners > 0 ? `They have ${monthlyListeners >= 1000 ? (monthlyListeners / 1000).toFixed(1) + 'K' : monthlyListeners} monthly listeners on Spotify.` : ''}`,
    },
  },
];

// Add 2 more genre-specific questions
if (genres.length > 0) {
  const genreTips: Record<string, { q: string; a: string }[]> = {
    electronic: [{ q: `Where can I listen to ${artist.artist_name}'s electronic music?`, a: `Stream ${artist.artist_name}'s electronic tracks on Spotify, Apple Music, and YouTube. Check their Selah.fm profile for direct links to all platforms.` }],
    'hip-hop': [{ q: `Is ${artist.artist_name} looking for video creators?`, a: `Yes! ${artist.artist_name} is accepting video submissions on Selah.fm. Creators can submit TikTok, Reels, and YouTube Shorts featuring their tracks and earn per verified view.` }],
    // ... more genres
  };
  for (const genre of genres) {
    const tips = genreTips[genre.toLowerCase()];
    if (tips) faqQuestions.push(...tips.map(t => ({ '@type': 'Question', ...t, acceptedAnswer: { '@type': 'Answer', text: t.a } })));
  }
}
```

**Impact:** 4-6 unique, artist-specific FAQ items per page. FAQ rich results in Google. LLM-citable Q&A pairs.

---

## Phase 2: LLMO Content (2 hours)

### 2.1 — Wire Up AI Bios

**File:** `app/api/cron/dispatcher/route.ts`

Add bio generation cron at 00:00 UTC:
```typescript
// Add to dispatcher switch
case 'generate-bios':
  const { batchGenerateBios } = await import('@/lib/artist-content');
  return NextResponse.json(await batchGenerateBios(100)); // 100 per night
```

**Also add on-demand generation** in `app/artist/[slug]/page.tsx`:
```typescript
// After fetching artist data, if bio is empty and artist has tracks, trigger async generation
if (!bio && tracks.length > 0) {
  // Fire-and-forget: don't block the page render
  generateArtistBio(name, genres, listeners, tracks.length, '').then(({ bio: newBio }) => {
    if (newBio) {
      sql`INSERT INTO artist_audits (discovered_artist_id, artist_bio, audited_at)
          VALUES (${artist.id}, ${newBio}, NOW())
          ON CONFLICT (discovered_artist_id) DO UPDATE SET artist_bio = ${newBio}, audited_at = NOW()`.catch(() => {});
    }
  }).catch(() => {});
}
```

**Impact:** Every artist page served to a user triggers bio generation. After one pass through all 2,000+ artists, every page has a unique 80-150 word bio. Cost: ~$140 one-time DeepSeek API.

### 2.2 — Add Inline Q&A (LLM Citation Hooks)

**File:** `app/artist/[slug]/ArtistProfileClient.tsx`

Add visible Q&A blocks to the page content (not just schema):

```tsx
{/* Quick facts — LLM-friendly data block */}
<section className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5">
  <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
    <Sparkles size={14} className="text-muted-foreground" />
    Quick facts about {name}
  </h2>
  <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
    {[
      { label: 'Genre', value: genres.slice(0, 3).join(', ') },
      { label: 'Monthly listeners', value: listeners > 0 ? `${listeners >= 1000 ? (listeners / 1000).toFixed(1) + 'K' : listeners}` : '—' },
      { label: 'Tracks on Selah.fm', value: stats.total_tracks },
      { label: 'Total raised', value: `$${(totalDonations / 100).toFixed(0)}` },
      { label: 'Supporters', value: supporterCount || '—' },
      { label: 'Top CPM', value: topCpm ? `$${(parseFloat(topCpm) * 1000).toFixed(0)}/1M views` : '—' },
    ].map(f => (
      <div key={f.label}>
        <dt className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</dt>
        <dd className="text-sm font-semibold mt-0.5">{f.value}</dd>
      </div>
    ))}
  </dl>
</section>
```

**Impact:** LLMs crawling the page see structured, labeled, verifiable data in visible HTML. This is more citable than schema-only data.

### 2.3 — Expand FAQPage Schema with Genre-Specific Questions

Already covered in 1.3 above. Use the bio generator's FAQ output or fallback to genre-based templates.

---

## Phase 3: UX + Internal Linking (3 hours)

### 3.1 — Add Campaign Cross-Links to Artist Pages

**File:** `app/artist/[slug]/page.tsx` (server query) + `ArtistProfileClient.tsx` (UI)

**New query in page.tsx:**
```typescript
// Fetch active campaigns for this artist
const campaigns = await sql`
  SELECT c.id, c.slug, c.track_title, c.cpm_rate_cents, c.total_budget_cents,
         c.status, c.created_at
  FROM campaigns c
  JOIN campaign_claims cc ON cc.campaign_id = c.id
  WHERE cc.discovered_artist_id = ${artistId}
    AND c.status = 'active'
  ORDER BY c.created_at DESC LIMIT 5
`;
```

**New UI section in ArtistProfileClient.tsx (below CTAs, before About):**
```tsx
{campaigns.length > 0 && (
  <section>
    <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
      <Sparkles size={14} className="text-amber-400" />
      Active campaigns
    </h2>
    <div className="grid gap-2">
      {campaigns.map(c => (
        <Link key={c.id} href={`/c/${c.slug}`}
          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/20 transition-all">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{c.track_title}</p>
            <p className="text-[10px] text-muted-foreground/60">
              ${((c.cpm_rate_cents || 0) / 100 * 1000).toFixed(0)}/1M views · ${((c.total_budget_cents || 0) / 100).toFixed(0)} budget
            </p>
          </div>
          <span className="text-xs text-emerald-400 font-medium shrink-0">Join →</span>
        </Link>
      ))}
    </div>
  </section>
)}
```

### 3.2 — Expand Internal Linking Engine

**File:** `lib/internal-links.ts`

```typescript
export function getArtistLinks(artistName?: string, genres?: string[]): LinkTarget[] {
  const links: LinkTarget[] = [
    { url: '/browse', anchor: 'browse more independent artists', context: 'artist' },
    { url: '/welcome-creators', anchor: 'earn per view as a creator', context: 'creator' },
    { url: '/tools/cpm-calculator', anchor: 'calculate your CPM rate', context: 'tool' },
    { url: '/tools/creator-earnings', anchor: 'estimate your creator earnings', context: 'tool' },
    { url: '/tools/promotion-budget', anchor: 'plan your music promotion budget', context: 'tool' },
  ];

  // Add genre-specific links
  if (genres?.length) {
    for (const genre of genres.slice(0, 2)) {
      links.push({
        url: `/browse/genre/${genre.toLowerCase()}`,
        anchor: `browse ${genre.toLowerCase()} music artists`,
        context: 'genre',
      });
    }
  }

  // Add welcome pages
  if (artistName) {
    links.push({
      url: `/welcome-artists`,
      anchor: `how ${artistName} can promote music on Selah.fm`,
      context: 'artist-guide',
    });
  }

  return links;
}
```

**Update the call site** to pass `artistName` and `genres`.

### 3.3 — Add Server-Persisted Follow

**New migration:** `supabase/migrations/20260603150000_artist_follows.sql`

```sql
CREATE TABLE IF NOT EXISTS artist_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES discovered_artists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, artist_id)
);
CREATE INDEX IF NOT EXISTS idx_artist_follows_user ON artist_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_artist_follows_artist ON artist_follows(artist_id);
```

**New API route:** `app/api/artists/[slug]/follow/route.ts`

**Update ArtistProfileClient.tsx:** Replace localStorage with server fetch.

---

## Phase 4: Advanced SEO + LLMO (3 hours)

### 4.1 — Tab-Based Navigation

Replace the vertical stacking with YouTube-style tabs:

```tsx
const tabs = ['Tracks', 'Activity', 'About', 'Comments'];
const [activeTab, setActiveTab] = useState(0);
```

Each tab renders its section. Benefits: shorter page, faster mobile load, clearer UX hierarchy.

### 4.2 — Social Proof at Top

Move the "Raised $X" stat to a prominent position at the top:
```tsx
{totalDonations > 0 && (
  <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-green-500/5 border border-emerald-500/10">
    <p className="text-2xl font-bold text-emerald-400">${(totalDonations / 100).toFixed(0)}</p>
    <p className="text-xs text-muted-foreground">raised by {supporterCount} supporters</p>
  </div>
)}
```

### 4.3 — Streaming Stats Integration

Surface data from `artist_metrics` table using the existing `MetricCard` component from `ArtistCardClient.tsx` (which is currently orphaned — this is where we wire it in).

**Add a "Live Stats" section:**
```tsx
{/* Streaming stats — metrics from scraped data */}
{Object.keys(metrics).length > 0 && (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
    {Object.entries(metrics).slice(0, 4).map(([platform, data]) => (
      <div key={platform} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
        <p className="text-[10px] text-muted-foreground uppercase">{platform}</p>
        <p className="text-lg font-bold">{fmt(data.total_followers || 0)}</p>
        <p className="text-[10px] text-muted-foreground">followers</p>
      </div>
    ))}
  </div>
)}
```

### 4.4 — Track-Level Campaign Badge

In the track list, show which tracks have active campaigns:

```tsx
{track.campaign_slug && (
  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
    Active budget
  </span>
)}
```

---

## Phase 5: Verification + Polish (1 hour)

### 5.1 — TypeScript Check
```bash
cd /Users/motomoto/Documents/selah.fm && npx tsc --noEmit
```

### 5.2 — Update STATUS.md
Add the artist page SEO/LLMO overhaul to the status document.

### 5.3 — Update ROADMAP.md
Mark completed items, add new phases as upcoming work.

### 5.4 — Deploy + Verify
```bash
git add -A && git commit -m "feat: Artist page SEO + LLMO overhaul — dynamic FAQ, AI bios, campaign cross-links, enriched metadata"
git push origin main
```

After deploy:
1. Verify `selah.fm/artist/[slug]` loads for a known artist (test with 3 different slugs)
2. Verify JSON-LD passes Google Rich Results Test
3. Verify sitemap includes artist pages with correct `lastmod`
4. Run blog pipeline manually to verify no regressions

---

## Cost Estimate

| Item | Cost | Notes |
|------|------|-------|
| AI bios (all 2,000+ artists) | ~$140 one-time | DeepSeek API at ~$0.07/artist |
| Ongoing bio generation (new artists) | ~$3/day | ~40 new artists/day × $0.07 |
| Implementation time | ~8 hours dev | All 5 phases |
| **Total one-time** | **~$155** | Including dev time at current rate |

---

## Success Metrics

| Metric | Before | After (2 weeks) | After (2 months) |
|--------|--------|-----------------|------------------|
| Artist pages with content > 200 chars | ~100 | 1,000 | 2,000+ |
| Artist pages in Google index | ~0 | 200 | 1,500+ |
| FAQ rich results showing | 0 | 500+ | 1,500+ |
| Knowledge Panel mentions | 0 | 5-10 | 50+ |
| LLM citations (ChatGPT/Perplexity) | 0 | Occasional | Regular |
| Organic traffic from artist queries | ~0 | 20/day | 200+/day |
| Meta description uniqueness | 0% | 100% | 100% |

---

## Appendix: Files Modified Per Phase

| Phase | Files | Lines Changed |
|-------|-------|--------------|
| 0.1 Debug 404s | `app/artist/[slug]/page.tsx` | +20 |
| 0.2 Fix sitemap | `app/sitemap.ts` | -1, +1 |
| 0.3 Fix orphan | `app/artist/[slug]/ArtistCardClient.tsx` | Delete or extract |
| 1.1 Meta descriptions | `app/artist/[slug]/page.tsx` | +15 |
| 1.2 Schema enrichment | `app/artist/[slug]/page.tsx` | +20 |
| 1.3 Dynamic FAQ | `app/artist/[slug]/page.tsx` | +60 |
| 2.1 Wire bios | `app/api/cron/dispatcher/route.ts` + `app/artist/[slug]/page.tsx` | +30 |
| 2.2 Inline Q&A | `app/artist/[slug]/ArtistProfileClient.tsx` | +30 |
| 3.1 Campaign links | Both page.tsx + ArtistProfileClient.tsx | +40 |
| 3.2 Internal links | `lib/internal-links.ts` + callsite | +15 |
| 3.3 Follow system | New migration + API + Client | +150 |
| 4.1 Tabs | `app/artist/[slug]/ArtistProfileClient.tsx` | +80 |
| 4.2 Social proof | `app/artist/[slug]/ArtistProfileClient.tsx` | +10 |
| 4.3 Live stats | `app/artist/[slug]/ArtistProfileClient.tsx` | +30 |
| 4.4 Track badges | `app/artist/[slug]/ArtistProfileClient.tsx` | +5 |

**Total estimated: ~500 lines of changes across ~10 files**