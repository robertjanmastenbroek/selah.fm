# Selah.fm Agent Fleet

Self-improving autonomous agents that build, maintain, and grow Selah.fm.

## Active Agents

| Agent | Purpose | Trigger |
|---|---|---|
| `selah-master` | Strategic oversight, task prioritization, daily briefing | Manual or cron |
| `selah-outreach` | DM artists + creators on Instagram/TikTok | Daily |
| `selah-improve` | Continuously improve UI, copy, conversion, SEO | Continuous |
| `selah-monitor` | Check site health, uptime, errors, performance | Hourly |

## Fleet Philosophy

Same pattern as RJM Command Centre:
- Each agent has a markdown instruction file in `agents/`
- Agents read the full project context before acting
- Agents self-evaluate and report
- Master agent orchestrates the others
- All output committed to git and deployed to Railway

## Platform Status (May 10, 2026)

- **16 pages** live at https://selah.fm
- **26 API routes** operational
- **34 E2E tests** (97% pass rate)
- **Google Analytics** tracking 6 conversion events
- **YouTube API** auto-verifying views
- **Stripe** in test mode (needs live switch)
- **SMTP** not configured (emails logged to console)
