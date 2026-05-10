#!/bin/bash
# Selah.fm — LIVE FUNCTIONAL VERIFICATION
# Tests every critical path against the production API
# Usage: bash live_test.sh

BASE="https://selah.fm"
PASS=0
FAIL=0

check() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo "  ✅ $name"
    ((PASS++))
  else
    echo "  ❌ $name — expected '$expected', got: $(echo "$actual" | head -c 100)"
    ((FAIL++))
  fi
}

echo ""
echo "════════════════════════════════════════════"
echo "  Selah.fm — Live Functional Verification"
echo "════════════════════════════════════════════"
echo ""

# 1. Health Check
check "1.1 Health returns ok" "ok" "$(curl -s $BASE/api/health)"

# 2. Public API endpoints
check "2.1 Campaigns API works" "track_title" "$(curl -s $BASE/api/campaigns)"
check "2.2 Artists API works" "display_name" "$(curl -s $BASE/api/artists)"
check "2.3 Creators API works" "display_name" "$(curl -s $BASE/api/creators)"

# 3. Public pages
check "3.1 Splitter loads" "Get your music heard" "$(curl -s $BASE/)"
check "3.2 Artist landing loads" "Real Promotion" "$(curl -s $BASE/welcome-artists)"
check "3.3 Creator landing loads" "Make Content" "$(curl -s $BASE/welcome-creators)"
check "3.4 Browse loads" "campaigns available" "$(curl -s $BASE/browse)"
check "3.5 Artists directory loads" "Artists" "$(curl -s $BASE/artists)"
check "3.6 Creators directory loads" "Creators" "$(curl -s $BASE/creators)"
check "3.7 Login loads" "__variable_f367f3" "$(curl -s $BASE/login)"
check "3.8 Onboarding loads" "brings you here" "$(curl -s $BASE/onboarding)"
check "3.9 Settings loads" "Settings" "$(curl -s $BASE/settings)"
check "3.10 Dashboard loads" "campaigns" "$(curl -s $BASE/dashboard)"
check "3.11 Review loads" "Review" "$(curl -s $BASE/review)"
check "3.12 Earnings loads" "Earnings" "$(curl -s $BASE/earnings)"
check "3.13 Content Guidelines loads" "Content Guidelines" "$(curl -s $BASE/content-guidelines)"

# 4. Auth flow
EMAIL="live-test-$(date +%s)@selah.fm"
PASS="test123"

SIGNUP=$(curl -s -X POST $BASE/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"name\":\"LiveTest\",\"type\":\"creator\"}")
check "4.1 Signup works"; sleep 3" "ok" "$SIGNUP"

LOGIN=$(curl -s -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
check "4.2 Login works" "ok" "$LOGIN"

# 5. Stripe endpoints
STRIPE_TEST=$(curl -s -X POST $BASE/api/stripe \
  -H "Content-Type: application/json" \
  -d '{"amount":10,"campaignId":"test"}')
check "5.1 Stripe checkout returns URL" "url" "$STRIPE_TEST"

STRIPE_CONNECT=$(curl -s $BASE/api/stripe/connect)
check "5.2 Stripe Connect requires auth" "Not authenticated" "$STRIPE_CONNECT"

# 6. Verify endpoint
VERIFY_YT=$(curl -s -X POST $BASE/api/verify \
  -H "Content-Type: application/json" \
  -d '{"url":"https://youtube.com/watch?v=dQw4w9WgXcQ","platform":"youtube"}')
check "6.1 YouTube verification works" "platform" "$VERIFY_YT"

# 7. Admin endpoints
ADMIN_SEED=$(curl -s $BASE/api/admin/seed)
check "7.1 Seed endpoint works" "seeded" "$ADMIN_SEED"

ADMIN_MIGRATE=$(curl -s $BASE/api/admin/migrate)
check "7.2 Migrate endpoint works" "migrated" "$ADMIN_MIGRATE"

# 8. SEO
SITEMAP=$(curl -s $BASE/sitemap.xml)
check "8.1 Sitemap is valid XML" "</urlset>" "$SITEMAP"

ROBOTS=$(curl -s $BASE/robots.txt)
check "8.2 Robots.txt exists" "User-Agent" "$ROBOTS"

echo ""
echo "════════════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "════════════════════════════════════════════"
echo ""
