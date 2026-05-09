#!/usr/bin/env python3
"""Watch for file changes and auto-deploy to Railway."""

import subprocess, time, os
from pathlib import Path
from datetime import datetime

AGENT_DIR = Path(__file__).resolve().parent
last_deploy = datetime.now()
cooldown_minutes = 5

def get_modified():
    r = subprocess.run(["git", "diff", "--name-only", "HEAD"], cwd=AGENT_DIR, capture_output=True, text=True)
    return [f for f in r.stdout.strip().split("\n") if f]

def deploy():
    global last_deploy
    print(f"\n  🚀 Deploying at {datetime.now().strftime('%H:%M:%S')}...")
    subprocess.run(["git", "add", "-A"], cwd=AGENT_DIR)
    subprocess.run(["git", "commit", "-m", f"watchdog deploy {datetime.now().strftime('%H:%M')}"], cwd=AGENT_DIR)
    subprocess.run(["railway", "up", "--service", "selah-fm"], cwd=AGENT_DIR)
    last_deploy = datetime.now()

if __name__ == "__main__":
    print(f"  👀 Watching for changes... (deploy cooldown: {cooldown_minutes} min)")
    while True:
        modified = get_modified()
        if modified:
            elapsed = (datetime.now() - last_deploy).total_seconds()
            if elapsed > cooldown_minutes * 60:
                print(f"  📝 {len(modified)} files changed: {', '.join(modified[:3])}")
                deploy()
        time.sleep(30)
