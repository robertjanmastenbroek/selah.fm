# Blog Pipeline — Gap Analysis & World-Class Blueprint

**Date:** 2026-06-05
**Method:** Read all pipeline code (blog-pipeline, blog-publish, blog-syndicate, blog-engine, dispatcher), researched top-tier autonomous content systems (Acrid Automation, Multi-AI, n8n enterprise pipelines), cross-referenced against current state.

---

## Current State

### Pipeline flow

```
Dispatcher (0 * * * *)
  → Hour 02: blog-pipeline (source → interview → answer → 1 post → schedule)
  → Hour 08: blog-pipeline (same)
  → Hour 09: blog-publish (publish scheduled posts)
  → Hour 10: blog-publish (backup publish)
  → Hour 14: blog-pipeline (same)
  → Hour 15: blog-publish (publish scheduled posts)
  → Hour 20: blog-pipeline (same)
```

### What's working
- Question sourcing (Reddit RSS + AI pool + fallback)
- Interview generation + auto-answer in founder voice
- Article generation with multi-pass self-critique
- Quality scoring with vocabulary tracking
- Scheduling (09:00 and 15:00 UTC slots)
- Reddit syndication (3/day)
- Image fetching from Pexels → DB storage

### SELAH.md says
> Blog posts (auto): 28+
> Scheduled posts: 11+ (2/day through June 12)

So the pipeline IS generating and scheduling posts. But posts may not be publishing.

---

## Root Cause: Why Posts Aren't Publishing

After reading every line of the pipeline code, I found multiple issues that explain why posts aren't reliably going live:

### 🔴 P0: Dispatcher timeout kills the pipeline

The `blog-pipeline` route has `maxDuration = 600` (10 minutes). But the **dispatcher uses `AbortSignal.timeout(300000)` — 5 minutes**. The pipeline makes multiple DeepSeek API calls (interview generation, auto-answer, article generation, self-critique), each with a 120s timeout. That's potentially 8+ minutes of API calls. The dispatcher kills the pipeline after 5 minutes.

**Evidence:**
- `dispatcher/route.ts`: `signal: AbortSignal.timeout(300000)` — 300 seconds
- `blog-pipeline/route.ts`: `maxDuration = 600` — 600 seconds
- DeepSeek API calls in blog-engine: `120_000` timeout each — 4+ calls per pipeline run

### 🟠 P1: No retry on pipeline failure

If blog-pipeline fails at 08 UTC (e.g., DeepSeek rate limit hit), the dispatcher logs the failure but **doesn't retry**. The next pipeline run is at 14 UTC (6 hours later). During those 6 hours, no posts are generated.

### 🟠 P1: Blog publish at 09 UTC before pipeline finishes

Pipeline runs at 08 UTC. If it generates a post and schedules it for 09:00 UTC, the publish cron at 09 UTC *should* pick it up. But there's a race: if the pipeline is still running at 08:59, the post might not be in the DB yet when the publish cron fires.

At hour 10 there's a backup publish run, but hour 15's publish has no backup.

### 🟠 P1: No empty-slot filling

Each pipeline run only generates **1 post** (`LIMIT 1`). If a pipeline run fails, that day's slot stays empty forever. World-class pipelines have backlog-clearing mechanisms.

### 🟡 P2: No monitoring/alerting

The dispatcher returns results in JSON but there's no notification when a worker fails. A blog-pipeline failure could go unnoticed for days.

### 🟡 P2: Reddit syndication depends on Reddit API

The syndication uses Reddit OAuth with refresh tokens. If the refresh token expires, Reddit syndication silently fails. No email notification, no admin alert.

---

## World-Class Benchmark vs Current System

| Dimension | World-Class Standard | Selah.fm Today | Gap |
|-----------|--------------------|----------------|-----|
| **Timeout alignment** | All timeouts harmonized (generator < dispatcher < route) | Dispatcher (300s) < Pipeline needs (600s) — pipeline gets killed | 🔴 |
| **Retry on failure** | Exponential backoff, 3 retries per stage | Zero retries — one failure = skipped slot | 🔴 |
| **Backlog clearing** | Catch-up runs if pipeline misses a slot | One post per run, no catch-up | 🟠 |
| **Monitoring** | Slack/Discord notification on every failure | JSON log only — no alerts | 🟠 |
| **Topic research** | WebSearch + trending + competitor analysis | Static AI pool + Reddit RSS only | 🟠 |
| **Multi-format output** | Auto-generate X, LinkedIn, email variants from one post | Reddit only — no social media variants | 🟡 |
| **Image quality** | AI-generated images (Midjourney/Galaxy AI) + relevance scoring | Pexels first result — no scoring | 🟡 |
| **Content calendar** | Auto-fill slots with buffer, cascade failures | Strict slot assignment, no buffer | 🟡 |
| **Dead letter queue** | Failed posts saved for manual review | Failed posts silently lost | 🟡 |
| **Human-in-loop** | Optional review before publish | Auto-publish — no review gate | 🟢 |
| **Publish validation** | Check post is live, indexable, no broken links | "Set status = published" — no validation | 🟢 |
| **Distribution** | 5+ channels (X, LinkedIn, email, Reddit, Medium) | 1 channel (Reddit) | 🟢 |
| **Vocabulary self-learning** | Frequencies tracked, banned words refreshed per post | ✅ Done | — |
| **Quality scoring** | 100-point rubric, minimum threshold to ship | ✅ Done | — |
| **Self-critique** | AI rewrites its own output to beat detection | ✅ Done | — |
| **Voice identity** | Full voice profile, style guide, banned words | ✅ Done | — |
| **Image storage** | BYTEA in DB (survives redeploys) | ✅ Done | — |
| **SEO schema** | Triple schema (Article + QAPage + FAQPage) | ✅ Done | — |

---

## Fix Plan (Ranked)

### 🔴 P0 — Fix Today

**1. Fix dispatcher timeout (5m → 10m)**

`dispatcher/route.ts` line: `signal: AbortSignal.timeout(300000)` → `signal: AbortSignal.timeout(600000)`

This is a 1-line change. Without this, the blog pipeline is guaranteed to fail on any run that takes more than 5 minutes.

**2. Add retry logic to blog-pipeline**

The pipeline should retry failed steps with exponential backoff. Specifically:
- If DeepSeek API returns 429 (rate limit), wait and retry
- If article generation fails, try a fallback prompt with lower temperature
- If scheduling fails, retry with next slot

### 🟠 P1 — Fix This Sprint

**3. Add blog-publish backup for 15:00 slot**

Currently blog-publish runs at hours 9 and 10 (morning) but only hour 15 (afternoon). The 10:00 run was meant to catch posts that the 09:00 run missed. The 15:00 slot has no backup. Add a 16:00 publish run to the dispatcher.

**4. Add backlog clearing to blog-pipeline**

After generating a post, check if there are empty slots in the next 48 hours. If yes, generate additional posts to fill them (up to a max of 2 per pipeline run instead of current 1).

**5. Add failure logging to dispatcher**

Each dispatcher result should log worker failures to a `cron_failures` table so they're visible in the admin dashboard instead of only in Railway logs.

**6. Add blog-pipeline health check endpoint**

A `/api/admin/blog/health` endpoint that shows:
- Last N pipeline runs with status
- Current backlog (unscheduled drafts)
- Next scheduled posts
- Pipeline failure count (last 24h)

### 🟡 P2 — Fix This Week

**7. Add trending topic research**

Replace the static AI question pool with a dynamic topic research system that:
- Queries Google Trends API for rising music promotion topics
- Scrapes Reddit for viral music threads daily
- Analyzes competitor blogs for topic gaps
- Feeds results into the question pool

**8. Add multi-format output**

After a post is published, auto-generate:
- X/Twitter thread (5-10 tweets)
- LinkedIn article variant
- Email newsletter excerpt
- Instagram carousel text (for blog→IG automation)

**9. Add social media cross-posting**

Move beyond Reddit:
- Post to X via API (already has X_BEARER_TOKEN configured but disabled)
- LinkedIn article auto-publish
- Add to existing blog-syndicate route

**10. Add dead letter queue**

When post generation fails, save the intermediate state (questions, transcript, partial article) to a `failed_posts` table so it can be retried from where it left off.

### 🟢 P3 — Polish

**11. Add image relevance scoring**
Score Pexels images against the article's primary keyword and pick the highest-scoring one instead of random.

**12. Add publish validation**
After setting `status = 'published'`, do a HEAD request to the post URL to verify it returns 200. Log failures.

**13. Add content calendar view**
Admin dashboard showing the 2-week publishing calendar with slot status (filled, empty, failed).

---

## Implementation Order

1. **Fix timeout** (dispatcher → 600s) — 5 minute change, unblocks everything
2. **Add retry logic** to pipeline — ~2h
3. **Add 16:00 publish backup** — 1 line in dispatcher
4. **Add backlog clearing** (2 posts/run) — ~1h
5. **Add failure logging table** + dispatcher updates — ~1h
6. **Add health endpoint** — ~2h
7. **Backlog: distribution, trending, multi-format** — ~10h total
