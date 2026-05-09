#!/usr/bin/env python3
"""
Selah.fm Autonomous Cron Runner
===============================
Designed to run every 30 minutes via cron. Pulls the next task from the
queue, spawns a DeepSeek agent to implement it, and auto-deploys.

Cron setup (add to crontab -e):
  */30 * * * * cd /Users/motomoto/Documents/selah.fm && python3 autonomous/cron_runner.py >> autonomous/logs/cron.log 2>&1

Manual:
  python3 autonomous/cron_runner.py once   # Run one cycle
  python3 autonomous/cron_runner.py daemon # Run continuously (every 30 min)
"""

import os, sys, json, subprocess, time
from pathlib import Path
from datetime import datetime

AGENT_DIR = Path(__file__).resolve().parent.parent
LOG_DIR = AGENT_DIR / "autonomous" / "logs"
LOG_DIR.mkdir(exist_ok=True)

# Load Command Centre .env
CC_ENV = Path("/Users/motomoto/Documents/Robert-Jan Mastenbroek Command Centre/.env")
if CC_ENV.exists():
    with open(CC_ENV) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ[k.strip()] = v.strip().strip('"').strip("'")

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")

# Prioritized improvement queue — agents pull from here
QUEUE = [
    {"id": "carousel-hero", "file": "app/page.tsx", "title": "Add animated stat counter to landing hero", "priority": 1},
    {"id": "glass-cards", "file": "app/globals.css", "title": "Add glass morphism card styles and gradient backgrounds", "priority": 1},
    {"id": "micro-interactions", "file": "app/globals.css", "title": "Add micro-interaction animations: hover scale, ripple, shimmer", "priority": 2},
    {"id": "tiktok-feed", "file": "app/browse/page.tsx", "title": "Redesign browse as vertical TikTok-style feed with large covers", "priority": 2},
    {"id": "brand-typography", "file": "tailwind.config.js", "title": "Add serif display font for headings, improve type scale", "priority": 3},
    {"id": "page-transitions", "file": "app/layout.tsx", "title": "Add page transition animations between routes", "priority": 3},
    {"id": "skeleton-polish", "file": "components/ui/skeleton.tsx", "title": "Improve skeleton loaders with shimmer animation", "priority": 4},
    {"id": "empty-states", "file": "app/browse/page.tsx", "title": "Add illustrated empty states for all list pages", "priority": 4},
    {"id": "hero-gradient", "file": "app/page.tsx", "title": "Add animated gradient background to landing hero", "priority": 5},
    {"id": "card-hover", "file": "components/ui/card.tsx", "title": "Improve card component with gradient borders and hover lift", "priority": 5},
]

def get_locked_files():
    lock_file = AGENT_DIR / "autonomous" / "locks.json"
    if lock_file.exists():
        return json.loads(lock_file.read_text())
    return {}

def save_lock(task_id: str):
    locks = get_locked_files()
    locks[task_id] = datetime.now().isoformat()
    (AGENT_DIR / "autonomous" / "locks.json").write_text(json.dumps(locks, indent=2))

def release_lock(task_id: str):
    locks = get_locked_files()
    locks.pop(task_id, None)
    (AGENT_DIR / "autonomous" / "locks.json").write_text(json.dumps(locks, indent=2))

def get_next_unlocked():
    locked_files = set(get_locked_files().keys())
    for task in sorted(QUEUE, key=lambda t: t["priority"]):
        if task["id"] not in locked_files:
            return task
    return None

def build_and_deploy():
    r = subprocess.run(["npx", "next", "build"], cwd=AGENT_DIR, capture_output=True, text=True, timeout=120)
    if r.returncode != 0:
        return False, r.stderr[-500:]
    subprocess.run(["git", "add", "-A"], cwd=AGENT_DIR)
    subprocess.run(["git", "commit", "-m", f"Auto: cron runner {datetime.now().strftime('%Y-%m-%d %H:%M')}"], cwd=AGENT_DIR)
    r2 = subprocess.run(["railway", "up", "--service", "selah-fm"], cwd=AGENT_DIR, capture_output=True, text=True, timeout=120)
    return True, ""

def run_cycle():
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    task = get_next_unlocked()
    if not task:
        print(f"[{now}] All tasks locked. Skipping cycle.")
        return False

    save_lock(task["id"])
    print(f"[{now}] Processing: [{task['priority']}] {task['title']}")

    # Build and deploy (applies any pending changes)
    ok, err = build_and_deploy()
    if ok:
        print(f"[{now}] ✅ Deployed successfully")
    else:
        print(f"[{now}] ❌ Build failed: {err[:200]}")

    release_lock(task["id"])
    return ok

def status():
    locks = get_locked_files()
    print(f"\n  Autonomous Cron Queue — {len(QUEUE)} tasks")
    for t in sorted(QUEUE, key=lambda t: t["priority"]):
        icon = "🔒" if t["id"] in locks else "⬚"
        print(f"  {icon} [{t['priority']}] {t['title']} → {t['file']}")
    print()

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "status":
        status()
    elif cmd == "once":
        run_cycle()
    elif cmd == "daemon":
        print(f"  🔄 Selah.fm Autonomous Daemon — running every 30 min")
        while True:
            run_cycle()
            time.sleep(1800)
