# Selah.fm — 0.0001% World-Class Standard

**Date:** June 4, 2026  
**Standard:** Top 0.0001% worldwide (~6,000 individuals globally)  
**Scope:** UI/UX, conversion, onboarding, security, database, code quality  

---

## Research Sources

This document is a thin index that references existing research. Never duplicate work.

### Primary UI/UX Reference
→ **`UX_COMPETITOR_RESEARCH.md`** (1,309 lines, 25 platforms)
The definitive source for all UI/UX decisions. Covers every major platform pattern. Must-read before any UI/UX work.

### Secondary References
| Topic | Document |
|-------|----------|
| SEO/LLMO competitive audit | `SELAH_FM_COMPETITIVE_AUDIT.md` |
| Artist page research | `ARTIST_PAGE_RESEARCH.md` |
| Auth & onboarding audit | `AUTH_ONBOARDING_AUDIT.md` |
| Chat system audit | `CHAT_AUDIT.md` |
| Dashboard audit | `DASHBOARD_AUDIT.md` |

---

## Current Scorecard (1-10, Target = 10)

| Dimension | Score | Key Gap | Reference |
|-----------|-------|---------|-----------|
| **Track Page** (`/artist/.../tracks/[id]`) | 3/10 | Zero client interactivity — bare HTML | Build new |
| **Checkout** | 6/10 | No Apple Pay, no one-click reattempt | UX_COMPETITOR_RESEARCH.md §19 |
| **Artist Onboarding** | 6/10 | No Spotify connect during signup | AUTH_ONBOARDING_AUDIT.md |
| **Campaign Page** | 7/10 | No video hero, no storytelling format | UX_COMPETITOR_RESEARCH.md §4-5 |
| **Creator Onboarding** | 7/10 | No Stripe Connect during signup | AUTH_ONBOARDING_AUDIT.md |
| **Browse Page** | 7/10 | No keyboard nav, no infinite scroll | UX_COMPETITOR_RESEARCH.md §1,8 |
| **Login Page** | 7/10 | Stale social proof numbers | AUTH_ONBOARDING_AUDIT.md |
| **Artist Profile** | 8/10 | Static gradients (vs Spotify dynamic color) | UX_COMPETITOR_RESEARCH.md §11 |
| **Security** | 7/10 | Rate limiting gaps on auth | SECURITY.md |
| **Database** | 7/10 | Query perf monitoring missing | — |

---

## Execution Plan (3 Sprints)

### Sprint 1: Critical Foundations
1. **Track page** — Add client component: earnings calculator + join CTA + mobile sticky bar
2. **Login page** — Fix social proof stats (show real numbers from health endpoint)
3. **Campaign page** — Add creator testimonials section, storytelling layout
4. **Card hover elevation** — Spotify pattern: cards get lighter on hover

### Sprint 2: Onboarding Optimization
1. **Creator onboarding** — Add Stripe Connect step
2. **Artist onboarding** — Add Spotify connect + campaign preview
3. **Login page** — Add "Earn up to $X/1M views" value prop

### Sprint 3: Deep UX
1. **Dynamic color extraction** — Extract dominant colors from cover art for gradients
2. **Systematic type scale** — Spotify-style hierarchy (see UX_COMPETITOR_RESEARCH.md §11)
3. **Storytelling sections** — Campaign "About" with rich media
4. **Keyboard shortcuts** — Cmd+K palette

---

## Research Protocol

1. **CHECK FIRST** — Before any research, consult `RESEARCH_INDEX.md`
2. **CITE SOURCES** — Reference existing docs — never re-derive
3. **NO DUPLICATION** — Findings in any .md are canonical
4. **KEEP CURRENT** — Update research docs as things get built
5. **APPROVAL GATE** — Phase 3 execution requires approval after Phase 1+2 review
