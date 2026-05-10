#!/usr/bin/env python3
"""
Selah.fm Autonomous Agent System — v2 (Reliable)
=================================================
Pulls improvement tasks from the queue, generates code via DeepSeek,
applies changes, commits, and pushes to GitHub (auto-deploys via Railway).

Usage:
  python3 autonomous/agent.py once     # One improvement cycle
  python3 autonomous/agent.py status   # Show queue status
  python3 autonomous/agent.py webhook  # Start HTTP webhook server (trigger from platform)

Environment:
  DEEPSEEK_API_KEY  — Required (set in Railway or local .env)
  DEEPSEEK_MODEL    — Optional (default: deepseek-chat)
"""

import os, sys, json, subprocess, time, random
from pathlib import Path
from datetime import datetime

AGENT_DIR = Path(__file__).resolve().parent.parent
LOG_DIR = AGENT_DIR / "autonomous" / "logs"
LOG_DIR.mkdir(exist_ok=True)

# ── API Key ──────────────────────────────────────────────────────
# Try multiple sources: env, Command Centre .env, Railway
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

if not DEEPSEEK_API_KEY:
    # Try Command Centre .env
    cc_env = Path("/Users/motomoto/Documents/Robert-Jan Mastenbroek Command Centre/.env")
    if cc_env.exists():
        with open(cc_env) as f:
            for line in f:
                line = line.strip()
                if line.startswith("DEEPSEEK_API_KEY="):
                    DEEPSEEK_API_KEY = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break

# ── Improvement Queue ────────────────────────────────────────────
QUEUE = [
    {"id": "seo-meta", "priority": 1, "title": "Add SEO metadata and JSON-LD to all public pages", "file": "app/layout.tsx"},
    {"id": "micro-interactions", "priority": 2, "title": "Add micro-interaction animations to buttons and cards", "file": "app/globals.css"},
    {"id": "empty-states", "priority": 3, "title": "Enhance empty states with illustrations and CTAs", "file": "app/browse/page.tsx"},
    {"id": "mobile-polish", "priority": 4, "title": "Audit and fix mobile responsiveness issues", "file": "app/globals.css"},
    {"id": "landing-cta", "priority": 5, "title": "Optimize landing page CTAs and trust signals", "file": "app/page.tsx"},
    {"id": "onboarding-flow", "priority": 6, "title": "Improve onboarding wizard UX and error handling", "file": "app/onboarding/page.tsx"},
    {"id": "creator-discovery", "priority": 7, "title": "Improve creator discoverability and search filters", "file": "app/creators/page.tsx"},
    {"id": "campaign-wizard", "priority": 8, "title": "Streamline campaign creation wizard UX", "file": "app/dashboard/page.tsx"},
]

SYSTEM_PROMPT = """You are an autonomous improvement agent for Selah.fm — an open-source CPM marketplace where artists pay creators to promote their music on TikTok, Reels, and Shorts.

Tech stack: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL (Neon), Stripe.

Design system:
- Background: #0D0D0D (near black)
- Primary: #5B7FFF (DeepSeek blue)
- Text: #F0F0F0, secondary: #8C8C8C
- Glassmorphism: bg-white/[0.03] backdrop-blur-xl border-white/[0.06]
- Cards: rounded-2xl, subtle borders
- Buttons: rounded-xl, hover:opacity-90, active:scale-[0.97]
- Animations: framer-motion (motion.div, AnimatePresence)

Rules:
1. Make ONE focused, small improvement per cycle
2. Never break existing functionality
3. Use existing component library (Button, Card, Input, Badge, Progress, Skeleton from @/components/ui)
4. Return ONLY valid JSON — no markdown, no explanations outside the JSON

Return this exact JSON format:
{
  "file": "path/to/file.tsx",
  "description": "Brief description of the change",
  "code": "the complete new file contents"
}"""

def read_file(path: str, max_chars: int = 5000) -> str:
    """Read a project file, limited size."""
    full = AGENT_DIR / path
    if full.exists():
        content = full.read_text()
        if len(content) > max_chars:
            return content[:max_chars] + "\n// ... (truncated)"
        return content
    return f"// File not found: {path}"

def call_deepseek(prompt: str, timeout: int = 120) -> dict:
    """Call DeepSeek API with proper error handling."""
    if not DEEPSEEK_API_KEY:
        return {"error": "DEEPSEEK_API_KEY not set"}

    try:
        import requests
        resp = requests.post(
            "https://api.deepseek.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": DEEPSEEK_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.3,
                "max_tokens": 8000,
            },
            timeout=timeout,
        )

        if resp.status_code != 200:
            return {"error": f"API returned {resp.status_code}: {resp.text[:200]}"}

        data = resp.json()
        content = data["choices"][0]["message"]["content"]

        # Extract JSON from response
        content = content.strip()
        if content.startswith("```"):
            # Remove code fences
            lines = content.split("\n")
            lines = [l for l in lines if not l.startswith("```")]
            content = "\n".join(lines)

        start = content.find("{")
        end = content.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(content[start:end])

        return {"error": "Could not parse JSON", "raw": content[:500]}
    except requests.exceptions.Timeout:
        return {"error": f"API timeout after {timeout}s"}
    except Exception as e:
        return {"error": str(e)}

def log_result(task: dict, result: dict):
    """Log the agent cycle result."""
    entry = {
        "timestamp": datetime.now().isoformat(),
        "task": task,
        "result": result,
    }
    log_file = LOG_DIR / f"agent_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(log_file, "w") as f:
        json.dump(entry, f, indent=2)

def run_cycle():
    """Run one improvement cycle."""
    print(f"\n{'='*50}")
    print(f"  Selah.fm Agent — {datetime.now().strftime('%H:%M:%S')}")
    print(f"{'='*50}")

    if not DEEPSEEK_API_KEY:
        print(f"  ❌ DEEPSEEK_API_KEY not set. Add to Railway env vars or local .env")
        return False

    # Pick highest priority unused task
    task = None
    for t in sorted(QUEUE, key=lambda x: x["priority"]):
        if not (LOG_DIR / f"done_{t['id']}").exists():
            task = t
            break

    if not task:
        print(f"  ✅ All {len(QUEUE)} tasks completed!")
        return True

    print(f"  🎯 [{task['priority']}] {task['title']}")

    # Read the target file
    file_content = read_file(task["file"])

    # Build prompt
    prompt = f"""Current file: {task['file']}
Content:
```tsx
{file_content}
```

Improvement: {task['title']}

Return JSON with the improved file contents."""

    # Call DeepSeek
    result = call_deepseek(prompt)
    log_result(task, result)

    if "error" in result:
        print(f"  ❌ {result['error']}")
        return False

    if "code" not in result:
        print(f"  ⚠️ No code in response")
        return False

    # Validate the response has actual code
    code = result.get("code", "")
    if len(code) < 50:
        print(f"  ⚠️ Generated code too short ({len(code)} chars)")
        return False

    # Write the file
    target_path = AGENT_DIR / task["file"]
    original = target_path.read_text() if target_path.exists() else ""

    try:
        target_path.write_text(code)
        print(f"  📝 Wrote {len(code)} chars to {task['file']}")
    except Exception as e:
        print(f"  ❌ Failed to write file: {e}")
        return False

    # Verify TypeScript compiles
    r = subprocess.run(
        ["npx", "tsc", "--noEmit", "--pretty"],
        cwd=AGENT_DIR,
        capture_output=True,
        text=True,
        timeout=60,
    )

    if r.returncode != 0:
        print(f"  ❌ TypeScript errors — reverting")
        target_path.write_text(original)
        print(f"  {r.stderr[:500]}")
        return False

    print(f"  ✅ TypeScript clean")

    # Commit
    subprocess.run(["git", "add", task["file"]], cwd=AGENT_DIR)
    subprocess.run(
        ["git", "commit", "-m", f"agent: {task['title']}"],
        cwd=AGENT_DIR,
        capture_output=True,
    )

    # Push to GitHub (auto-deploys via Railway)
    r = subprocess.run(
        ["git", "push", "origin", "main"],
        cwd=AGENT_DIR,
        capture_output=True,
        text=True,
        timeout=30,
    )

    if r.returncode == 0:
        print(f"  🚀 Pushed — Railway auto-deploy triggered")
        # Mark as done
        (LOG_DIR / f"done_{task['id']}").write_text(datetime.now().isoformat())
        return True
    else:
        print(f"  ❌ Push failed: {r.stderr[:200]}")
        return False

def show_status():
    """Show queue status."""
    done = 0
    for t in QUEUE:
        if (LOG_DIR / f"done_{t['id']}").exists():
            done += 1

    print(f"\n  Selah.fm Agent Queue — {done}/{len(QUEUE)} done")
    for t in sorted(QUEUE, key=lambda x: x["priority"]):
        is_done = (LOG_DIR / f"done_{t['id']}").exists()
        icon = "✅" if is_done else "⬚"
        print(f"  {icon} [{t['priority']}] {t['title']}")

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "once":
        ok = run_cycle()
        sys.exit(0 if ok else 1)
    elif cmd == "status":
        show_status()
    elif cmd == "reset":
        import glob
        for f in glob.glob(str(LOG_DIR / "done_*")):
            Path(f).unlink()
        print("  🔄 All tasks reset")
        show_status()
    else:
        print("  Usage: python3 autonomous/agent.py [once|status|reset]")
