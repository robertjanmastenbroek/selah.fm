#!/usr/bin/env python3
"""
SendMusic.io Autonomous Orchestrator
=====================================
#1 priority project. Self-directed task manager that drives the build
queue for the CPM music promotion marketplace.

Goal: $10k GMV in 90 days. 50 artists, 200 creators, 20 campaigns.
Reuses patterns from CoolCompanion but focused entirely on SendMusic.io.

Usage:
  python3 orchestrator.py status       # Full build status
  python3 orchestrator.py next         # Show highest-priority next task
  python3 orchestrator.py plan         # Full prioritized build plan
  python3 orchestrator.py evaluate     # Rescan filesystem
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

AGENT_DIR = Path(__file__).resolve().parent
TASKS_PATH = AGENT_DIR / "tasks.json"

BUILD_PLAN = {
    "project": "SendMusic.io",
    "priority": "#1 — all efforts focused here",
    "goal": "$10k GMV in 90 days, 50 artists, 200 creators, 20 campaigns",
    "principle": "Launch fast. Real marketplace first. Outreach after.",
    "phases": [
        {
            "id": "phase_0_foundation",
            "name": "Phase 0 — Foundation",
            "priority": 0,
            "description": "Landing page, project rename, orchestrator. Done.",
            "tasks": [
                {"id": "landing_page", "name": "Landing page + waitlist", "roi": "critical", "estimated_minutes": 60, "dependencies": [], "output_files": ["app/page.tsx"]},
                {"id": "orchestrator", "name": "Autonomous orchestrator", "roi": "foundational", "estimated_minutes": 30, "dependencies": [], "output_files": ["orchestrator.py", "tasks.json"]},
                {"id": "railway_deploy", "name": "Deploy to Railway", "roi": "critical", "estimated_minutes": 15, "dependencies": ["landing_page"], "output_files": ["railway.json"]},
            ]
        },
        {
            "id": "phase_1_core",
            "name": "Phase 1 — Core Marketplace",
            "priority": 1,
            "description": "Database, auth, campaign system — the actual product.",
            "tasks": [
                {"id": "database_schema", "name": "PostgreSQL schema — users, campaigns, submissions, payments", "roi": "critical", "estimated_minutes": 60, "dependencies": [], "output_files": ["lib/db/schema.sql"]},
                {"id": "auth_system", "name": "Auth — sign up / login for artists + creators", "roi": "critical", "estimated_minutes": 90, "dependencies": ["database_schema"], "output_files": ["app/login/page.tsx", "app/api/auth/login/route.ts", "app/api/auth/signup/route.ts"]},
                {"id": "artist_dashboard", "name": "Artist dashboard — campaign creation, CPM + max payout, track upload, manual content review, analytics", "roi": "critical", "estimated_minutes": 180, "dependencies": ["auth_system"], "output_files": ["app/dashboard/page.tsx", "app/review/page.tsx"]},
                {"id": "creator_dashboard", "name": "Creator dashboard — browse campaigns, apply, submit content, earnings", "roi": "critical", "estimated_minutes": 150, "dependencies": ["auth_system", "artist_dashboard"], "output_files": ["app/browse/page.tsx", "app/earnings/page.tsx"]},
                {"id": "stripe_connect", "name": "Stripe Connect — escrow, auto-payouts, platform fee", "roi": "critical", "estimated_minutes": 120, "dependencies": ["artist_dashboard", "creator_dashboard"], "output_files": ["app/api/stripe/connect/route.ts", "app/api/stripe/payout/route.ts"]},
            ]
        },
        {
            "id": "phase_2_verification",
            "name": "Phase 2 — View Verification",
            "priority": 2,
            "description": "API integration to verify TikTok/IG/YouTube views before paying creators.",
            "tasks": [
                {"id": "view_verification", "name": "View verification — TikTok/IG/YT API integration", "roi": "high", "estimated_minutes": 150, "dependencies": ["stripe_connect"], "output_files": ["lib/verification/tiktok.ts", "lib/verification/instagram.ts", "lib/verification/youtube.ts"]},
                {"id": "auto_payout", "name": "Auto-payout system — daily/weekly payouts at thresholds", "roi": "high", "estimated_minutes": 90, "dependencies": ["stripe_connect", "view_verification"], "output_files": ["app/api/cron/payouts/route.ts"]},
            ]
        },
        {
            "id": "phase_3_outreach",
            "name": "Phase 3 — Outreach & Launch",
            "priority": 3,
            "description": "Reuse outreach agent pattern to recruit artists + creators. Launch with pilot.",
            "tasks": [
                {"id": "outreach_agent", "name": "Outreach agent — DM artists (Spotify 1k-50k) + creators (TikTok 5k-50k)", "roi": "high", "estimated_minutes": 120, "dependencies": ["landing_page"], "output_files": ["outreach_agent.py"]},
                {"id": "pilot_launch", "name": "Pilot launch — 10 artists + 50 creators, first campaigns", "roi": "critical", "estimated_minutes": 60, "dependencies": ["artist_dashboard", "creator_dashboard", "stripe_connect"], "output_files": []},
            ]
        },
    ]
}


class Orchestrator:
    def __init__(self):
        self.plan = BUILD_PLAN
        self.tasks_path = TASKS_PATH
        self.state = self._load_state()

    def _load_state(self) -> dict:
        if self.tasks_path.exists():
            with open(self.tasks_path) as f:
                return json.load(f)
        return self._init_state()

    def _init_state(self) -> dict:
        state = {"initialized": datetime.now().isoformat(), "phase_statuses": {}, "task_statuses": {}}
        for phase in self.plan["phases"]:
            state["phase_statuses"][phase["id"]] = "pending"
            for task in phase["tasks"]:
                state["task_statuses"][task["id"]] = "pending"
        return state

    def save_state(self):
        self.state["last_updated"] = datetime.now().isoformat()
        with open(self.tasks_path, "w") as f:
            json.dump(self.state, f, indent=2)

    def evaluate(self) -> dict:
        changes = {"newly_completed": [], "still_pending": []}
        for phase in self.plan["phases"]:
            for task in phase["tasks"]:
                current = self.state["task_statuses"].get(task["id"], "pending")
                actual = self._detect(task)
                if actual == "completed" and current != "completed":
                    self.state["task_statuses"][task["id"]] = "completed"
                    changes["newly_completed"].append(task["id"])
                elif actual == "pending":
                    changes["still_pending"].append(task["id"])
            phase_tasks = [t["id"] for t in phase["tasks"]]
            all_done = all(self.state["task_statuses"].get(t) == "completed" for t in phase_tasks)
            any_started = any(self.state["task_statuses"].get(t) != "pending" for t in phase_tasks)
            self.state["phase_statuses"][phase["id"]] = "completed" if all_done else "in_progress" if any_started else "pending"
        self.state["last_evaluated"] = datetime.now().isoformat()
        self.save_state()
        return changes

    def _detect(self, task: dict) -> str:
        files = task.get("output_files", [])
        if not files:
            return "pending"
        return "completed" if all((AGENT_DIR / f).exists() for f in files) else "pending"

    def get_next(self) -> dict | None:
        self.evaluate()
        for phase in sorted(self.plan["phases"], key=lambda p: p["priority"]):
            if self.state["phase_statuses"].get(phase["id"]) == "completed":
                continue
            for task in phase["tasks"]:
                tid = task["id"]
                if self.state["task_statuses"].get(tid) == "completed":
                    continue
                deps_met = all(self.state["task_statuses"].get(d) == "completed" for d in task.get("dependencies", []))
                if deps_met:
                    return {"task": task, "phase": phase["name"], "priority": phase["priority"]}
        return None

    def print_status(self):
        self.evaluate()
        total = sum(len(p["tasks"]) for p in self.plan["phases"])
        done = sum(1 for p in self.plan["phases"] for t in p["tasks"] if self.state["task_statuses"].get(t["id"]) == "completed")
        pct = int(done / total * 100) if total else 0

        print(f"\n{'='*60}")
        print(f"  SendMusic.io Autonomous Orchestrator — PRIORITY #1")
        print(f"  Progress: {done}/{total} tasks ({pct}%)")
        print(f"  Goal: $10k GMV, 50 artists, 200 creators, 20 campaigns")
        print(f"{'='*60}")

        for phase in sorted(self.plan["phases"], key=lambda p: p["priority"]):
            status = self.state["phase_statuses"].get(phase["id"], "pending")
            icon = "✅" if status == "completed" else "🔨" if status == "in_progress" else "⏳"
            print(f"\n  {icon} {phase['name']} [{status}]")
            for task in phase["tasks"]:
                ts = self.state["task_statuses"].get(task["id"], "pending")
                deps_met = all(self.state["task_statuses"].get(d) == "completed" for d in task.get("dependencies", []))
                t_icon = "✅" if ts == "completed" else "⬚" if deps_met else "🔒"
                print(f"  {t_icon} {task['id']:<30} [{task['roi']:<10}] ~{task['estimated_minutes']}m")
                if not deps_met and ts != "completed":
                    print(f"     └─ blocked: waiting for dependencies")

        next_task = self.get_next()
        print(f"\n{'='*60}")
        if next_task:
            print(f"  ▶ NEXT: {next_task['task']['name']}")
            print(f"     Phase: {next_task['phase']} | ROI: {next_task['task']['roi']} | ~{next_task['task']['estimated_minutes']}m")
        else:
            print(f"  ▶ All tasks complete. Ship it.")
        print(f"{'='*60}\n")


def main():
    import argparse
    parser = argparse.ArgumentParser(description="SendMusic.io Autonomous Orchestrator")
    parser.add_argument("command", nargs="?", default="status",
                        choices=["status", "next", "plan", "evaluate"])
    args = parser.parse_args()
    orch = Orchestrator()

    if args.command == "status":
        orch.print_status()
    elif args.command == "next":
        n = orch.get_next()
        if n:
            t = n["task"]
            print(f"\n  ▶ NEXT: {t['name']} ({n['phase']})")
            print(f"     ROI: {t['roi']} | ~{t['estimated_minutes']}m")
            print(f"     {t.get('description','')}")
        else:
            print("\n✅ All tasks complete.")
    elif args.command == "plan":
        print(f"\n  SendMusic.io Build Plan — PRIORITY #1\n")
        for phase in sorted(orch.plan["phases"], key=lambda p: p["priority"]):
            print(f"  ▸ {phase['name']}")
            for task in phase["tasks"]:
                print(f"    • {task['name']} [{task['roi']}] ~{task['estimated_minutes']}m")
    elif args.command == "evaluate":
        changes = orch.evaluate()
        print(f"\n📊 Newly completed: {len(changes['newly_completed'])}")
        for tid in changes["newly_completed"]:
            print(f"  ✅ {tid}")


if __name__ == "__main__":
    main()
