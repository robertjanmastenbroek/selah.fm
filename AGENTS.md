# Selah.fm Agent Fleet

Self-improving autonomous agents that build, maintain, and grow Selah.fm.

## Active Agents

| Agent | Purpose | Trigger |
|---|---|---|
| `selah-master` | Strategic oversight, task prioritization, daily briefing | `python3 autonomous/agent.py once` |
| `selah-improve` | Continuously improve UI, copy, conversion, SEO | `python3 autonomous/agent.py once` |
| `selah-monitor` | Check site health, uptime, errors, performance | Manual (via /api/health) |
| `selah-outreach` | DM artists + creators on Instagram/TikTok | Manual |

## How to run

### Requirements
- Python 3 with `requests` package
- DeepSeek API key in environment: `DEEPSEEK_API_KEY=sk-...`
- Git configured with push access to the repo
- The repo must be on `main` branch with a clean state

### Single improvement cycle
```bash
cd /Users/motomoto/Documents/selah.fm
python3 autonomous/agent.py once
```

This will:
1. Pick the highest-priority unused task from the queue
2. Read the target file
3. Send it to DeepSeek with the improvement prompt
4. Write the generated code
5. Verify TypeScript compiles (reverts if not)
6. Commit and push to GitHub (triggers Railway auto-deploy)
7. Mark the task as done

### View queue status
```bash
python3 autonomous/agent.py status
```

### Reset all tasks
```bash
python3 autonomous/agent.py reset
```

## Queue Priority

| # | Task | File |
|---|------|------|
| 1 | SEO metadata + JSON-LD | app/layout.tsx |
| 2 | Micro-interaction animations | app/globals.css |
| 3 | Empty states with illustrations | app/browse/page.tsx |
| 4 | Mobile responsiveness fixes | app/globals.css |
| 5 | Landing page CTA optimization | app/page.tsx |
| 6 | Onboarding wizard UX | app/onboarding/page.tsx |
| 7 | Creator discoverability | app/creators/page.tsx |
| 8 | Campaign wizard UX | app/dashboard/page.tsx |

## Safety Features

- **TypeScript verification**: Generated code is checked with `tsc --noEmit`. If it fails, the change is reverted.
- **No file overwrites without backup**: Original content is saved before writing.
- **One task per cycle**: No concurrent modifications.
- **Explicit commit messages**: All agent commits are prefixed with `agent:`.

## Platform Status

- **24 pages** live at https://selah.fm
- **26 API routes** operational
- **34 E2E tests** (100%)
- **Google Analytics** tracking 6 conversion events
- **YouTube API** auto-verifying views
- **Selah AI Support** on every page (bottom-right)
- **Open source** — MIT licensed at github.com/robertjanmastenbroek/selah.fm
