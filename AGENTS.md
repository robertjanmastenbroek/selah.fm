# SendMusic.io Agent Fleet

Self-improving autonomous agents that build, maintain, and grow SendMusic.io.

## Active Agents

| Agent | Purpose | Trigger |
|---|---|---|
| `sendmusic-master` | Strategic oversight, task prioritization, daily briefing | Manual or cron |
| `sendmusic-outreach` | DM artists + creators on Instagram/TikTok | Daily |
| `sendmusic-improve` | Continuously improve UI, copy, conversion, SEO | Continuous |
| `sendmusic-monitor` | Check site health, uptime, errors, performance | Hourly |

## Fleet Philosophy

Same pattern as RJM Command Centre:
- Each agent has a markdown instruction file in `agents/`
- Agents read the full project context before acting
- Agents self-evaluate and report
- Master agent orchestrates the others
- All output committed to git and deployed to Railway
