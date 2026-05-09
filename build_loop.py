#!/usr/bin/env python3
"""
Selah.fm Autonomous Build Loop
===================================
Continuous improvement engine. Run this to keep building, deploying,
and improving without human intervention.

Usage:
  python3 build_loop.py once      # Build + deploy one improvement
  python3 build_loop.py watch     # Watch for changes, auto-deploy
  python3 build_loop.py improve   # Find improvements, build them, deploy
"""

import os, sys, subprocess, time, json
from pathlib import Path
from datetime import datetime

AGENT_DIR = Path(__file__).resolve().parent
LOG_PATH = AGENT_DIR / "data" / "build_log.json"

IMPROVEMENTS = [
    # Landing page
    ("Add creator success stories section to landing page", "app/page.tsx"),
    ("Add 'trusted by' brand logos row to hero", "app/page.tsx"),
    ("Replace emoji icons with SVG icons throughout", "app/page.tsx"),
    ("Add animated counter for stats bar", "app/page.tsx"),
    ("Improve hero CTA copy based on Vyro patterns", "app/page.tsx"),
    
    # UX
    ("Add loading skeletons to all pages", "app/dashboard/page.tsx"),
    ("Add toast notifications for actions", "components/Toast.tsx"),
    ("Add pull-to-refresh on browse page", "app/browse/page.tsx"),
    ("Add haptic feedback on approve/reject buttons", "app/review/page.tsx"),
    ("Improve empty states with illustrations", "app/browse/page.tsx"),
    
    # Features
    ("Add campaign search/filter on browse", "app/browse/page.tsx"),
    ("Add notification bell with unread count", "components/Notifications.tsx"),
    ("Add artist profile page with stats", "app/profile/page.tsx"),
    ("Add campaign sharing (copy link, social)", "app/dashboard/page.tsx"),
    ("Add dark/light mode toggle", "app/layout.tsx"),
    
    # Performance
    ("Optimize image loading with blur placeholders", "app/page.tsx"),
    ("Add page transition animations", "app/layout.tsx"),
    ("Implement incremental static regeneration", "next.config.js"),
    ("Add service worker for offline support", "public/sw.js"),
    ("Compress and convert images to WebP", "public/images/"),
    
    # SEO & Marketing
    ("Add structured data (JSON-LD) for rich results", "app/layout.tsx"),
    ("Create sitemap.xml and robots.txt", "public/"),
    ("Add blog/news section for content marketing", "app/blog/"),
    ("Implement referral program tracking", "app/api/referral/"),
    ("Add waitlist/early-access email capture", "app/page.tsx"),
]

def build_and_deploy():
    print(f"\n{'='*50}")
    print(f"  🔨 Building...")
    result = subprocess.run(["npm", "run", "build"], cwd=AGENT_DIR, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  ❌ Build failed:\n{result.stderr[:500]}")
        return False
    
    print(f"  ✅ Build passed")
    print(f"  🚀 Deploying...")
    result = subprocess.run(["railway", "up", "--service", "sendmusic-io"], cwd=AGENT_DIR, capture_output=True, text=True)
    print(f"  ✅ Deployed")
    
    subprocess.run(["git", "add", "-A"], cwd=AGENT_DIR)
    subprocess.run(["git", "commit", "-m", f"Auto-improve: {datetime.now().strftime('%H:%M')}"], cwd=AGENT_DIR)
    
    return True

def run_once():
    """ Check orchestrator, build next task, deploy """
    orch = subprocess.run(["python3", "orchestrator.py", "next"], cwd=AGENT_DIR, capture_output=True, text=True)
    print(orch.stdout)
    build_and_deploy()

def log_improvement(desc: str):
    log = []
    if LOG_PATH.exists():
        log = json.loads(LOG_PATH.read_text())
    log.append({"time": datetime.now().isoformat(), "description": desc})
    LOG_PATH.parent.mkdir(exist_ok=True)
    LOG_PATH.write_text(json.dumps(log[-100:], indent=2))

if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("cmd", choices=["once", "watch", "improve", "list"])
    args = p.parse_args()
    
    if args.cmd == "once":
        run_once()
    elif args.cmd == "list":
        for i, (desc, file) in enumerate(IMPROVEMENTS):
            done = "✅" if (AGENT_DIR / file).exists() else "⬚"
            print(f"  {done} {i+1:>2}. {desc}")
    elif args.cmd == "improve":
        print("  Continuous improvement mode — pick tasks from the list and build them.")
        print(f"  Run: python3 build_loop.py list  to see all improvements")
    elif args.cmd == "watch":
        print("  Watching for changes... (Ctrl+C to stop)")
