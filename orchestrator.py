#!/usr/bin/env python3
"""
Selah.fm Autonomous Orchestrator
=================================
Self-directed task manager. Reads project state, prioritizes work,
and drives continuous improvement.

Usage:
  python3 orchestrator.py status
  python3 orchestrator.py next
"""

import json, sys
from pathlib import Path
from datetime import datetime

AGENT_DIR = Path(__file__).resolve().parent
STATE_FILE = AGENT_DIR / "tasks.json"

# ═══════════════════════════════════════════════════════════════════════════════
# Build Plan — reflects everything built across 11 versions (v1 → v11)
# ═══════════════════════════════════════════════════════════════════════════════

BUILD_PLAN = {
    "project": "Selah.fm — CPM marketplace for music promotion",
    "goal": "MVP: artists deposit money, creators make content, artists review & pay for verified views",
    "url": "https://selah.fm",
    "versions_shipped": 11,
    "files_changed": "39+ over 11 commits",
    "phases": [

        # ── Phase 1: Foundation (v1) ────────────────────────────────────
        {"id": "foundation", "name": "Foundation", "done": True, "tasks": [
            {"id": "auth", "name": "Auth (Google OAuth + email/password + session management)", "done": True},
            {"id": "db_schema", "name": "PostgreSQL schema (users, campaigns, submissions, payouts, views, triggers)", "done": True},
            {"id": "campaign_crud", "name": "Campaign CRUD (create, list, detail, pause/resume)", "done": True},
            {"id": "submission_crud", "name": "Submission flow (join campaign → submit link → verify views)", "done": True},
            {"id": "review_flow", "name": "Artist review (approve/reject with payout calculation)", "done": True},
            {"id": "stripe_checkout", "name": "Stripe Checkout for campaign budget deposits", "done": True},
            {"id": "stripe_webhook", "name": "Stripe webhook (checkout.session.completed → update budget)", "done": True},
            {"id": "railway_deploy", "name": "Deployed to Railway (selah.fm)", "done": True},
        ]},

        # ── Phase 2: Core Features (v2-v3) ──────────────────────────────
        {"id": "core_features", "name": "Core Features", "done": True, "tasks": [
            {"id": "notifications", "name": "Real-time notifications (DB-backed, bell, polling, triggers on submit/approve/reject/payout)", "done": True},
            {"id": "earnings_page", "name": "Creator earnings page (live DB data, totals, submission history)", "done": True},
            {"id": "stripe_connect", "name": "Stripe Connect (Express account onboarding + payout transfers)", "done": True},
            {"id": "validation", "name": "Input validation + sanitization (campaigns, submissions, auth)", "done": True},
            {"id": "error_boundary", "name": "React ErrorBoundary wrapping entire app", "done": True},
            {"id": "rate_limiting", "name": "Rate limiting (login 10/min, signup 5/min)", "done": True},
            {"id": "typescript_types", "name": "Shared TypeScript types (User, Campaign, Submission, Notification)", "done": True},
            {"id": "seo", "name": "SEO (sitemap.xml, robots.txt, JSON-LD, OpenGraph)", "done": True},
        ]},

        # ── Phase 3: UX + Visual (v4-v8) ────────────────────────────────
        {"id": "ux_visual", "name": "UX & Visual Polish", "done": True, "tasks": [
            {"id": "landing_page", "name": "High-converting landing page (10 sections, research-backed, animated)", "done": True},
            {"id": "campaign_covers", "name": "CampaignCover component (images + deterministic gradient fallbacks)", "done": True},
            {"id": "creator_avatars", "name": "CreatorAvatar component (images + gradient initials)", "done": True},
            {"id": "demo_data", "name": "Demo data with real Unsplash images (6 campaigns, 5 creators)", "done": True},
            {"id": "nav_restructure", "name": "Navigation restructure (Campaigns | Artists | Creators | Profile dropdown)", "done": True},
            {"id": "artists_page", "name": "Artists directory (artists with active campaigns, stats)", "done": True},
            {"id": "browse_filters", "name": "Browse filtering (search, platform, CPM) + pagination", "done": True},
            {"id": "campaign_management", "name": "Campaign pause/resume management", "done": True},
            {"id": "dashboard_stats", "name": "Dashboard aggregate stats (active, submissions, views, spent)", "done": True},
            {"id": "review_scoping", "name": "Review page campaign selector dropdown", "done": True},
            {"id": "hire_flow", "name": "Creator hire flow (hire button → dashboard pre-fill)", "done": True},
            {"id": "toast_notifications", "name": "Toast notifications (browse submit, review approve/reject, settings save)", "done": True},
        ]},

        # ── Phase 4: Onboarding + Social (v9-v10) ───────────────────────
        {"id": "onboarding", "name": "Onboarding & Social", "done": True, "tasks": [
            {"id": "onboarding_wizard", "name": "3-step onboarding wizard (role → profile → social verification)", "done": True},
            {"id": "oauth_google", "name": "Google OAuth for everyone (production mode, redirects to onboarding)", "done": True},
            {"id": "oauth_social", "name": "Social OAuth infrastructure (TikTok, Instagram, YouTube, Facebook connect routes + callback)", "done": True},
            {"id": "verified_badges", "name": "Verified badges on creator/artist cards", "done": True},
            {"id": "settings_page", "name": "Settings page (5 platforms, PATCH /api/auth/me, Toast)", "done": True},
            {"id": "view_verification", "name": "View verification (YouTube auto via public API, TikTok oEmbed, Instagram manual)", "done": True},
        ]},

        # ── Phase 5: MVP Completion (CURRENT) ───────────────────────────
        {"id": "mvp_completion", "name": "MVP Completion", "done": False, "tasks": [
            {"id": "payment_e2e", "name": "Verify end-to-end payment flow (deposit → submit → review → payout → budget update)", "done": False},
            {"id": "budget_trigger", "name": "Fix budget update trigger on payout_status change", "done": False},
            {"id": "auto_payout", "name": "Auto-payout on approval (or manual payout button)", "done": False},
            {"id": "ownership_check", "name": "Add submission ownership check (only campaign artist can review)", "done": False},
            {"id": "budget_exhaustion", "name": "Handle budget exhaustion (auto-pause campaign, prevent submissions)", "done": False},
            {"id": "stripe_connect_error", "name": "Handle missing Stripe Connect gracefully (show 'Set up payouts' prompt)", "done": False},
            {"id": "mobile_audit", "name": "Mobile responsiveness audit (all pages at 375px)", "done": False},
            {"id": "e2e_tests", "name": "Run E2E tests against production (25 test cases)", "done": False},
            {"id": "cron_views", "name": "Set up cron job for YouTube view auto-updates", "done": False},
        ]},

        # ── Phase 6: Launch Readiness ──────────────────────────────────
        {"id": "launch", "name": "Launch Readiness", "done": False, "tasks": [
            {"id": "seed_users", "name": "Seed 20+ real-looking users (artists + creators with profile images)", "done": False},
            {"id": "seed_campaigns", "name": "Seed 15+ campaigns with varied CPM rates, budgets, and requirements", "done": False},
            {"id": "seed_submissions", "name": "Seed submissions with varied statuses (pending, approved, rejected, paid)", "done": False},
            {"id": "landing_copy", "name": "Final landing page copy review (headlines, CTAs, social proof numbers)", "done": False},
            {"id": "stripe_live", "name": "Switch Stripe from test mode to live mode", "done": False},
            {"id": "monitoring", "name": "Set up uptime monitoring (Railway health checks)", "done": False},
            {"id": "launch_checklist", "name": "Pre-launch checklist (DNS, SSL, env vars, backup strategy)", "done": False},
        ]},
    ]
}


def status():
    """Print full build status."""
    total = sum(len(p["tasks"]) for p in BUILD_PLAN["phases"])
    done = sum(1 for p in BUILD_PLAN["phases"] for t in p["tasks"] if t["done"])
    pct = int(done / total * 100) if total > 0 else 0
    
    print(f"\n  🎵 Selah.fm — {done}/{total} tasks ({pct}%)")
    print(f"  🌐 https://selah.fm")
    print(f"  📦 {BUILD_PLAN['versions_shipped']} versions shipped")
    print()
    
    for phase in BUILD_PLAN["phases"]:
        pts = phase["tasks"]
        pdone = sum(1 for t in pts if t["done"])
        icon = "✅" if pdone == len(pts) else "🔨" if pdone > 0 else "⬚"
        print(f"  {icon} {phase['name']} ({pdone}/{len(pts)})")
        for t in pts:
            print(f"    {'✅' if t['done'] else '⬚'} {t['name']}")
        print()


def next_task():
    """Show the next undone task."""
    for phase in BUILD_PLAN["phases"]:
        for t in phase["tasks"]:
            if not t["done"]:
                print(f"\n  ▶ Next: [{phase['name']}] {t['name']}")
                return
    print("\n  ✅ All tasks complete!")


def update_state():
    """Save current state to tasks.json."""
    state = {
        "updated": datetime.now().isoformat(),
        "versions_shipped": BUILD_PLAN["versions_shipped"],
        "phases": [
            {
                "id": p["id"],
                "name": p["name"],
                "done": p["done"],
                "progress": f"{sum(1 for t in p['tasks'] if t['done'])}/{len(p['tasks'])}",
            }
            for p in BUILD_PLAN["phases"]
        ]
    }
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)
    print(f"  📝 State saved to tasks.json")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "status":
        status()
    elif cmd == "next":
        next_task()
    elif cmd == "save":
        update_state()
    else:
        print(f"  Usage: python3 orchestrator.py [status|next|save]")
