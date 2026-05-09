// Selah.fm — tiered platform fee based on artist monthly spend
// Fee is deducted from creator payouts, not added to artist budget.
// Higher artist volume → lower creator fee → better rates for creators.

export const FEE_TIERS = [
  { max: 500, rate: 0.20, label: '20%' },
  { max: 2000, rate: 0.15, label: '15%' },
  { max: Infinity, rate: 0.10, label: '10%' },
];

export function getFeeRate(artistMonthlySpend: number): number {
  for (const tier of FEE_TIERS) {
    if (artistMonthlySpend <= tier.max) return tier.rate;
  }
  return 0.20;
}

export function calculatePayout(views: number, cpmCents: number, artistMonthlySpend: number = 0): {
  grossEarnings: number;
  feeRate: number;
  feeAmount: number;
  netPayout: number;
} {
  const gross = (views / 1000) * (cpmCents / 100);
  const rate = getFeeRate(artistMonthlySpend);
  const fee = gross * rate;
  return {
    grossEarnings: Math.round(gross * 100) / 100,
    feeRate: rate,
    feeAmount: Math.round(fee * 100) / 100,
    netPayout: Math.round((gross - fee) * 100) / 100,
  };
}
