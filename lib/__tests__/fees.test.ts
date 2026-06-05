import { describe, it, expect } from 'vitest';
import {
  calculatePayout,
  grossDeposit,
  netAfterStripe,
  stripeCharge,
  artistCostPer1KViews,
  PLATFORM_FEE_RATE,
  STRIPE_PROCESSING_RATE,
  STRIPE_PROCESSING_FIXED,
  STRIPE_PAYOUT_FEE,
  MIN_DEPOSIT,
  MIN_CPM,
  MIN_PAYOUT,
} from '../fees';

describe('fees.ts — Financial Calculations', () => {
  // ── Constants ──────────────────────────────────────────────
  describe('constants', () => {
    it('platform fee is 20%', () => {
      expect(PLATFORM_FEE_RATE).toBe(0.20);
    });

    it('Stripe processing is 2.9% + $0.30', () => {
      expect(STRIPE_PROCESSING_RATE).toBe(0.029);
      expect(STRIPE_PROCESSING_FIXED).toBe(0.30);
    });

    it('payout fee is $0.25', () => {
      expect(STRIPE_PAYOUT_FEE).toBe(0.25);
    });

    it('minimum deposit is $25', () => {
      expect(MIN_DEPOSIT).toBe(25);
    });

    it('minimum CPM is $1', () => {
      expect(MIN_CPM).toBe(1);
    });

    it('minimum payout is $5', () => {
      expect(MIN_PAYOUT).toBe(5);
    });
  });

  // ── calculatePayout ────────────────────────────────────────
  describe('calculatePayout', () => {
    it('calculates a standard payout correctly', () => {
      // 10,000 views at $10 CPM (1000 cents)
      const result = calculatePayout(10_000, 1000);
      // Creator earns: (10,000/1000) * $10 = $100
      // Platform: $100 * 0.20 = $20
      // Artist charged: $100 + $20 = $120
      expect(result.creatorEarns).toBe(100);
      expect(result.platformRevenue).toBe(20);
      expect(result.artistCharged).toBe(120);
    });

    it('handles zero views', () => {
      const result = calculatePayout(0, 1000);
      expect(result.creatorEarns).toBe(0);
      expect(result.platformRevenue).toBe(0);
      expect(result.artistCharged).toBe(0);
    });

    it('handles minimum CPM', () => {
      // 1000 views at $1 CPM (100 cents)
      const result = calculatePayout(1_000, 100);
      expect(result.creatorEarns).toBe(1);
      expect(result.platformRevenue).toBe(0.20);
      expect(result.artistCharged).toBe(1.20);
    });

    it('handles fractional cents correctly (rounds to 2 decimals)', () => {
      // 1 view at $10 CPM
      const result = calculatePayout(1, 1000);
      expect(result.creatorEarns).toBe(0.01);
      expect(result.platformRevenue).toBe(0);
      expect(result.artistCharged).toBe(0.01);
    });

    it('handles large numbers without overflow', () => {
      // 10M views at $100 CPM
      const result = calculatePayout(10_000_000, 10000);
      expect(result.creatorEarns).toBe(1_000_000);
      expect(result.platformRevenue).toBe(200_000);
      expect(result.artistCharged).toBe(1_200_000);
    });

    it('platform revenue is always 20% of creator earnings', () => {
      const testCases = [
        [500, 500],
        [100_000, 100],
        [25, 1000],
        [1_000_000, 50],
      ];
      for (const [views, cpmCents] of testCases) {
        const result = calculatePayout(views, cpmCents);
        expect(result.platformRevenue).toBeCloseTo(result.creatorEarns * PLATFORM_FEE_RATE, 2);
        expect(result.artistCharged).toBeCloseTo(result.creatorEarns * (1 + PLATFORM_FEE_RATE), 2);
      }
    });
  });

  // ── grossDeposit ──────────────────────────────────────────
  describe('grossDeposit', () => {
    it('calculates gross amount needed to net a given amount', () => {
      // To net $100 after Stripe fees: ($100 + $0.30) / (1 - 0.029)
      const gross = grossDeposit(100);
      expect(gross).toBeGreaterThan(100);
      expect(gross).toBeLessThan(105);
      // Verify: gross minus Stripe fee should be at least $100
      const fee = gross * STRIPE_PROCESSING_RATE + STRIPE_PROCESSING_FIXED;
      expect(gross - fee).toBeCloseTo(100, 0);
    });

    it('handles minimum deposit', () => {
      const gross = grossDeposit(MIN_DEPOSIT);
      expect(gross).toBeGreaterThan(MIN_DEPOSIT);
      const fee = gross * STRIPE_PROCESSING_RATE + STRIPE_PROCESSING_FIXED;
      expect(gross - fee).toBeGreaterThanOrEqual(MIN_DEPOSIT - 0.01);
    });

    it('always rounds up to the nearest cent', () => {
      const gross = grossDeposit(33.33);
      const cents = Math.round(gross * 100);
      expect(cents / 100).toBe(gross);
    });
  });

  // ── netAfterStripe ────────────────────────────────────────
  describe('netAfterStripe', () => {
    it('calculates net amount after Stripe deducts its fee', () => {
      const net = netAfterStripe(103.30);
      // Stripe: 103.30 * 0.029 + 0.30 = ~3.30
      expect(net).toBeCloseTo(100, 0);
    });

    it('net is always less than gross', () => {
      expect(netAfterStripe(25)).toBeLessThan(25);
      expect(netAfterStripe(1000)).toBeLessThan(1000);
    });

    it('handles zero amount', () => {
      expect(netAfterStripe(0)).toBeCloseTo(-0.30, 1); // Stripe still charges the $0.30
    });
  });

  // ── stripeCharge ──────────────────────────────────────────
  describe('stripeCharge', () => {
    it('calculates all components of the Stripe fee', () => {
      const result = stripeCharge(103.30);
      expect(result.stripeFee).toBeGreaterThan(0);
      expect(result.platformReceives).toBeGreaterThan(0);
      expect(result.availableForPayout).toBe(result.platformReceives);
    });

    it('stripeFee + platformReceives approximately equals artistDeposit', () => {
      const result = stripeCharge(100);
      expect(result.stripeFee + result.platformReceives).toBeCloseTo(100, 1);
    });

    it('stripeFee is always positive for positive deposits', () => {
      for (const amount of [25, 50, 100, 500, 1000]) {
        const result = stripeCharge(amount);
        expect(result.stripeFee).toBeGreaterThan(0);
        expect(result.platformReceives).toBeLessThan(amount);
      }
    });
  });

  // ── artistCostPer1KViews ──────────────────────────────────
  describe('artistCostPer1KViews', () => {
    it('adds 20% platform fee on top of CPM', () => {
      expect(artistCostPer1KViews(1000)).toBe(1200); // $10 CPM → $12
      expect(artistCostPer1KViews(100)).toBe(120);   // $1 CPM → $1.20
      expect(artistCostPer1KViews(500)).toBe(600);   // $5 CPM → $6
    });

    it('handles zero CPM', () => {
      expect(artistCostPer1KViews(0)).toBe(0);
    });

    it('handles large CPM values', () => {
      expect(artistCostPer1KViews(100000)).toBe(120000);
    });
  });

  // ── Rounding precision ────────────────────────────────────
  describe('rounding precision', () => {
    it('all monetary values are rounded to 2 decimal places', () => {
      const payout = calculatePayout(3333, 1000);
      expect(payout.creatorEarns * 100 % 1).toBe(0);
      expect(payout.platformRevenue * 100 % 1).toBe(0);
      expect(payout.artistCharged * 100 % 1).toBe(0);

      const charge = stripeCharge(99.99);
      expect(charge.stripeFee * 100 % 1).toBe(0);
      expect(charge.platformReceives * 100 % 1).toBe(0);
    });
  });

  // ── Invariant: platform never loses money ─────────────────
  describe('invariants', () => {
    it('platform revenue is always non-negative', () => {
      for (let views = 0; views <= 100_000; views += 10_000) {
        for (const cpm of [100, 500, 1000, 5000]) {
          const result = calculatePayout(views, cpm);
          expect(result.platformRevenue).toBeGreaterThanOrEqual(0);
          expect(result.creatorEarns).toBeGreaterThanOrEqual(0);
          expect(result.artistCharged).toBeGreaterThanOrEqual(result.creatorEarns);
        }
      }
    });

    it('creator earnings never exceed artist charged', () => {
      const result = calculatePayout(1_000_000, 10000);
      expect(result.creatorEarns).toBeLessThanOrEqual(result.artistCharged);
    });
  });
});
