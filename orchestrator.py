#!/usr/bin/env python3
"""
Selah.fm Autonomous Orchestrator
=================================
Self-directed task manager. Reads project state, prioritizes work,
and drives continuous improvement. No human intervention needed.

Usage:
  python3 orchestrator.py status
  python3 orchestrator.py next
  python3 orchestrator.py build
  python3 orchestrator.py loop     # Continuous improvement mode
"""

import json, os, subprocess, sys
from pathlib import Path
from datetime import datetime

AGENT_DIR = Path(__file__).resolve().parent
STATE_FILE = AGENT_DIR / "tasks.json"

BUILD_PLAN = {
    "project": "Selah.fm",
    "goal": "CPM marketplace for music promotion",
    "phases": [
        {"id": "core", "name": "Core Platform", "tasks": [
            {"id": "auth", "name": "Auth system (Google OAuth + email)", "done": True},
            {"id": "campaigns", "name": "Campaign creation + persistence", "done": True},
            {"id": "marketplace", "name": "Browse → submit → review → approve loop", "done": True},
        ]},
        {"id": "growth", "name": "Growth & Polish", "tasks": [
            {"id": "creators_dir", "name": "Creator marketplace directory", "done": True},
            {"id": "stripe", "name": "Stripe Connect checkout + webhooks", "done": True},
            {"id": "verification", "name": "View verification service (needs YouTube key)", "done": True},
            {"id": "landing_seo", "name": "Landing page polish, SEO, structured data", "done": True},
            {"id": "notifications", "name": "Notification bell + dropdown", "done": True},
            {"id": "hire_flow", "name": "Creator hire flow with custom CPM", "done": True},
        ]},
        {"id": "outreach", "name": "Outreach & Launch", "tasks": [
            {"id": "outreach_agent", "name": "DM outreach to artists + creators", "done": True},
            {"id": "autonomous", "name": "Autonomous agent fleet (DeepSeek)", "done": True},
            {"id": "social_templates", "name": "Social media content templates", "done": True},
            {"id": "social", "name": "Social media content + presence", "done": False},
            {"id": "launch", "name": "Pilot launch with seed users", "done": False},
        ]},
    ]
}

def status():
    total = sum(len(p["tasks"]) for p in BUILD_PLAN["phases"])
    done = sum(1 for p in BUILD_PLAN["phases"] for t in p["tasks"] if t["done"])
    print(f"\n  Selah.fm — {done}/{total} tasks ({int(done/total*100)}%)")
    for phase in BUILD_PLAN["phases"]:
        pts = phase["tasks"]
        pdone = sum(1 for t in pts if t["done"])
        icon = "✅" if pdone == len(pts) else "🔨"
        print(f"\n  {icon} {phase['name']} ({pdone}/{len(pts)})")
        for t in pts:
            print(f"    {'✅' if t['done'] else '⬚'} {t['name']}")
    print()

def next():
    for phase in BUILD_PLAN["phases"]:
        for t in phase["tasks"]:
            if not t["done"]:
                print(f"  ▶ {t['name']}")
                return
    print("  ✅ All done")

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "status": status()
    elif cmd == "next": next()
    elif cmd == "build":
        print("  🔨 Triggering build loop...")
        subprocess.run(["python3", "build_loop.py", "once"], cwd=AGENT_DIR)
    elif cmd == "loop":
        print("  🔄 Continuous improvement mode — run build_loop.py watch")
