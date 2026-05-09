// Selah.fm tiered platform fee structure
// Higher volume = lower fee. Drives scale, rewards loyalty.

export const FEE_TIERS = [
  { max: 500, rate: 0.20 },    // 0–$500 → 20%
  { max: 2000, rate: 0.15 },   // $500–$2,000 → 15%
  { max: Infinity, rate: 0.10 }, // $2,000+ → 10%
];

export function getFeeRate(monthlyVolume: number): number {
  for (const tier of FEE_TIERS) {
    if (monthlyVolume <= tier.max) return tier.rate;
  }
  return 0.20; // fallback
}

export function calculatePayout(views: number, cpmCents: number, monthlyVolume: number): {
  grossEarnings: number;
  feeRate: number;
  feeAmount: number;
  netPayout: number;
} {
  const gross = (views / 1000) * (cpmCents / 100);
  const rate = getFeeRate(monthlyVolume);
  const fee = gross * rate;
  return {
    grossEarnings: Math.round(gross * 100) / 100,
    feeRate: rate,
    feeAmount: Math.round(fee * 100) / 100,
    netPayout: Math.round((gross - fee) * 100) / 100,
  };
}
