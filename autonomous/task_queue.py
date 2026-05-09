#!/usr/bin/env python3
"""
Selah.fm Autonomous Task Queue
===============================
Priority queue that feeds improvement tasks to AI agents.
Agents pull tasks, implement them, and report completion.

The queue prevents conflicts: only one agent works on a file at a time.
"""

import json, subprocess, time
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass
from typing import Optional

AGENT_DIR = Path(__file__).resolve().parent.parent
QUEUE_FILE = AGENT_DIR / "autonomous" / "queue.json"
LOCKS_FILE = AGENT_DIR / "autonomous" / "locks.json"
LOG_DIR = AGENT_DIR / "autonomous" / "logs"
LOG_DIR.mkdir(exist_ok=True)

# Priority queue of improvement tasks
# Agents pull the highest-priority unlocked task
QUEUE = [
    {"id": "mobile-nav", "title": "TikTok-style mobile bottom nav", "file": "components/BottomNav.tsx", "priority": 1, "status": "pending"},
    {"id": "campaign-cards", "title": "Campaign card redesign: better hierarchy, hover effects", "file": "app/dashboard/page.tsx", "priority": 2, "status": "pending"},
    {"id": "browse-cards", "title": "Browse page: TikTok-style campaign feed with CPM badges", "file": "app/browse/page.tsx", "priority": 2, "status": "pending"},
    {"id": "creator-profiles", "title": "Creator profiles with stats, portfolio, CPM rate", "file": "app/creators/[id]/page.tsx", "priority": 3, "status": "pending"},
    {"id": "trust-signals", "title": "Trust badges: verified views, approval rate, payout stats", "file": "components/TrustBadges.tsx", "priority": 3, "status": "pending"},
    {"id": "onboarding-flow", "title": "Interactive onboarding wizard for first-time users", "file": "components/OnboardingWizard.tsx", "priority": 4, "status": "pending"},
    {"id": "search-filter", "title": "Advanced search/filter with genre, CPM range, platform", "file": "components/CampaignSearch.tsx", "priority": 4, "status": "pending"},
    {"id": "payout-calc", "title": "Real-time earnings calculator in browse flow", "file": "app/browse/page.tsx", "priority": 5, "status": "pending"},
    {"id": "referral-system", "title": "Referral program: share link, earn commission", "file": "app/api/referral/route.ts", "priority": 5, "status": "pending"},
    {"id": "mobile-responsive", "title": "Audit and fix mobile layout issues across all pages", "file": "app/globals.css", "priority": 1, "status": "pending"},
]

def save_queue():
    QUEUE_FILE.parent.mkdir(exist_ok=True)
    with open(QUEUE_FILE, "w") as f:
        json.dump({"updated": datetime.now().isoformat(), "queue": QUEUE}, f, indent=2)

def get_locks():
    if LOCKS_FILE.exists():
        return json.loads(LOCKS_FILE.read_text())
    return {}

def save_locks(locks: dict):
    LOCKS_FILE.parent.mkdir(exist_ok=True)
    with open(LOCKS_FILE, "w") as f:
        json.dump(locks, f, indent=2)

def acquire_lock(task_id: str, agent_id: str) -> bool:
    locks = get_locks()
    if task_id in locks:
        return False  # Already locked
    locks[task_id] = {"agent": agent_id, "since": datetime.now().isoformat()}
    save_locks(locks)
    return True

def release_lock(task_id: str):
    locks = get_locks()
    locks.pop(task_id, None)
    save_locks(locks)

def get_next_task(agent_id: str) -> Optional[dict]:
    """Get the highest-priority unlocked task."""
    locks = get_locks()
    for task in sorted(QUEUE, key=lambda t: t["priority"]):
        if task["status"] == "pending" and task["id"] not in locks:
            if acquire_lock(task["id"], agent_id):
                return task
    return None

def mark_done(task_id: str):
    for t in QUEUE:
        if t["id"] == task_id:
            t["status"] = "completed"
    release_lock(task_id)
    save_queue()

def status():
    pending = sum(1 for t in QUEUE if t["status"] == "pending")
    completed = sum(1 for t in QUEUE if t["status"] == "completed")
    locks = get_locks()
    print(f"\n  Autonomous Task Queue — {completed}/{len(QUEUE)} done")
    print(f"  Locks: {len(locks)} active")
    for t in sorted(QUEUE, key=lambda t: t["priority"]):
        icon = "✅" if t["status"] == "completed" else "🔒" if t["id"] in locks else "⬚"
        print(f"  {icon} [{t['priority']}] {t['title']} ({t['file']})")
    print()

if __name__ == "__main__":
    import sys
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "status":
        status()
    elif cmd == "next":
        task = get_next_task("cli")
        if task:
            print(f"  ▶ {task['title']} → {task['file']}")
        else:
            print("  ✅ All tasks locked or done")
