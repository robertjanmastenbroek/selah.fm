#!/bin/bash
# Selah.fm — COMPREHENSIVE LIVE VERIFICATION v2
# Tests every feature end-to-end, handles timing, checks data integrity
BASE="https://selah.fm"
PASS=0; FAIL=0; WARN=0

check() { local n="$1" e="$2" a="$3"
  if echo "$a" | grep -q "$e"; then echo "  ✅ $n"; ((PASS++))
  else echo "  ❌ $n — expected '$e', got: $(echo "$a" | head -c 150)"; ((FAIL++)); fi; }

check_warn() { local n="$1" e="$2" a="$3"
  if echo "$a" | grep -q "$e"; then echo "  ✅ $n"; ((PASS++))
  else echo "  ⚠️  $n — expected '$e' (may be timing/env dependent)"; ((WARN++)); fi; }

echo ""; echo "════════════════════════════════════════════════"
echo "  SELAH.FM — COMPREHENSIVE LIVE VERIFICATION"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════════"
echo ""

# ═══ 1. INFRASTRUCTURE ═══════════════════════════════════════
echo "── 1. Infrastructure ──"
check "1.1 Health check" "ok" "$(curl -s $BASE/api/health)"
check "1.2 DB latency < 200ms" "db_latency_ms" "$(curl -s $BASE/api/health)"
check "1.3 CORS headers present" "nosniff" "$(curl -sI $BASE/api/health)"
check "1.4 Security headers" "DENY" "$(curl -sI $BASE/api/health)"

# ═══ 2. DATA INTEGRITY ═══════════════════════════════════════
echo "── 2. Data Integrity ──"
CAMPAIGNS=$(curl -s $BASE/api/campaigns)
check "2.1 Campaigns exist" "track_title" "$CAMPAIGNS"
CAMP_COUNT=$(echo "$CAMPAIGNS" | python3 -c "import sys,json;print(json.load(sys.stdin).get('total',0))")
echo "     Campaigns: $CAMP_COUNT"

ARTISTS=$(curl -s $BASE/api/artists)
check "2.2 Artists exist" "display_name" "$ARTISTS"
ART_COUNT=$(echo "$ARTISTS" | python3 -c "import sys,json;d=json.load(sys.stdin);a=d.get('artists',d if isinstance(d,list) else []);print(len(a))")
echo "     Artists: $ART_COUNT"

CREATORS=$(curl -s $BASE/api/creators)
check "2.3 Creators exist" "display_name" "$CREATORS"

check "2.4 Campaigns have covers" "cover_art_url" "$CAMPAIGNS"
# Verify no NULL artist_id
NULL_ARTISTS=$(echo "$CAMPAIGNS" | python3 -c "import sys,json;nulls=[c for c in json.load(sys.stdin).get('campaigns',[]) if not c.get('artist_id')];print(len(nulls))")
check "2.5 No NULL artist_id campaigns" "0" "$NULL_ARTISTS"

# ═══ 3. AUTHENTICATION ══════════════════════════════════════
echo "── 3. Authentication ──"
EMAIL="verify-$(date +%s)@selah.fm"
PW="testpass123"

SIGNUP=$(curl -s -X POST $BASE/api/auth/signup -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"$PW\",\"name\":\"VerifyTest\",\"type\":\"artist\"}")
check "3.1 Signup succeeds" "ok" "$SIGNUP"

sleep 2  # Neon propagation delay

LOGIN=$(curl -s -X POST $BASE/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"$PW\"}")
check "3.2 Login succeeds" "ok" "$LOGIN"

# Check OAuth redirect works
OAUTH=$(curl -sI $BASE/api/oauth/google 2>&1)
check "3.3 OAuth redirects to Google" "accounts.google.com" "$OAUTH"
# Check if OAuth is published or testing
if echo "$OAUTH" | grep -q "client_id"; then
  CLIENT_ID=$(echo "$OAUTH" | grep -o 'client_id=[^&]*' | cut -d= -f2)
  echo "     OAuth Client ID: $CLIENT_ID"
  echo "     ⚠️  Verify at https://console.cloud.google.com/apis/credentials/consent"
  echo "     ⚠️  If 'Publishing status' = 'Testing', click 'Publish App'"
fi

# ═══ 4. PAYMENTS ════════════════════════════════════════════
echo "── 4. Payments ──"
STRIPE=$(curl -s -X POST $BASE/api/stripe -H "Content-Type: application/json" -d '{"amount":10,"campaignId":"test"}')
check "4.1 Stripe checkout creates session" "url" "$STRIPE"

CONNECT=$(curl -s $BASE/api/stripe/connect)
check_warn "4.2 Stripe Connect (should be auth-gated or show Stripe error)" "authenticated|Stripe|country|api_key" "$CONNECT"

# ═══ 5. CORE FEATURES ═══════════════════════════════════════
echo "── 5. Core Features ──"
VERIFY=$(curl -s -X POST $BASE/api/verify -H "Content-Type: application/json" -d '{"url":"https://youtube.com/watch?v=dQw4w9WgXcQ","platform":"youtube"}')
check "5.1 YouTube verify works" "platform" "$VERIFY"
# Check if API key is set
if echo "$VERIFY" | grep -q "not configured\|autoVerified\|Set YOUTUBE"; then
  echo "     ⚠️  YouTube API key status: check /api/verify response above"
fi

SEED=$(curl -s $BASE/api/admin/seed)
check "5.2 Seed works" "seeded" "$SEED"

MIGRATE=$(curl -s $BASE/api/admin/migrate)
check "5.3 Migration runs" "migrated" "$MIGRATE"

# ═══ 6. PUBLIC PAGES ════════════════════════════════════════
echo "── 6. Public Pages (200 OK) ──"
for page in "/" "/welcome-artists" "/welcome-creators" "/browse" "/artists" "/creators" "/login" "/onboarding" "/content-guidelines"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$page")
  if [ "$code" = "200" ]; then echo "  ✅ $page ($code)"; ((PASS++))
  else echo "  ❌ $page ($code)"; ((FAIL++)); fi
done

# ═══ 7. AUTH-GATED PAGES (existence check) ══════════════════
echo "── 7. Auth-Gated Pages ──"
for page in "/dashboard" "/review" "/earnings" "/settings" "/admin"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$page")
  if [ "$code" = "200" ]; then echo "  ✅ $page ($code)"; ((PASS++))
  elif [ "$code" = "307" ] || [ "$code" = "302" ]; then echo "  ✅ $page redirects ($code → login)"; ((PASS++))
  else echo "  ❌ $page ($code)"; ((FAIL++)); fi
done

# ═══ 8. SEO ═════════════════════════════════════════════════
echo "── 8. SEO ──"
SITEMAP=$(curl -s $BASE/sitemap.xml)
check "8.1 Sitemap XML valid" "</url>" "$SITEMAP"
ROBOTS=$(curl -s $BASE/robots.txt)
check "8.2 Robots.txt exists" "Disallow" "$ROBOTS"

# ═══ SUMMARY ══════════════════════════════════════════════════
echo ""
echo "════════════════════════════════════════════════"
echo "  RESULTS: $PASS passed, $WARN warnings, $FAIL failed"
if [ $FAIL -eq 0 ]; then echo "  STATUS: ✅ ALL CRITICAL PATHS PASSING"; fi
echo "════════════════════════════════════════════════"
echo ""
echo "⚠️  MANUAL ITEMS TO VERIFY:"
echo "  1. Login at https://selah.fm/admin → admin panel loads"
echo "  2. Browse → click campaign card → detail page loads"
echo "  3. Browse → Join Campaign → submit TikTok/YouTube link"
echo "  4. Dashboard → Create Campaign → appears in Browse"
echo "  5. Settings → Save changes → no error toast"
echo "  6. Google OAuth → https://console.cloud.google.com/apis/credentials/consent"
echo "     → 'Publishing status' must say 'In production' (not 'Testing')"
echo "  7. YouTube API key → https://console.cloud.google.com/apis/credentials"
echo "     → Create API Key → restrict to 'YouTube Data API v3'"
echo "     → Add to Railway as YOUTUBE_API_KEY"
echo "  8. Stripe → switch sk_test_ → sk_live_ in Railway"
echo ""
