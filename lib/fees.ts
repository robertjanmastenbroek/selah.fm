/**
 * Selah.fm Fee Calculations
 * =========================
 * 
 * Fee structure (2026-05):
 * - Platform fee: 20% added ON TOP of the artist's CPM rate
 *   Artist sets CPM = $1.00/1K views → artist is charged $1.20/1K views
 *   Creator earns the FULL $1.00/1K views (no deduction)
 * 
 * - Stripe processing: 2.9% + $0.30 on deposits (paid by artist)
 * - Stripe payout fee: $0.25 per payout to creator
 * 
 * Minimum recommendations based on Stripe fees:
 * - $25 minimum deposit → Stripe takes ~$1.03, leaves $23.97
 * - $1 minimum CPM → viable at any budget level
 * - $20 minimum creator payout → avoids Stripe fee eating earnings
 */

export const PLATFORM_FEE_RATE = 0.20; // 20% added to artist's CPM
export const STRIPE_PROCESSING_RATE = 0.029; // 2.9%
export const STRIPE_PROCESSING_FIXED = 0.30; // $0.30
export const STRIPE_PAYOUT_FEE = 0.25; // $0.25 per payout
export const MIN_DEPOSIT = 25; // $25 minimum
export const MIN_CPM = 1; // $1 per 1000 views
export const MIN_PAYOUT = 20; // $20 minimum payout to creator

/**
 * Calculate what the artist actually pays (including Stripe fees)
 */
export function grossDeposit(netAmount: number): number {
  const gross = ((netAmount + STRIPE_PROCESSING_FIXED) / (1 - STRIPE_PROCESSING_RATE));
  return Math.ceil(gross * 100) / 100;
}

/**
 * Calculate what reaches the platform after Stripe fees
 */
export function netAfterStripe(grossAmount: number): number {
  const fee = grossAmount * STRIPE_PROCESSING_RATE + STRIPE_PROCESSING_FIXED;
  return Math.round((grossAmount - fee) * 100) / 100;
}

/**
 * Calculate artist cost per campaign: CPM + 20% platform fee.
 * Artist sets CPM = X, platform charges X * 1.20.
 * 
 * Returns the total amount the artist is charged per 1K views.
 */
export function artistCostPer1KViews(cpmCents: number): number {
  return Math.round(cpmCents * (1 + PLATFORM_FEE_RATE));
}

/**
 * Calculate creator payout: full CPM, no deduction.
 * Platform revenue is the 20% on top of CPM (not taken from creator).
 * 
 * @param views - verified views
 * @param cpmCents - artist's CPM rate in cents
 * @returns gross (creator earns), platformRevenue (platform earns from artist fee)
 */
export function calculatePayout(views: number, cpmCents: number): {
  creatorEarns: number;
  platformRevenue: number;
  artistCharged: number;
} {
  const cpmDollars = cpmCents / 100;
  const creatorEarns = (views / 1000) * cpmDollars;
  const platformRevenue = creatorEarns * PLATFORM_FEE_RATE;
  const artistCharged = creatorEarns + platformRevenue;
  
  return {
    creatorEarns: Math.round(creatorEarns * 100) / 100,
    platformRevenue: Math.round(platformRevenue * 100) / 100,
    artistCharged: Math.round(artistCharged * 100) / 100,
  };
}

/**
 * Calculate the Stripe charge for an artist deposit
 */
export function stripeCharge(artistDeposit: number): {
  stripeFee: number;
  platformReceives: number;
  availableForPayout: number;
} {
  const stripeFee = Math.round((artistDeposit * STRIPE_PROCESSING_RATE + STRIPE_PROCESSING_FIXED) * 100) / 100;
  const platformReceives = Math.round((artistDeposit - stripeFee) * 100) / 100;
  return { stripeFee, platformReceives, availableForPayout: platformReceives };
}
