# Selah.fm — Financial Flow Blueprint

**Date:** June 4, 2026  
**Research Sources:** Stripe Connect architecture guide (quantlabusa.dev), Stripe docs, Upwork escrow, Kickstarter funding flow, Fiverr payout system, Buy Me a Coffee, Patreon  
**Reference files:** `app/api/stripe/webhook/route.ts`, `app/api/review/route.ts`, `app/api/stripe/payout/route.ts`, `app/checkout/page.tsx`

---

## Research Synthesis

### World-Class Payment Platforms Studied

| Platform | Key Pattern | Why It Works |
|----------|-------------|-------------|
| **Stripe Connect** | Express accounts, destination charges, async webhook queue, nightly reconciliation job, idempotency keys | 0.0001% reliability: deduped webhooks, reconciliation catches drift before support tickets, UUIDs as PKs |
| **Upwork** | Funded escrow → milestone → review → security hold → auto-release | Protection for both sides: buyer pre-funds, freelancer has payment guarantee after approval |
| **Kickstarter** | All-or-nothing, pledges collected only if goal met, 5% + 3-5% fees, payout 14 days after campaign end | Removes backer risk, creates urgency. Clear fee breakdown before campaign starts. |
| **Fiverr** | Order now → seller delivers → buyer reviews → auto-release after 3 days | Simple 3-step flow. Auto-release prevents payment hostage. Gig extensions for upsells. |
| **Airbnb** | Booking → hold → release 24h after check-in | Delay protects both parties. Host gets paid after guest confirms arrival. |
| **Buy Me a Coffee** | One-click donation, no account needed for donor, instant withdrawal for creator | Absolute minimum friction to give money. Creator gets paid immediately. |
| **Patreon** | Monthly subscription → platform holds → payout on 1st of month, after fees | Batching reduces transaction costs. Predictable payout schedule. |

### Universal Patterns for 0.0001% Money Flows

**Pattern 1: Asynchronous Webhook Processing**
- Return 200 immediately after storing raw event
- Queue processing to background worker
- Dedupe by event ID (UNIQUE constraint)
- Store raw events for 90 days minimum for replay
- → **Selah gap**: Webhook handler does ALL work synchronously before returning 200. Risk of retry → duplicate processing.

**Pattern 2: Escrow/Hold Before Work**
- Upwork: Client funds milestone upfront
- Airbnb: Guest pays before stay, released after check-in
- Fiverr: Buyer pays at order time
- → **Selah gap**: Funds go straight to campaign budget. No escrow period. If campaign is abandoned or artist disappears, funds are committed.

**Pattern 3: Reconciliation Job (The Most Important Thing)**
- Stripe Connect best practice: nightly job compares Stripe charges/payouts against internal records
- Catches: webhook drops, double charges, incorrect fee calculations
- → **Selah gap**: No reconciliation job. Drift accumulates silently until a support ticket.

**Pattern 4: Transparent Fee Display Before Transaction**
- Kickstarter: "5% platform fee + 3-5% payment processing" shown before pledging
- Fiverr: Buyer sees total with fees before confirming
- Airbnb: Full price breakdown before booking
- → **Selah gap**: 20% platform fee is mentioned but not prominently displayed before payment.

**Pattern 5: Scheduled/Batched Payouts**
- Patreon: Payout on 1st of month
- Kickstarter: 14 days after campaign end
- Stripe Connect: Daily/weekly/monthly cadence
- → **Selah gap**: Payouts attempted immediately on approval. Should batch weekly.

**Pattern 6: Idempotency on All Payment Operations**
- Stripe Connect: Idempotency key on every charge creation
- Prevents duplicate charges from retry storms
- → **Selah gap**: No idempotency key on charge creation.

**Pattern 7: Dispute Resolution Flow**
- Stripe Connect: 5-day SLA, seller dashboard, dispute fee ($15-25)
- Upwork: 7-day auto-release if client doesn't respond
- Fiverr: 48-hour auto-accept on cancellation
- → **Selah gap**: No dispute UI for creators. Rejection is final with no recourse.

---

## Current State Audit

### Money Flow Diagram (Current)

```
DONOR/ARTIST                     PLATFORM                      CREATOR
    │                               │                             │
    │  Pay via Stripe Elements      │                             │
    ├──────────────────────────────►│                             │
    │                               │                             │
    │                    Webhook receives event                   │
    │                    ┌──────────────────┐                     │
    │                    │ payment_intent   │                     │
    │                    │ .succeeded       │                     │
    │                    │                  │                     │
    │                    │ ↓ Sync process:  │                     │
    │                    │ • Add to budget  │                     │
    │                    │ • Record donation │                     │
    │                    │ • Insert ticker  │                     │
    │                    │ • Send email     │                     │
    │                    │ • Referral bonus │                     │
    │                    │ • Return 200     │                     │
    │                    └──────────────────┘                     │
    │                               │                             │
    │                               │     Submit video            │
    │                               │◄────────────────────────────┤
    │                               │                             │
    │                   Review & approve                          │
    │                   ┌──────────────────┐                      │
    │                   │ • Check budget   │                      │
    │                   │ • Calculate CPM  │                      │
    │                   │ • Deduct budget  │                      │
    │                   │ • Attempt payout │                      │
    │                   │ • Send notif     │                      │
    │                   └──────────────────┘                      │
    │                               │                             │
    │                               │    $ earned (if Stripe set) │
    │                               ├────────────────────────────►│
```

### Scorecard: Money Flow (1-10, Target = 10)

| Dimension | Score | Key Gaps |
|-----------|-------|----------|
| **Webhook Reliability** | 3/10 | Sync processing, no dedupe table, no async queue, no replay |
| **Escrow/Safety** | 2/10 | Funds committed immediately, no hold period, no refund workflow |
| **Reconciliation** | 1/10 | None — no nightly job comparing Stripe vs internal |
| **Fee Transparency** | 5/10 | 20% fee mentioned but not prominent before payment |
| **Payout Speed** | 5/10 | Immediate attempt (good) but no instant option (bad) |
| **Dispute Handling** | 1/10 | No dispute UI, rejection is final |
| **Audit Trail** | 4/10 | Transactions logged but scattered, no unified ledger |
| **Idempotency** | 2/10 | Webhook has basic idempotency check but no idempotency keys on charge creation |
| **Rate Limiting** | 5/10 | Rate limiting on review but not on Stripe endpoints |
| **KYC/Onboarding** | 4/10 | Stripe Connect onboarding exists but not integrated into signup flow |

### Critical Issues

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | **Sync webhook processing** — can timeout, causing Stripe retries and duplicate processing | 🔴 Critical | Duplicate donations, budget corruption |
| 2 | **No reconciliation job** — drift accumulates silently | 🔴 Critical | Financial errors discovered only via support tickets |
| 3 | **No escrow** — funds committed immediately | 🟡 High | Abandoned campaigns = stuck funds |
| 4 | **No dispute flow** — rejection is final | 🟡 High | Creator trust, support load |
| 5 | **No fee transparency before payment** | 🟡 Medium | User trust, surprise charges |
| 6 | **Payout attempted immediately** — should batch weekly | 🟢 Low | Not urgent at current scale |

---

## Financial Vision: 0.0001% Money Flow

### Target Architecture

```
DONOR/ARTIST                     PLATFORM                      CREATOR
    │                               │                             │
    │  Pay via Stripe Elements      │                             │
    ├──────────────────────────────►│                             │
    │                               │                             │
    │                    ┌─────────────────────┐                  │
    │                    │ WEBHOOK HANDLER     │                  │
    │                    │ (returns 200 in     │                  │
    │                    │  <100ms, then queues)│                 │
    │                    │                     │                  │
    │                    │ 1. Validate sig     │                  │
    │                    │ 2. Store raw event  │                  │
    │                    │ 3. Dedupe by ID     │                  │
    │                    │ 4. Queue processing │                  │
    │                    │ 5. Return 200       │                  │
    │                    └─────────┬───────────┘                  │
    │                              │                              │
    │                    ┌─────────▼───────────┐                  │
    │                    │ BACKGROUND WORKER    │                  │
    │                    │ (async, one at a time)│                 │
    │                    │                      │                 │
    │                    │ • Add to escrow      │                  │
    │                    │ • Record transaction │                  │
    │                    │ • Insert ticker      │                  │
    │                    │ • Send email (async) │                  │
    │                    └─────────────────────┘                  │
    │                              │                              │
    │                    ┌─────────▼───────────┐                  │
    │                    │ NIGHTLY RECONCILE   │                  │
    │                    │ Compares Stripe vs  │                  │
    │                    │ internal records    │                  │
    │                    │ Flags drift >$0.01  │                  │
    │                    └─────────────────────┘                  │
    │                              │                              │
    │                    ESCROW (funds held)                      │
    │                    ┌──────────────────┐                     │
    │                    │ Campaign budget  │                     │
    │                    │ = escrow balance │                     │
    │                    └──────────────────┘                     │
    │                              │                              │
    │                              │    Submit video              │
    │                              │◄────────────────────────────┤
    │                              │                              │
    │                   Review & approve                          │
    │                   ┌──────────────────────┐                  │
    │                   │ • Check escrow       │                  │
    │                   │ • Calculate payout   │                  │
    │                   │ • Move to 'approved' │                  │
    │                   │ • Queue for weekly   │                  │
    │                   │   payout batch       │                  │
    │                   └──────────────────────┘                  │
    │                              │                              │
    │                   ┌──────────▼──────────┐                   │
    │                   │ WEEKLY PAYOUT RUN    │                  │
    │                   │ Batches all approved │                  │
    │                   │ submissions          │                  │
    │                   │ • Creator earns 100% │                  │
    │                   │ • Platform fee 20%   │                  │
    │                   │ • Stripe processing  │                  │
    │                   │ • Instant available  │                  │
    │                   └─────────────────────┘                   │
    │                              │                              │
    │                              │   Weekly payout batch       │
    │                              ├────────────────────────────►│
```

### Architecture Changes Required

**Sprint 1 (Critical — Security + Reliability)**
1. Split webhook handler: store event → return 200 → process async
2. Add `stripe_events` table with UNIQUE constraint on event.id
3. Add reconciliation job (`app/api/cron/reconcile/route.ts`)
4. Add idempotency keys to charge creation

**Sprint 2 (High — Trust + Conversion)**
1. Fee breakdown display before checkout (20% platform fee prominently)
2. Payout status page for creators (pending → processing → paid)
3. Dispute flow for rejected submissions
4. Weekly payout batch cron instead of immediate attempt

**Sprint 3 (Medium — Polish)**
1. Instant payout option (Stripe Connect Instant Payouts)
2. Escrow hold period (funds held for 7 days after campaign launch)
3. Annual financial report (Stripe Atlas-style)
4. Automated refund flow for cancelled campaigns

---

## Research Gaps Still Open

| Topic | Notes |
|-------|-------|
| Stripe Connect Instant Payouts integration details | Not deeply researched — requires Instant Payouts enabled on account |
| International payout compliance (non-US creators) | Selah.fm has 21 users, may not need yet |
| Tax form collection (1099/W-8BEN) | Not yet needed at current payout volume |

---

*This document researched June 4, 2026. Sources: Stripe Connect marketplace architecture (quantlabusa.dev), Stripe documentation, Upwork escrow docs (support.upwork.com), Kickstarter fee breakdown (pledgebox.com), Selah.fm code audit.*
