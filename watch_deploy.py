#!/usr/bin/env python3
"""
SendMusic.io Auto-Deploy Watcher
=================================
Watches for new git commits and auto-deploys to Railway.
Run in background: python3 watch_deploy.py &

Usage:
  python3 watch_deploy.py       # Watch forever, deploy on commit
  python3 watch_deploy.py once  # Deploy once and exit
"""

import os, sys, time, subprocess
from pathlib import Path
from datetime import datetime

AGENT_DIR = Path(__file__).resolve().parent

def get_latest_commit():
    result = subprocess.run(["git", "log", "-1", "--format=%H"], cwd=AGENT_DIR,
                            capture_output=True, text=True)
    return result.stdout.strip() if result.returncode == 0 else None

def deploy():
    print(f"  🚀 Deploying to Railway...")
    subprocess.run(["npm", "run", "build"], cwd=AGENT_DIR, capture_output=True)
    result = subprocess.run(["railway", "up", "--service", "selah-fm"],
                            cwd=AGENT_DIR, capture_output=True, text=True)
    print(f"  ✅ Deployed — {datetime.now().strftime('%H:%M:%S')}")
    return result.returncode == 0

def main():
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("cmd", nargs="?", default="watch", choices=["watch", "once"])
    args = p.parse_args()

    if args.cmd == "once":
        deploy()
    else:
        print("  Watching for git commits... (Ctrl+C to stop)")
        last_commit = get_latest_commit()
        while True:
            time.sleep(30)
            current = get_latest_commit()
            if current and current != last_commit:
                print(f"\n  🔄 New commit detected: {current[:8]}")
                deploy()
                last_commit = current

if __name__ == "__main__":
    main()
