# Selah.fm

https://selah.fm — A global SEO/LLMO database of every artist. Fans donate, creators make content, artists don't need to lift a finger.

## Quick Start

```bash
cp .env.local.example .env.local    # fill in required env vars
npm install
npx next dev                        # http://localhost:3000
```

### Required Env Vars

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_DATABASE_URL` | Supabase PostgreSQL pooler URL |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client-side key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_URL` | Public URL (https://selah.fm) |
| `RESEND_API_KEY` | Email sending (Resend) |
| `RESEND_AUDIENCE_ID` | Resend audience for marketing list |
| `DEEPSEEK_API_KEY` | AI outreach emails + blog generation |
| `CRON_SECRET` | Cron job auth |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Streaming link enrichment |

## Project Structure

```
app/
├── page.tsx              # Homepage (server-rendered stats)
├── c/[id]/               # Campaign / promotion detail
├── browse/               # Artist + campaign discovery
├── dashboard/            # Artist/creator hub (4 tabs)
├── review/               # Submission review
├── login/                # Google OAuth + email/password
├── messages/             # Full messaging system
├── admin/                # Money flow, analytics, review queue
├── blog/                 # AI-generated SEO blog
├── artist/[slug]/        # Artist profile pages (2,000+)
├── tools/                # CPM calc, playlist analyzer, budget planner
├── api/cron/             # 17 cron workers via dispatcher
└── auth/callback/        # Supabase OAuth callback

lib/
├── db.ts                 # pg Pool (Supabase)
├── blog-engine.ts        # AI blog generation
├── artist-content.ts     # SEO bio generation (~37B combos)
├── outreach.ts           # Artist audit + email scraping
├── discovery.ts          # Multi-channel discovery
└── internal-links.ts     # Entity graph + cross-linking
```

## Architecture

- **Framework:** Next.js 14 (App Router), TypeScript
- **Auth:** Supabase Auth (Google OAuth + `@supabase/ssr`)
- **Database:** Supabase PostgreSQL (pooler, 27 tables)
- **Payments:** Stripe Elements + Connect (20% platform fee)
- **AI:** DeepSeek V4 (blog, outreach, bios, support chat)
- **Email:** Resend (transactional + audience, 100/day free)
- **Styling:** Tailwind CSS + shadcn/ui + Framer Motion
- **Deploy:** Railway (auto on `git push origin main`)

## Source of Truth

**[SELAH.md](./SELAH.md)** — The living document. Contains identity, architecture, status, roadmap, key decisions, and archive information for 40+ superseded docs.

## Testing

```bash
npm run build            # TypeScript + Next build
npx tsc --noEmit         # must pass with zero errors
```

## Deployment

Auto-deployed on `git push origin main` via Railway. Live at https://selah.fm.
