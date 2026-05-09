# Selah.fm — Pre-Launch Checklist

## Before Going Live

### Domain & SSL
- [ ] Custom domain configured: selah.fm → Railway
- [ ] SSL certificate active (Railway auto-provisions)
- [ ] www.selah.fm redirects to selah.fm

### Environment Variables (Railway)
- [ ] DATABASE_URL — pointing to production Neon DB
- [ ] NEXTAUTH_SECRET — 32+ byte random string (generated fresh)
- [ ] NEXTAUTH_URL — https://selah.fm
- [ ] GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET — production OAuth credentials
- [ ] STRIPE_SECRET_KEY — sk_live_... (NOT sk_test_...)
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — pk_live_...
- [ ] STRIPE_WEBHOOK_SECRET — whsec_... from Stripe dashboard
- [ ] YOUTUBE_API_KEY — for view verification (optional but recommended)
- [ ] CRON_SECRET — random string for /api/cron protection

### Stripe
- [ ] Switch from test mode to live mode (Stripe Dashboard → toggle)
- [ ] Create live webhook endpoint: https://selah.fm/api/stripe/webhook
- [ ] Webhook events: checkout.session.completed
- [ ] Stripe Connect live mode enabled for creator payouts
- [ ] Test a live deposit ($1 minimum) end-to-end

### Google OAuth
- [ ] OAuth consent screen published (not "Testing" mode)
- [ ] Authorized redirect URIs: https://selah.fm/api/oauth/google
- [ ] Authorized domains: selah.fm

### Database
- [ ] Production migration run: `psql $DATABASE_URL -f lib/db/schema.sql`
- [ ] Demo data seeded: `psql $DATABASE_URL -f lib/db/seed.sql`
- [ ] Demo submissions seeded: `psql $DATABASE_URL -f lib/db/seed_submissions.sql`
- [ ] Backup strategy in place (Neon auto-backups or pg_dump cron)

### Monitoring
- [ ] Health check endpoint: GET https://selah.fm/api/health
- [ ] Uptime monitoring set up (use uptimerobot.com — free tier OK)
- [ ] Error tracking (Sentry, Logtail, or Railway logs)

### Performance
- [ ] Lighthouse audit score ≥ 90 on all pages
- [ ] Images lazy-loaded (all Unsplash images use ?w=800&q=80)
- [ ] No render-blocking resources

### Legal
- [ ] Terms of Service published at /tos
- [ ] Privacy Policy published at /privacy
- [ ] Content Guidelines published at /content-guidelines

### Final Checks
- [ ] E2E tests pass: `TEST_URL=https://selah.fm node e2e/test.js`
- [ ] Mobile responsive (test on iPhone, Android, tablet)
- [ ] All 14 public pages return 200
- [ ] Stripe checkout flow works from start to finish
- [ ] Creator onboarding completes without errors
- [ ] Artist can create campaign, receive submission, review, and approve

---

## Post-Launch

- [ ] Monitor error rates for first 48 hours
- [ ] Watch for failed webhooks in Stripe dashboard
- [ ] Review first 10 real signups manually
- [ ] Collect user feedback (add a feedback widget)
- [ ] Set up weekly data backup
