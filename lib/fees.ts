// Selah.fm — flat 20% platform fee on creator payouts
// Artists pay what they budget. Creators earn 80% of their payout.

export const PLATFORM_FEE_RATE = 0.20;

export function calculatePayout(views: number, cpmCents: number): {
  grossEarnings: number;
  feeRate: number;
  feeAmount: number;
  netPayout: number;
} {
  const gross = (views / 1000) * (cpmCents / 100);
  const fee = gross * PLATFORM_FEE_RATE;
  return {
    grossEarnings: Math.round(gross * 100) / 100,
    feeRate: PLATFORM_FEE_RATE,
    feeAmount: Math.round(fee * 100) / 100,
    netPayout: Math.round((gross - fee) * 100) / 100,
  };
}
