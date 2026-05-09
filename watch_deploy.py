#!/usr/bin/env python3
"""Build watcher — auto-deploys on git changes to sendmusic.io"""
import subprocess, time, sys
from pathlib import Path

DIR = Path(__file__).resolve().parent
last_commit = subprocess.run(["git", "rev-parse", "HEAD"], cwd=DIR, capture_output=True, text=True).stdout.strip()

print(f"  👀 Watching {DIR} for changes...")
print(f"  Last commit: {last_commit[:8]}")

while True:
    time.sleep(30)
    current = subprocess.run(["git", "rev-parse", "HEAD"], cwd=DIR, capture_output=True, text=True).stdout.strip()
    if current != last_commit:
        print(f"\n  🔄 Change detected! Deploying...")
        subprocess.run(["railway", "up", "--service", "sendmusic-io"], cwd=DIR)
        last_commit = current
        print(f"  ✅ Deployed {current[:8]}")
