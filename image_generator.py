#!/usr/bin/env python3
"""
sendmusic.io Image Generator — Midjourney API via midapi.ai
============================================================
Generates landing page images using Midjourney v7.
API: https://api.midapi.ai/api/v1/mj
"""

import os, sys, json, time, urllib.request
from pathlib import Path
from datetime import datetime

AGENT_DIR = Path(__file__).resolve().parent
IMAGES_DIR = AGENT_DIR / "public" / "images"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

# Load creds from Command Centre .env
CC_ENV = Path("/Users/motomoto/Documents/Robert-Jan Mastenbroek Command Centre/.env")
if CC_ENV.exists():
    with open(CC_ENV) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                k = k.strip(); v = v.strip().strip('"').strip("'")
                if k not in os.environ: os.environ[k] = v

MJ_API_KEY = os.getenv("MJ_API_KEY")
MJ_BASE = "https://api.midapi.ai/api/v1/mj"

# ---- Image briefs ----
BRIEFS = {
    "hero": {
        "filename": "hero-illustration.png",
        "prompt": (
            "Abstract digital illustration for a music promotion SaaS platform. "
            "Dark charcoal background with warm gold glowing accents. Stylized sound waves "
            "flowing upward into an ascending line graph, subtle translucent play-button icons "
            "floating. Clean modern tech-startup style, minimalist geometric shapes. "
            "No text, no faces, no realistic elements. Professional SaaS marketing illustration. "
            "--no text,faces,photorealistic,watermark"
        ),
        "aspectRatio": "16:9",
    },
    "dashboard": {
        "filename": "dashboard-mockup.png",
        "prompt": (
            "Clean dark-mode software UI dashboard mockup for a music promotion platform. "
            "A card showing campaign statistics with bold gold numbers, a thin gold horizontal "
            "progress bar at 25%. Dark charcoal background, gold accent elements, modern card-based "
            "layout with subtle shadows. Professional SaaS dashboard aesthetic, looks like a real "
            "product screenshot. Pure UI mockup style. "
            "--no faces,photos,realistic people,watermark"
        ),
        "aspectRatio": "4:3",
    },
    "browse": {
        "filename": "browse-mockup.png",
        "prompt": (
            "Mobile phone screen mockup showing a vertical feed of music promotion campaign cards "
            "on dark background. Each card shows a track name in white, a gold CPM badge, budget "
            "remaining, and a 'Join campaign' button. Cards stacked vertically with soft shadows, "
            "TikTok-inspired UI layout. Gold and charcoal color scheme, clean modern mobile app. "
            "Pure UI concept, no real text content. "
            "--no faces,photos,realistic people,watermark"
        ),
        "aspectRatio": "4:5",
    },
    "earnings": {
        "filename": "earnings-visual.png",
        "prompt": (
            "Abstract data visualization showing an upward-trending gold line graph on dark charcoal "
            "background. Sparkle effects at data points along the rising curve. Small translucent "
            "TikTok and Instagram Reels video icons placed along the timeline representing content "
            "creation milestones and growing earnings. Professional fintech-meets-creator-economy "
            "visual style. Clean minimalist composition. "
            "--no text,faces,watermark"
        ),
        "aspectRatio": "16:9",
    },
}


def midjourney_generate(prompt: str, aspect_ratio: str = "16:9") -> str:
    """Submit to Midjourney API, wait for completion, return image URL."""
    import requests

    resp = requests.post(
        f"{MJ_BASE}/generate",
        headers={"Authorization": f"Bearer {MJ_API_KEY}", "Content-Type": "application/json"},
        json={
            "taskType": "mj_txt2img",
            "prompt": prompt,
            "aspectRatio": aspect_ratio,
            "version": "7",
            "stylization": 100,
        },
    )
    data = resp.json()
    if data.get("code") != 200:
        raise Exception(f"MJ generate failed: {data.get('msg', resp.text)}")
    task_id = data["data"]["taskId"]
    print(f"    Task: {task_id}")

    # Poll until done
    for attempt in range(40):  # ~10 min max
        time.sleep(15)
        status = requests.get(
            f"{MJ_BASE}/record-info?taskId={task_id}",
            headers={"Authorization": f"Bearer {MJ_API_KEY}"},
        ).json()
        flag = status.get("data", {}).get("successFlag")
        if flag == 1:
            urls = status["data"]["resultInfoJson"]["resultUrls"]
            return urls[0]["resultUrl"]
        elif flag in (2, 3):
            raise Exception(f"MJ task failed: {status.get('data',{}).get('errorMessage','unknown')}")
        print(f"    Waiting... (attempt {attempt+1})")
    raise Exception("MJ timeout")


def generate(brief_id: str):
    brief = BRIEFS.get(brief_id)
    if not brief: return

    out = IMAGES_DIR / brief["filename"]
    if out.exists():
        print(f"  ⏭ {brief_id} exists: {out.name}")
        return str(out)

    print(f"\n  🎨 {brief_id}")
    try:
        url = midjourney_generate(brief["prompt"], brief["aspectRatio"])
        urllib.request.urlretrieve(url, str(out))
        print(f"    ✅ {out.name}")
        return str(out)
    except Exception as e:
        print(f"    ❌ {e}")
        return None


def generate_all():
    if not MJ_API_KEY:
        print("Set MJ_API_KEY in Command Centre .env")
        return
    print(f"\n  sendmusic.io Image Generator (Midjourney v7)")
    print(f"  Output: {IMAGES_DIR}\n")
    for bid in BRIEFS:
        generate(bid)
        time.sleep(3)
    print(f"\n  Done.")


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("cmd", nargs="?", default="all", choices=["all","hero","dashboard","browse","earnings"])
    args = p.parse_args()
    if args.cmd == "all":
        generate_all()
    else:
        if not MJ_API_KEY:
            print("Set MJ_API_KEY"); sys.exit(1)
        generate(args.cmd)
