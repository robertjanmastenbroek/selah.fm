#!/usr/bin/env python3
"""
SendMusic.io Outreach Agent
=============================
Reuses patterns from CoolCompanion's Instagram DM agent.
Targets: Artists (Spotify 1k-50k monthly listeners) + Creators (TikTok 5k-50k followers).

Usage:
  python3 outreach_agent.py search artists   # Find artists to DM
  python3 outreach_agent.py search creators  # Find creators to DM
  python3 outreach_agent.py send --type artists --limit 20 --dry-run
"""

import argparse, csv, os, random, sys
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

AGENT_DIR = Path(__file__).resolve().parent
DATA_DIR = AGENT_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# Load Command Centre .env
CC_ENV = Path("/Users/motomoto/Documents/Robert-Jan Mastenbroek Command Centre/.env")
if CC_ENV.exists():
    with open(CC_ENV) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ[k.strip()] = v.strip().strip('"').strip("'")

TARGET_HASHTAGS_ARTISTS = [
    "indiemusician", "musicmarketing", "unsignedartist", "electronicmusic",
    "newmusic", "spotifyartist", "musicproducer", "independentartist",
    "tribaltechno", "psytrance", "organichouse", "christianedm",
]

TARGET_HASHTAGS_CREATORS = [
    "contentcreator", "tiktokcreator", "ugccreator", "influencer",
    "musiccontent", "musicpromo", "reelscreator", "shortformcontent",
]

DM_TEMPLATES = {
    "artist_invite": {
        "subject": "Promote your music on TikTok/Reels — only pay for real views",
        "body": (
            "Hi {first_name},\n\n"
            "I'm building SendMusic.io — a new platform where artists set a budget and "
            "creators make TikToks/Reels with your track. You set the CPM rate, review "
            "every video, and only pay for verified views. Max payout cap per video so "
            "your budget stays safe.\n\n"
            "Launching with a pilot cohort — 10 artists, 50 creators. Would you be "
            "interested in being one of the first?\n\n"
            "No upfront costs. 5% platform fee only when you pay for views.\n\n"
            "Let me know!\n{your_name}"
        ),
    },
    "creator_invite": {
        "subject": "Get paid for TikToks/Reels — browse music campaigns, earn CPM",
        "body": (
            "Hey {first_name},\n\n"
            "I'm building SendMusic.io — artists post music campaigns with CPM rates "
            "($ per 1,000 views). You browse, pick tracks you love, create content, "
            "and get paid for verified views.\n\n"
            "See CPM rates and budgets upfront. Submit your link. Artist reviews and "
            "approves. Automatic payouts.\n\n"
            "Launching a pilot cohort. Want early access?\n\n"
            "{your_name}"
        ),
    },
}

@dataclass
class Target:
    username: str
    full_name: str
    followers: int
    platform: str
    niche: str
    bio: str = ""
    score: int = 0

    @property
    def first_name(self) -> str:
        return self.full_name.split()[0]

# Mock targets
MOCK_ARTISTS = [
    Target("producerdave", "Dave Chen", 32000, "spotify", "electronic", "Electronic music producer. 32K monthly listeners."),
    Target("luna_beats", "Luna Park", 18000, "spotify", "organichouse", "Organic house producer. Berlin based."),
    Target("synthpriest", "Marcus J", 45000, "spotify", "psytrance", "Psytrance producer. Releases on Nano Records."),
    Target("holyfreq", "Sarah Kim", 8500, "spotify", "christianedm", "Christian EDM artist. Worship meets bass."),
    Target("desert_sounds", "Amir H", 22000, "spotify", "tribaltechno", "Tribal techno from Morocco."),
]

MOCK_CREATORS = [
    Target("creatormia", "Mia Johnson", 28000, "tiktok", "music", "TikTok creator. Music + lifestyle content."),
    Target("dancewithjake", "Jake Miller", 45000, "tiktok", "dance", "Dance content creator. 45K followers."),
    Target("viralqueen", "Rachel T", 35000, "instagram", "lifestyle", "Lifestyle creator. Reels-focused."),
    Target("shortsguy", "Tom Wells", 18000, "youtube", "shorts", "YouTube Shorts creator. Music promo niche."),
    Target("reelmasters", "Alex + Sam", 22000, "instagram", "music", "Music reel creators. Worked with major labels."),
]


def score_target(t: Target, target_type: str) -> int:
    score = 0
    if 5000 <= t.followers <= 50000: score += 30
    elif 50000 < t.followers <= 100000: score += 20
    else: score += 10
    return min(score, 100)


def search(type_: str, limit: int = 20):
    pool = MOCK_ARTISTS if type_ == "artists" else MOCK_CREATORS
    scored = sorted(pool, key=lambda t: score_target(t, type_), reverse=True)
    return scored[:limit]


def send_dms(targets: list[Target], template_name: str, dry_run: bool = True, your_name: str = "Robert-Jan"):
    template = DM_TEMPLATES.get(template_name, DM_TEMPLATES["artist_invite"])
    results = []

    for t in targets:
        body = template["body"].format(first_name=t.first_name, full_name=t.full_name, your_name=your_name)
        if dry_run:
            print(f"\n{'─'*50}")
            print(f"[DRY RUN] To: @{t.username} ({t.full_name})")
            print(f"  Platform: {t.platform} · Followers: {t.followers:,}")
            print(f"  {body[:200]}...")
        else:
            print(f"  ✉ Sending to @{t.username}...")
        results.append({"username": t.username, "status": "dry_run" if dry_run else "sent"})
    return results


def main():
    parser = argparse.ArgumentParser(description="SendMusic.io Outreach Agent")
    sub = parser.add_subparsers(dest="cmd")
    p_search = sub.add_parser("search")
    p_search.add_argument("type", choices=["artists", "creators"])
    p_search.add_argument("--limit", "-n", type=int, default=10)

    p_send = sub.add_parser("send")
    p_send.add_argument("--type", choices=["artists", "creators"], required=True)
    p_send.add_argument("--limit", "-n", type=int, default=20)
    p_send.add_argument("--dry-run", action="store_true")
    p_send.add_argument("--name", default="Robert-Jan")

    args = parser.parse_args()
    if not args.cmd:
        parser.print_help()
        return

    if args.cmd == "search":
        targets = search(args.type, args.limit)
        print(f"\n  {args.type.upper()} ({len(targets)} found):\n")
        for t in targets:
            print(f"  @{t.username:<20} {t.full_name:<20} {t.followers:>8,} {t.platform:<10} {t.niche}")
    elif args.cmd == "send":
        targets = search(args.type, args.limit)
        tmpl = "artist_invite" if args.type == "artists" else "creator_invite"
        results = send_dms(targets, tmpl, dry_run=args.dry_run, your_name=args.name)
        print(f"\n  {'[DRY RUN] Would send' if args.dry_run else 'Sent'} {len(results)} DMs.")


if __name__ == "__main__":
    main()
