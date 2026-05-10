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

BUILD_PLAN = {
    "project": "Selah.fm — CPM marketplace for music promotion",
    "goal": "Artists deposit money, creators make content, artists review & pay for verified views",
    "url": "https://selah.fm",
    "versions_shipped": 30,
    "files_changed": "100+ over 30 commits",
    "phases": [

        {"id": "foundation", "name": "Foundation", "done": True, "tasks": [
            {"id": "auth", "name": "Auth (Google OAuth + email/password + HMAC session cookies)", "done": True},
            {"id": "db_schema", "name": "PostgreSQL schema (users, campaigns, submissions, payouts, bugs, triggers)", "done": True},
            {"id": "campaign_crud", "name": "Campaign CRUD (create, list, detail, pause/resume)", "done": True},
            {"id": "submission_crud", "name": "Submission flow (join campaign -> submit link -> verify views)", "done": True},
            {"id": "review_flow", "name": "Artist review (approve/reject with payout calculation)", "done": True},
            {"id": "stripe_checkout", "name": "Stripe Checkout for campaign budget deposits", "done": True},
            {"id": "stripe_webhook", "name": "Stripe webhook (checkout.session.completed -> update budget)", "done": True},
            {"id": "railway_deploy", "name": "Deployed to Railway (selah.fm)", "done": True},
        ]},

        {"id": "core_features", "name": "Core Features", "done": True, "tasks": [
            {"id": "notifications", "name": "Real-time notifications (DB-backed, bell, polling)", "done": True},
            {"id": "earnings_page", "name": "Creator earnings page (live DB data, totals, history)", "done": True},
            {"id": "stripe_connect", "name": "Stripe Connect (Express onboarding + payout transfers)", "done": True},
            {"id": "validation", "name": "Input validation + sanitization", "done": True},
            {"id": "error_boundary", "name": "React ErrorBoundary wrapping entire app", "done": True},
            {"id": "rate_limiting", "name": "Rate limiting (login 10/min, signup 5/min)", "done": True},
            {"id": "typescript_types", "name": "Shared TypeScript types", "done": True},
            {"id": "seo", "name": "SEO (sitemap, robots, OG, JSON-LD)", "done": True},
        ]},

        {"id": "ux_visual", "name": "UX & Visual", "done": True, "tasks": [
            {"id": "landing_pages", "name": "Landing pages (splitter + welcome-artists + welcome-creators)", "done": True},
            {"id": "marketplace_grid", "name": "Unified campaign/artist/creator grid", "done": True},
            {"id": "covers_avatars", "name": "CampaignCover + CreatorAvatar components", "done": True},
            {"id": "demo_data", "name": "Demo data (3 artists, 5 creators, 6 campaigns)", "done": True},
            {"id": "nav_dropdown", "name": "Profile dropdown (Dashboard, Review, Earnings, Settings, Report Bug, Logout)", "done": True},
            {"id": "browse_filters", "name": "Browse filtering (search, platform, CPM) + pagination", "done": True},
            {"id": "campaign_management", "name": "Campaign pause/resume + funding", "done": True},
            {"id": "dashboard_stats", "name": "Dashboard aggregate stats bar", "done": True},
            {"id": "hire_flow", "name": "Creator hire flow", "done": True},
            {"id": "toast_system", "name": "Toast notification system", "done": True},
            {"id": "skeleton_loaders", "name": "Skeleton loaders on all pages", "done": True},
            {"id": "empty_states", "name": "Empty/error states on all pages", "done": True},
            {"id": "animations", "name": "Framer Motion animations (slide-up, fade-in)", "done": True},
            {"id": "glassmorphism", "name": "Consistent glassmorphic design system", "done": True},
        ]},

        {"id": "onboarding", "name": "Onboarding & Social", "done": True, "tasks": [
            {"id": "onboarding_wizard", "name": "1-question-per-screen wizard (artist 3, creator 5)", "done": True},
            {"id": "google_oauth", "name": "Google OAuth (production mode, redirects to onboarding)", "done": True},
            {"id": "social_oauth", "name": "Social OAuth infra (TikTok, Instagram, YouTube, Facebook)", "done": True},
            {"id": "verified_badges", "name": "Verified badges on creator/artist cards", "done": True},
            {"id": "settings_page", "name": "Settings page (profile + social handles)", "done": True},
            {"id": "view_verification", "name": "View verification (YouTube API, TikTok oEmbed)", "done": True},
        ]},

        {"id": "mvp_completion", "name": "MVP Completion", "done": True, "tasks": [
            {"id": "payment_e2e", "name": "End-to-end payment flow", "done": True},
            {"id": "budget_trigger", "name": "Budget update trigger", "done": True},
            {"id": "auto_payout", "name": "Auto-payout on approval", "done": True},
            {"id": "ownership_check", "name": "Submission ownership check", "done": True},
            {"id": "budget_exhaustion", "name": "Budget exhaustion auto-pause", "done": True},
            {"id": "chat_system", "name": "Chat/messaging (REST polling, ChatWidget, MessageButton)", "done": True},
            {"id": "email_system", "name": "Email (nodemailer, 4 templates, non-blocking)", "done": True},
            {"id": "admin_dashboard", "name": "Admin dashboard (6 sub-pages)", "done": True},
            {"id": "analytics", "name": "Google Analytics (6 conversion events)", "done": True},
            {"id": "campaign_defaults", "name": "Auto-generated campaign defaults", "done": True},
            {"id": "cron_views", "name": "YouTube view auto-update cron", "done": True},
            {"id": "e2e_tests", "name": "E2E tests: 31/34 (91%)", "done": True},
        ]},

        {"id": "auth_fix", "name": "Auth Reliability Fix", "done": True, "tasks": [
            {"id": "session_secret", "name": "Remove hardcoded selah-secret fallback", "done": True},
            {"id": "unified_verification", "name": "Unified session verification (single parseSessionCookie)", "done": True},
            {"id": "admin_bypass", "name": "Fix admin.ts signature bypass bug", "done": True},
            {"id": "session_id", "name": "Add user ID to session cookie (eliminated 12 DB lookups)", "done": True},
            {"id": "credentials_include", "name": "Added credentials:include to all authenticated fetch calls", "done": True},
            {"id": "chat_fix", "name": "Fix ChatWidget (optimistic send, ownId, error restore, auto-focus)", "done": True},
            {"id": "stripe_connect_fix", "name": "Fix Stripe Connect (fetch+redirect, getSession, id lookup)", "done": True},
            {"id": "password_validation", "name": "Password strength + email validation on signup", "done": True},
            {"id": "google_oauth_type", "name": "Google OAuth preserves existing user type", "done": True},
            {"id": "login_google_hint", "name": "Login shows helpful error for Google OAuth users", "done": True},
        ]},

        {"id": "open_source", "name": "Open Source Prep", "done": True, "tasks": [
            {"id": "secrets_scan", "name": "Hardcoded secrets scan — none found, fallback replaced", "done": True},
            {"id": "license", "name": "MIT LICENSE file", "done": True},
            {"id": "readme_update", "name": "README updated for open source", "done": True},
            {"id": "contributing", "name": "CONTRIBUTING.md", "done": True},
            {"id": "code_of_conduct", "name": "CODE_OF_CONDUCT.md", "done": True},
            {"id": "security", "name": "SECURITY.md", "done": True},
            {"id": "gh_templates", "name": "GitHub issue/PR templates", "done": True},
            {"id": "ci_cd", "name": "GitHub Actions CI workflow", "done": True},
            {"id": "funding", "name": "FUNDING.yml", "done": True},
            {"id": "open_source_page", "name": "/open-source page", "done": True},
            {"id": "bug_reporting", "name": "Bug reporting system (API + form + /report-bug)", "done": True},
            {"id": "logo_redirect", "name": "Logo links to /browse when authenticated", "done": True},
        ]},

        {"id": "phase1_defects", "name": "Phase 1: Zero-Defect Completeness", "done": False, "tasks": [
            {"id": "p1_audit", "name": "Full platform audit (all pages + components)", "done": True},
            {"id": "p1_fixes", "name": "[TBD after audit] Fix all Phase 1 defects", "done": False},
        ]},

        {"id": "phase2_polish", "name": "Phase 2: Frictionless Polish", "done": False, "tasks": [
            {"id": "p2_micro", "name": "Micro-rewards on every interaction", "done": False},
            {"id": "p2_animations", "name": "Fluid transitions across all pages", "done": False},
            {"id": "p2_mobile", "name": "Perfect mobile responsiveness", "done": False},
            {"id": "p2_empty", "name": "Designed empty states (illustrations, guidance)", "done": False},
            {"id": "p2_errors", "name": "Gentle error states (no technical messages, clear next steps)", "done": False},
            {"id": "p2_review", "name": "Final review pass", "done": False},
        ]},

        {"id": "config", "name": "Production Config", "done": False, "tasks": [
            {"id": "stripe_live", "name": "Switch Stripe to live mode (sk_live_)", "done": False},
            {"id": "smtp", "name": "Configure SMTP for email delivery", "done": False},
            {"id": "spotify_keys", "name": "Set Spotify API keys", "done": False},
            {"id": "cron_secret", "name": "Set CRON_SECRET", "done": False},
        ]},
    ]
}


def status():
    total = sum(len(p["tasks"]) for p in BUILD_PLAN["phases"])
    done = sum(1 for p in BUILD_PLAN["phases"] for t in p["tasks"] if t["done"])
    pct = int(done / total * 100) if total > 0 else 0

    print(f"\n  Selah.fm — {done}/{total} tasks ({pct}%)")
    print(f"  https://selah.fm")
    print(f"  {BUILD_PLAN['versions_shipped']} versions shipped")
    print()

    for phase in BUILD_PLAN["phases"]:
        pts = phase["tasks"]
        pdone = sum(1 for t in pts if t["done"])
        icon = "OK" if pdone == len(pts) else ">>" if pdone > 0 else "--"
        print(f"  {icon} {phase['name']} ({pdone}/{len(pts)})")
        for t in pts:
            print(f"    {'X' if t['done'] else '_'} {t['name']}")
        print()


def next_task():
    for phase in BUILD_PLAN["phases"]:
        for t in phase["tasks"]:
            if not t["done"]:
                print(f"\n  > Next: [{phase['name']}] {t['name']}")
                return
    print("\n  All tasks complete!")


def update_state():
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
    print(f"  State saved to tasks.json")


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
