<!--
================================================================================
ARCHIVED — See SELAH.md for current source of truth.

This file is preserved for historical reference only. All actionable content
has been consolidated into SELAH.md (the living document).
================================================================================
-->

# Selah.fm — Master Execution Plan
**Generated:** June 4, 2026
**Total effort:** ~70h dev + ~$15/month
**Target:** World-class SEO + community platform

---

## Execution Order

```
Phase 0a ───────────────────────┐  Bio Engine (25h)
                                │
Phase 0b ───────────────────────┤  Entity Graph (3h)
                                │
Phase 1 ────────────────────────┤  Pages (8h)
                                │
Phase 2 ────────────────────────┤  Community (16h)
                                │
Phase 3 ────────────────────────┤  Backlinks (8h)
                                │
Phase 4 ────────────────────────┤  Scale (10h)
                                ▼
                          World-class
```

Dependencies: Each phase builds on the previous. Phase 0a is the foundation.

---

## PHASE 0a: Bio Engine Architecture (25h)

### Build Order

| Step | File | What to Build | Hours |
|------|------|---------------|-------|
| 1 | `lib/bio-angles.ts` | 50+ angle definitions with selection criteria | 2h |
| 2 | `lib/bio-tone.ts` | 8 tone definitions (Profile, Review, Feature, Data, Listener, Fan, Journalist, Critic) | 1h |
| 3 | `lib/bio-openings.ts` | 65+ opening hook templates by type (scene, direct, question, data, etc.) | 2h |
| 4 | `lib/bio-descriptors.ts` | 50+ sound description framings (vibe, texture, emotion, craft, movement) | 2h |
| 5 | `lib/bio-journeys.ts` | 50+ journey framings (growth arc, catalog arc, audience arc) | 2h |
| 6 | `lib/bio-closings.ts` | 50+ Selah.fm closing CTAs | 1h |
| 7 | `lib/bio-vocabulary.ts` | Sliding frequency window tracker — tracks word usage across last 200 bios | 1h |
| 8 | `lib/bio-scorer.ts` | Quality scoring: 70/100 threshold, auto-regenerate on fail | 2h |
| 9 | `app/api/artist/bio/route.ts` | Rewrite to multi-slot composable generation | 3h |
| 10 | `app/api/cron/generate-artist-bios/route.ts` | Batch cron: 100 artists/night, 3 variations each | 3h |
| 11 | `app/api/artist/bio/manual/route.ts` | Dashboard "Generate Bio" button endpoint | 1h |
| 12 | Test & iterate: generate 50 bios, check scores, adjust | — | 3h/7h |

### Implementation Details

**Step 1: lib/bio-angles.ts**
```typescript
export interface Angle {
  id: string;
  name: string;
  description: string;
  focus: string;
  bestFor: string;  // data conditions
  structure: string[]; // which slots to use
  tone: string;
}

export const ANGLES: Angle[] = [
  {
    id: 'discovery',
    name: 'The Discovery',
    description: '"You haven\'t heard of them yet, but you will."',
    focus: 'hidden gem narrative',
    bestFor: 'low-data',
    structure: ['opening-scene', 'sound-description', 'why-matters', 'selah-cta'],
    tone: 'profile',
  },
  {
    id: 'slow-build',
    name: 'The Slow Build',
    description: '"Patience, persistence, and a growing catalog."',
    focus: 'catalog trajectory',
    bestFor: 'tracks-5+',
    structure: ['opening-data', 'journey-growth', 'sound-description', 'why-future', 'selah-cta'],
    tone: 'feature',
  },
  // ... 48 more
];

export function selectAngle(artistData: ArtistData): Angle {
  // Score each angle against artist data
  // Return highest-scoring match
}
```

**Step 2-8:** Similar pattern for each slot library. Each exports an array of templates + a selector function.

**Step 9: app/api/artist/bio/route.ts** (rewrite)
```typescript
export async function POST(request: Request) {
  const { artistId } = await request.json();
  const artistData = await loadArtistData(artistId);
  
  // Generate 3 variations, keep best
  const variations = await Promise.all(
    [1, 2, 3].map(() => generateBio(artistData))
  );
  
  const scores = variations.map(v => scoreBio(v));
  const bestIndex = scores.indexOf(Math.max(...scores));
  
  // Save to DB
  await saveBio(artistId, variations[bestIndex], scores[bestIndex]);
  
  return NextResponse.json({
    bio: variations[bestIndex],
    score: scores[bestIndex],
    variations_generated: 3,
  });
}

async function generateBio(artistData: ArtistData): Promise<string> {
  const angle = selectAngle(artistData);
  const tone = selectTone(artistData, angle);
  const opening = await generateSlot('opening', angle, tone, artistData);
  const sounds = await generateSlot('sounds', angle, tone, artistData);
  const journey = await generateSlot('journey', angle, tone, artistData);
  const significance = await generateSlot('significance', angle, tone, artistData);
  const closing = selectClosing(angle, artistData);
  
  return assemble([
    ...angle.structure.map(slot => slot === 'opening-scene' ? opening : 
                           slot === 'sound-description' ? sounds :
                           slot === 'journey-*' ? journey :
                           slot === 'why-*' ? significance :
                           slot === 'selah-cta' ? closing : '')
  ]);
}
```

### Acceptance Criteria
- [ ] 50+ angles defined with data conditions
- [ ] 8 tones available
- [ ] 65+ opening hooks across 12 types
- [ ] 50+ sound descriptors
- [ ] 50+ journey framings
- [ ] 50+ closing CTAs
- [ ] Vocabulary tracker: bans words appearing in 3+ of last 200 bios
- [ ] Quality scorer: 70/100 threshold, auto-regenerate on fail
- [ ] Batch cron: 100 artists/night, 3 variations each

---

## PHASE 0b: Entity Graph + Schema (3h)

| Step | File | Hours |
|------|------|-------|
| 1 | `app/artist/[slug]/page.tsx` — Add sameAs to MusicGroup schema | 1h |
| 2 | `app/artist/[slug]/page.tsx` — Add Person schema ("By Selah.fm Music Team") | 30min |
| 3 | `lib/internal-links.ts` — Expand to 15+ destinations | 1h |
| 4 | `app/artist/[slug]/page.tsx` — Algorithmic similar artists | 30min |

---

## PHASE 1: Page Expansion (8h)

| Step | File | Hours |
|------|------|-------|
| 1 | `app/artist/[slug]/tracks/[id]/page.tsx` — Track SEO pages with MusicRecording schema | 3h |
| 2 | `app/sitemap.ts` — Include all track pages | 30min |
| 3 | `app/browse/genre/[genre]/page.tsx` — Genre landing pages with MusicGenre schema | 2h |
| 4 | `app/artists/[city]/page.tsx` — City artist listing pages | 2h |
| 5 | `app/artist/[slug]/ArtistProfileClient.tsx` — Latest submissions widget | 30min |

---

## PHASE 2: Community Layer (16h)

| Step | File | Hours |
|------|------|-------|
| 1 | `app/api/reviews/route.ts` + migration — 5-star review CRUD | 4h |
| 2 | `components/ReviewSection.tsx` — Review display + submit form | 2h |
| 3 | `components/FanPhotoGallery.tsx` + `app/api/photos/route.ts` — Photo uploads | 3h |
| 4 | `components/ArtistDiscussion.tsx` — Discussion boards | 3h |
| 5 | `components/TrackReviewSection.tsx` — Track-specific reviews | 1h |
| 6 | `components/FanList.tsx` — "Meet other fans" | 2h |
| 7 | `app/api/reviews/[id]/respond/route.ts` — Artist response system | 1h |

---

## PHASE 3: UGC & Backlinks (8h)

| Step | File | Hours |
|------|------|-------|
| 1 | `components/EmbedBadge.tsx` + `app/api/embed/[slug]/route.tsx` | 2h |
| 2 | `lib/social-share.ts` — Per-page OG customization | 1h |
| 3 | `lib/google-indexing.ts` + cron — Google Indexing API | 1h |
| 4 | `lib/index-now.ts` — Bing/Yandex submission | 30min |
| 5 | `app/sitemap.ts` — Dynamic priority by content quality | 30min |
| 6 | `app/api/reviews/[id]/share-card/route.tsx` — Shareable review cards | 2h |
| 7 | `app/page.tsx` — Homepage review highlight | 1h |

---

## PHASE 4: Scale & Automation (10h)

| Step | File | Hours |
|------|------|-------|
| 1 | `app/api/cron/discover-artists/route.ts` — Auto-create from Bandcamp | 3h |
| 2 | `app/api/cron/scrape-artist-news/route.ts` — Google News scraping | 2h |
| 3 | `app/api/v1/[...path]/route.ts` — Public read-only API | 3h |
| 4 | `app/google-news-sitemap.ts` — News sitemap | 30min |
| 5 | `app/artist/[slug]/ArtistProfileClient.tsx` — Template differentiation | 1h |
| 6 | `app/api/cron/review-notifications/route.ts` — Review reply emails | 30min |

---

## Quick Reference: All Files to Create (35 files)

### Phase 0a (12 files)
- `lib/bio-angles.ts`
- `lib/bio-tone.ts`
- `lib/bio-openings.ts`
- `lib/bio-descriptors.ts`
- `lib/bio-journeys.ts`
- `lib/bio-closings.ts`
- `lib/bio-vocabulary.ts`
- `lib/bio-scorer.ts`
- `app/api/artist/bio/route.ts` (rewrite)
- `app/api/cron/generate-artist-bios/route.ts`
- `app/api/artist/bio/manual/route.ts`
- Migration: artist_articles table

### Phase 0b (0 new files — modify 3 existing)

### Phase 1 (4 new files)
- `app/artist/[slug]/tracks/[id]/page.tsx`
- `app/browse/genre/[genre]/page.tsx`
- `app/artists/[city]/page.tsx`

### Phase 2 (7 new files + 1 migration)
- `app/api/reviews/route.ts`
- `components/ReviewSection.tsx`
- `components/FanPhotoGallery.tsx`
- `app/api/photos/route.ts`
- `components/ArtistDiscussion.tsx`
- `components/TrackReviewSection.tsx`
- `components/FanList.tsx`
- Migration: fan_reviews table

### Phase 3 (7 new files)
- `components/EmbedBadge.tsx`
- `app/api/embed/[slug]/route.tsx`
- `lib/social-share.ts`
- `lib/google-indexing.ts`
- `app/api/cron/submit-to-google/route.ts`
- `lib/index-now.ts`
- `app/api/reviews/[id]/share-card/route.tsx`

### Phase 4 (5 new files)
- `app/api/cron/discover-artists/route.ts`
- `app/api/cron/scrape-artist-news/route.ts`
- `app/api/v1/[...path]/route.ts`
- `app/google-news-sitemap.ts`
- `app/api/cron/review-notifications/route.ts`
