<!--
================================================================================
ARCHIVED — See SELAH.md for current source of truth.

This file is preserved for historical reference only. All actionable content
has been consolidated into SELAH.md (the living document).
================================================================================
-->

# Selah.fm — Artist Page UX Audit
**Date:** 2026-06-03
**Page:** `/artist/[slug]` — ArtistProfileClient.tsx + page.tsx

---

## Current Score: 7/10 → Target: 10/10

### What's Excellent ✅
- Cover banner, profile photo overlap, genre chips, stats bar, dual CTAs
- Tab navigation (Tracks/Activity/About/Comments), quick facts section
- Active campaigns section, social proof bar, follow button
- Embed widget, cross-links, sticky mobile bar

### Gaps Found

| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| 1 | **Profile photo too small** (w-24 = 96px) | Feels cramped vs Spotify/YouTube | Increase to w-28 md:w-36 |
| 2 | **No track preview/play button** | Can't listen to music | Add play icon → opens Spotify/YouTube |
| 3 | **Stats bar labels unclear** | "Videos" doesn't explain submissions | Rename to "Submissions", "Total Views" |
| 4 | **No sticky desktop CTA sidebar** | Desktop users need to scroll for donate | Add sticky card in right column |
| 5 | **No "Listen on Spotify" button** | Tiny social icon buried | Prominent listen button below tracks |
| 6 | **Quick facts too dense** (8 items in 4 cols) | Hard to scan | Reduce to 6 items in 3 cols |
| 7 | **Share button missing** | Can't share artist profile | Add Share button next to Follow |
| 8 | **Views stat always 0** | total_views not in query | Fix query or remove stat |
| 9 | **Embed widget copy** | "Emdeddable widget" → "Embed profile" | Better title |
| 10 | **Similar artists use large square cards** | Takes too much right-column space | Use compact horizontal cards |
| 11 | **No Spotify monthly listeners showing** | Hidden when da.monthly_listeners=0 | Use artist_metrics data |
