#!/usr/bin/env python3
"""
Selah.fm Autonomous Agent — DeepSeek-powered
=============================================
Continuously improves the platform by analyzing the codebase,
identifying improvements, generating code, and deploying.

Requires: DEEPSEEK_API_KEY in environment or Command Centre .env

Usage:
  python3 autonomous/agent.py once     # Single improvement cycle
  python3 autonomous/agent.py watch    # Continuous loop (every 30 min)
  python3 autonomous/agent.py plan     # Show improvement plan only
"""

import os, sys, json, subprocess, time
from pathlib import Path
from datetime import datetime

AGENT_DIR = Path(__file__).resolve().parent.parent
AUTONOMOUS_DIR = AGENT_DIR / "autonomous"
LOG_DIR = AUTONOMOUS_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)

# Load Command Centre .env for API keys
CC_ENV = Path("/Users/motomoto/Documents/Robert-Jan Mastenbroek Command Centre/.env")
if CC_ENV.exists():
    with open(CC_ENV) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                k = k.strip(); v = v.strip().strip('"').strip("'")
                if k not in os.environ: os.environ[k] = v

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE = "https://api.deepseek.com/v1"

IMPROVEMENT_AREAS = [
    "Landing page conversion optimization",
    "User onboarding flow improvements",
    "Campaign creation UX polish",
    "Creator marketplace discoverability",
    "SEO and metadata optimization",
    "Mobile responsiveness fixes",
    "Loading states and error handling",
    "Social proof and trust signals",
    "Call-to-action copy and placement",
    "Performance optimization (images, fonts)",
    "Accessibility improvements",
    "Client acquisition strategies",
    "Outreach message templates",
    "Pricing and fee communication clarity",
]

SYSTEM_PROMPT = """You are an autonomous improvement agent for Selah.fm — a CPM marketplace where artists pay creators to promote their music on TikTok, Reels, and Shorts.

Your job: analyze the platform codebase, identify the single highest-impact improvement, and implement it.

Rules:
- Make small, focused changes — one improvement per cycle
- Never break existing functionality
- Use the existing shadcn/ui component library (Card, Button, Input, Badge, Progress, Skeleton)
- Use Tailwind CSS classes from the project's design system
- Commit with descriptive messages
- The brand uses Midnight (#1A1A2E), Sacred Gold (#C9A84C), Parchment (#F5F0E8)
- Be creative about client acquisition — outreach strategies, viral loops, referral programs

Output format: JSON with 'file', 'description', and 'code' fields."""

def get_project_files():
    """Get list of key project files."""
    files = []
    for ext in ['*.tsx', '*.ts', '*.css']:
        for path in AGENT_DIR.rglob(ext):
            if 'node_modules' not in str(path) and '.next' not in str(path):
                files.append(str(path.relative_to(AGENT_DIR)))
    return files[:50]  # Limit context

def read_file(path: str) -> str:
    """Read a file from the project."""
    full = AGENT_DIR / path
    if full.exists():
        return full.read_text()[:3000]  # Limit size
    return ""

def call_deepseek(prompt: str) -> dict:
    """Call DeepSeek API for code generation."""
    if not DEEPSEEK_API_KEY:
        return {"error": "Set DEEPSEEK_API_KEY in Command Centre .env"}

    try:
        import requests
        resp = requests.post(
            f"{DEEPSEEK_BASE}/chat/completions",
            headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "deepseek-chat",
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.3,
                "max_tokens": 4000,
            },
            timeout=60,
        )
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        
        # Try to parse JSON from response
        try:
            # Find JSON in the response
            start = content.find('{')
            end = content.rfind('}') + 1
            if start >= 0 and end > start:
                return json.loads(content[start:end])
        except:
            pass
        
        return {"raw": content, "note": "Could not parse JSON from response"}
    except Exception as e:
        return {"error": str(e)}

def run_improvement_cycle():
    """Run one improvement cycle."""
    print(f"\n{'='*50}")
    print(f"  Selah.fm Autonomous Agent — {datetime.now().strftime('%H:%M')}")
    print(f"{'='*50}")

    # 1. Analyze current state
    files = get_project_files()
    key_files = ["app/page.tsx", "app/dashboard/page.tsx", "app/browse/page.tsx", "components/TopNav.tsx"]
    
    context = "Current Selah.fm project state:\n\n"
    for f in key_files:
        content = read_file(f)
        if content:
            context += f"### {f}\n```tsx\n{content[:500]}\n```\n\n"

    # 2. Pick an improvement area
    import random
    area = random.choice(IMPROVEMENT_AREAS)
    
    prompt = f"{context}\n\nImprovement area: {area}\n\nIdentify ONE specific, small improvement you can make to the Selah.fm platform. Return JSON with:\n- file: which file to modify\n- description: what to change\n- code: the exact new code for that file"

    # 3. Get improvement from DeepSeek
    print(f"  🎯 Area: {area}")
    
    if not DEEPSEEK_API_KEY:
        print(f"  ⚠ No DEEPSEEK_API_KEY set. Add to Command Centre .env:")
        print(f"     DEEPSEEK_API_KEY=sk-...")
        
        # Log the analysis
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "area": area,
            "status": "no_api_key",
        }
        with open(LOG_DIR / f"cycle_{datetime.now().strftime('%Y%m%d_%H%M')}.json", "w") as f:
            json.dump(log_entry, f, indent=2)
        return False

    result = call_deepseek(prompt)
    
    if "error" in result:
        print(f"  ❌ API error: {result['error']}")
        return False

    # 4. Log the result
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "area": area,
        "result": result,
    }
    with open(LOG_DIR / f"cycle_{datetime.now().strftime('%Y%m%d_%H%M')}.json", "w") as f:
        json.dump(log_entry, f, indent=2)
    
    # 5. Apply changes if code was generated
    if "file" in result and "code" in result:
        target = AGENT_DIR / result["file"]
        target.write_text(result["code"])
        print(f"  ✅ Applied: {result.get('description', 'No description')}")
        
        # 6. Build and deploy
        print(f"  🔨 Building...")
        r = subprocess.run(["npx", "next", "build"], cwd=AGENT_DIR, capture_output=True, text=True)
        if r.returncode == 0:
            print(f"  ✅ Build passed")
            subprocess.run(["git", "add", "-A"], cwd=AGENT_DIR)
            subprocess.run(["git", "commit", "-m", f"Auto: {result.get('description', 'improvement')}"], cwd=AGENT_DIR)
            subprocess.run(["railway", "up", "--service", "selah-fm"], cwd=AGENT_DIR, capture_output=True)
            print(f"  🚀 Deployed")
            return True
        else:
            print(f"  ❌ Build failed — rolling back")
            subprocess.run(["git", "checkout", "."], cwd=AGENT_DIR)
            return False
    else:
        print(f"  ℹ️ No code changes generated")
        print(f"  Response: {json.dumps(result, indent=2)[:500]}")
        return False

def watch_loop():
    """Run continuous improvement loop."""
    print(f"  🔄 Selah.fm Autonomous Agent — watching (Ctrl+C to stop)")
    print(f"  📋 Areas: {len(IMPROVEMENT_AREAS)} improvement areas")
    print(f"  ⏱ Cycle: every 30 minutes")
    
    cycles = 0
    while True:
        cycles += 1
        print(f"\n  ── Cycle {cycles} ──")
        success = run_improvement_cycle()
        status = "✅" if success else "⏭"
        print(f"  {status} Cycle {cycles} complete")
        
        if cycles % 10 == 0:
            print(f"  📊 {cycles} cycles run. Continuing...")
        
        time.sleep(1800)  # 30 minutes

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "once"
    if cmd == "once":
        run_improvement_cycle()
    elif cmd == "watch":
        watch_loop()
    elif cmd == "plan":
        print(f"\n  Selah.fm Improvement Areas:\n")
        for i, area in enumerate(IMPROVEMENT_AREAS):
            print(f"  {i+1:>2}. {area}")
        print(f"\n  Run: python3 autonomous/agent.py once")
