# Selah.fm Performance Standards
**Last updated:** 2026-05-11

---

## Baseline Metrics (Pre-Optimization)

| Metric | Value | Grade |
|--------|-------|-------|
| Page size | 1.6 MB | — |
| HTML payload | 1.1 MB | 🔴 Critical |
| Load time | 2.70 s | — |
| Requests | 28 (21 JS, 3 images, 1 HTML, 1 CSS, 1 font) | — |
| Lighthouse | B85 | — |
| Cache headers | D67 | 🔴 |

**Root cause of 1.1MB HTML:** 8 base64 `data:image/jpeg` URLs (~180KB each) serialized into the server-rendered page from `campaign.cover_art_url` stored in the database.

---

## Optimization History

### Sprint 1 — HTML Payload Reduction (2026-05-11)
**Changes:**
- `app/c/[id]/page.tsx`: Strip base64 data URLs from `initialCampaign` before passing to client (`stripBase64Images()`)
- JSON-LD thumbnail: fall back to CDN URL when `cover_art_url` is a base64 string
- Client component already fetches fresh data from API after mount

**Expected results:** HTML payload reduced from 1.1MB → <100KB (estimated)

### Sprint 2 — Cache Headers & ISR (2026-05-11)
**Changes:**
- `app/c/[id]/page.tsx`: Added `export const revalidate = 60` (ISR)
- Existing `next.config.js` already has strong cache headers for static assets (1yr immutable), public assets (1wk stale-while-revalidate), favicon/robots (1 day)

**Expected results:** Campaign pages served from cache for 60s, reducing DB load

### Sprint 3 — JS Chunk Reduction (2026-05-11)
**Changes:**
- `next.config.js`: Added `webpack.splitChunks` with `minSize: 50000, maxSize: 200000`
- `next.config.js`: Added `image/avif` format alongside `image/webp`
- `next.config.js`: Added YouTube thumbnail remote patterns (`img.youtube.com`, `i.ytimg.com`)

**Expected results:** JS requests reduced from 21 → ~8-12

### Sprint 4 — Image Pipeline (2026-05-11)
**Changes:**
- Remote patterns updated for YouTube thumbnails
- AVIF format enabled
- (next/image migration for existing `<img>` tags pending — non-blocking)

### Sprint 5 — Data Deduplication (2026-05-11)
**Changes:**
- `lib/data.ts`: Created `getCampaign()`, `getArtist()`, `getCreator()` wrapped in `React.cache()`
- `assertLightweightPayload()` guard function for build-time payload size monitoring

**Expected results:** Multiple components in the same request share a single DB query

### Sprint 6 — Analytics Lazy Load (2026-05-11)
**Changes:**
- `components/Analytics.tsx`: Client component that defers GA 3s or until first user interaction
- `app/layout.tsx`: Replaced blocking `<head>` GA scripts with `<Analytics />` at end of `<body>`

**Expected results:** GA no longer competes with critical rendering path

### Sprint 7 — Font & Favicon (2026-05-11)
**Changes:**
- Font: Inter already configured with `display:'swap'`, `subsets:['latin']` — no changes needed
- `public/favicon.svg`: Created lightweight SVG favicon (288 bytes)
- `app/layout.tsx`: Added `<link rel="icon" href="/favicon.svg">`

---

## Active Configuration

### next.config.js
```js
splitChunks: { minSize: 50000, maxSize: 200000 }
image formats: ['image/avif', 'image/webp']
remotePatterns: unsplash.com, googleusercontent.com, midapi.ai, img.youtube.com, i.ytimg.com
```

### Revalidation Intervals
| Page | Interval |
|------|----------|
| Campaign page (`/c/[id]`) | 60s ISR |
| Platform stats API | 300s (via `unstable_cache`) |

### Cache Headers
| Resource | Cache-Control |
|----------|--------------|
| `/_next/static/*` | `public, max-age=31536000, immutable` |
| `/images/*`, `/fonts/*` | `public, max-age=604800, stale-while-revalidate=86400` |
| `/favicon.svg`, `/robots.txt` | `public, max-age=86400` |

---

## Monitoring & Alerts

- Lighthouse CI score threshold: >= 90
- Real-user LCP 75th percentile: < 2.5s
- Build-time alert: HTML payload > 100KB (via `assertLightweightPayload()`)
- Each sprint deployed individually; rollback if any regression detected
