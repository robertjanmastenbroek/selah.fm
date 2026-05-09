#!/usr/bin/env python3
"""
sendmusic.io Landing Page Image Generator
==========================================
Generates professional illustrations and mockups for the landing page.
Uses Higgsfield AI (bytedance/seedream/v4).

Images needed:
  1. Hero illustration — abstract music + money/growth concept
  2. Artist dashboard mockup — campaign stats card
  3. Creator browse mockup — campaign cards feed
  4. Earnings visual — money/growth graph
  5. Background texture — subtle gradient/pattern
"""

import os, sys, json, time
from pathlib import Path
from datetime import datetime

AGENT_DIR = Path(__file__).resolve().parent
IMAGES_DIR = AGENT_DIR / "public" / "images"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

IMAGE_BRIEFS = {
    "hero": {
        "filename": "hero-illustration.png",
        "purpose": "Hero illustration — abstract music + growth concept, dark theme",
        "aspect_ratio": "16:9",
        "resolution": "2K",
        "prompt": (
            "Abstract digital illustration for a music promotion marketplace. Dark background (#08080d) "
            "with warm gold (#f0c040) accents. Stylized sound waves flowing upward into a growth graph, "
            "with subtle TikTok/Instagram-style play buttons floating. Clean, modern, tech-startup aesthetic. "
            "No text, no faces, no realistic elements — pure abstract illustration. "
            "Minimalist, premium, professional. Suitable for a SaaS landing page hero."
        ),
    },
    "dashboard": {
        "filename": "dashboard-mockup.png",
        "purpose": "Artist dashboard mockup — campaign stats card, dark UI",
        "aspect_ratio": "4:3",
        "resolution": "2K",
        "prompt": (
            "Clean dark-mode UI dashboard mockup for a music promotion platform. Shows campaign statistics: "
            "'8 submissions', '40K views', '$120 spent of $500' with a gold progress bar. Dark background, "
            "gold accent colors, modern card-based layout. Professional SaaS dashboard design. "
            "No real text needed — the mockup should look like a screenshot of a real product. "
            "Clean, minimal, high-end software UI aesthetic."
        ),
    },
    "browse": {
        "filename": "browse-mockup.png",
        "purpose": "Creator browse mockup — campaign cards, TikTok-style feed",
        "aspect_ratio": "4:5",
        "resolution": "2K",
        "prompt": (
            "Mobile app mockup showing a feed of music promotion campaign cards. Each card shows a track name, "
            "CPM rate (e.g. '$3 per 1K views'), budget remaining, and a 'Join campaign' button. Dark theme "
            "with gold accents. TikTok-inspired vertical card layout. Modern mobile UI design. "
            "The cards are stacked vertically with slight shadows, showing different campaign details. "
            "Clean, professional music-tech app aesthetic. No real faces or photos."
        ),
    },
    "earnings": {
        "filename": "earnings-visual.png",
        "purpose": "Creator earnings visual — growth graph + money concept",
        "aspect_ratio": "16:9",
        "resolution": "2K",
        "prompt": (
            "Abstract illustration showing creator earnings growth. A rising gold line graph on dark background "
            "with sparkle effects at data points. Subtle TikTok/Reels video icons along the timeline showing "
            "content creation milestones. Professional, inspiring, clean design. "
            "Represents: 'creators earn money from their content'. Dark theme (#08080d) with gold (#f0c040). "
            "SaaS marketing illustration style. No faces, no text."
        ),
    },
}

def check_creds():
    if not os.getenv("HF_API_KEY") or not os.getenv("HF_API_SECRET"):
        print("Set HF_API_KEY and HF_API_SECRET")
        return False
    return True

def generate(brief_id: str):
    brief = IMAGE_BRIEFS.get(brief_id)
    if not brief:
        print(f"Unknown: {brief_id}")
        return None
    
    out = IMAGES_DIR / brief["filename"]
    if out.exists():
        print(f"  ⏭ {brief_id} exists: {out.name}")
        return str(out)
    
    print(f"\n  🎨 {brief['purpose']}")
    try:
        import higgsfield_client
        result = higgsfield_client.subscribe(
            "bytedance/seedream/v4/text-to-image",
            arguments={
                "prompt": brief["prompt"],
                "resolution": brief["resolution"],
                "aspect_ratio": brief["aspect_ratio"],
                "camera_fixed": False,
            },
        )
        url = result["images"][0]["url"]
        import urllib.request
        urllib.request.urlretrieve(url, str(out))
        print(f"    ✅ {out.name}")
        return str(out)
    except ImportError:
        print("    ❌ pip install higgsfield-client")
        return None
    except Exception as e:
        print(f"    ❌ {e}")
        return None

def generate_all():
    if not check_creds():
        return
    print(f"\n  sendmusic.io Image Generator")
    print(f"  Output: {IMAGES_DIR}\n")
    for bid in IMAGE_BRIEFS:
        generate(bid)
        time.sleep(2)
    print(f"\n  Done. Images in {IMAGES_DIR}")

if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("cmd", nargs="?", default="all", choices=["all","hero","dashboard","browse","earnings"])
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()
    
    if args.dry_run:
        for bid, brief in IMAGE_BRIEFS.items():
            print(f"\n  [{bid}] {brief['purpose']}")
            print(f"    {brief['prompt'][:120]}...")
        sys.exit(0)
    
    if args.cmd == "all":
        generate_all()
    else:
        if not check_creds():
            sys.exit(1)
        generate(args.cmd)
