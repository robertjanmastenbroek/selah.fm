#!/usr/bin/env python3
"""
Selah.fm Autonomous Build Loop
================================
Continuous improvement engine. Trigger via orchestrator or cron.

Usage:
  python3 build_loop.py once      # Build + deploy one cycle
  python3 build_loop.py list      # Show improvement queue
"""

import subprocess, sys, json
from pathlib import Path
from datetime import datetime

AGENT_DIR = Path(__file__).resolve().parent

IMPROVEMENTS = [
    # Landing page
    "Add social proof section to landing page (creator earnings, stats)",
    "Add animated counter for stats bar on landing page",
    "Improve hero CTA copy: test 'Start your first campaign' vs current",
    # UX
    "Add loading skeletons to all list pages",
    "Add toast notifications for submit/approve/reject actions",
    "Add empty state illustrations for browse/creators/review",
    "Add pull-to-refresh on browse and creators pages",
    # Features
    "Add campaign search/filter on browse page",
    "Add creator search/filter on creators page",
    "Add notification bell with submission alerts",
    "Add Stripe Connect deposit flow in dashboard",
    "Add creator profile edit page (bio, genres, CPM rate)",
    # Performance
    "Optimize image loading with lazy loading",
    "Add page transition animations",
    "Compress Midjourney images to WebP",
    # SEO
    "Add structured data (JSON-LD) for campaign pages",
    "Create dynamic sitemap including all campaigns",
    "Add blog/news section for content marketing",
]

def build_and_deploy():
    print(f"  🔨 Running build...")
    r = subprocess.run(["npx", "next", "build"], cwd=AGENT_DIR, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  ❌ Build failed")
        return False
    print(f"  ✅ Build passed")
    r = subprocess.run(["railway", "up", "--service", "selah-fm"], cwd=AGENT_DIR, capture_output=True, text=True)
    print(f"  🚀 Deployed — {datetime.now().strftime('%H:%M')}")
    subprocess.run(["git", "add", "-A"], cwd=AGENT_DIR)
    subprocess.run(["git", "commit", "-m", f"Auto-improve: {datetime.now().strftime('%Y-%m-%d %H:%M')}"], cwd=AGENT_DIR)
    return True

def list_improvements():
    for i, item in enumerate(IMPROVEMENTS):
        print(f"  {i+1:>2}. {item}")

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "list"
    if cmd == "once":
        build_and_deploy()
    elif cmd == "list":
        list_improvements()
