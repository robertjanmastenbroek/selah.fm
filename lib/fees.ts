/**
 * Selah.fm Fee Calculations
 * =========================
 * 
 * Fee structure:
 * - Platform fee: 20% taken from creator payouts
 * - Stripe processing: 2.9% + $0.30 on deposits (paid by artist)
 * - Stripe payout fee: $0.25 per payout to creator
 * 
 * Minimum recommendations based on Stripe fees:
 * - $25 minimum deposit → Stripe takes ~$1.03, leaves $23.97
 * - $1 minimum CPM → viable at any budget level
 * - $20 minimum creator payout → avoids Stripe fee eating earnings
 */

export const PLATFORM_FEE_RATE = 0.20; // 20%
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
  // Artist wants to deposit $X. With 2.9% + $0.30, the gross is:
  // net = gross * (1 - 0.029) - 0.30
  // gross = (net + 0.30) / (1 - 0.029)
  return Math.ceil(((netAmount + STRIPE_PROCESSING_FIXED) / (1 - STRIPE_PROCESSING_RATE)) * 100) / 100;
}

/**
 * Calculate what reaches the platform after Stripe fees
 */
export function netAfterStripe(grossAmount: number): number {
  const fee = grossAmount * STRIPE_PROCESSING_RATE + STRIPE_PROCESSING_FIXED;
  return Math.round((grossAmount - fee) * 100) / 100;
}

/**
 * Calculate creator payout: gross → net after platform fee
 */
export function calculatePayout(views: number, cpmCents: number): {
  gross: number;
  platformFee: number;
  net: number;
} {
  const gross = (views / 1000) * (cpmCents / 100);
  const platformFee = Math.round(gross * PLATFORM_FEE_RATE * 100) / 100;
  const net = Math.round((gross - platformFee) * 100) / 100;
  return { gross, platformFee, net };
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
