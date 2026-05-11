/**
 * Google Analytics / gtag event tracking utility.
 * All events are non-blocking — failures are silently ignored.
 * Pushes directly to dataLayer (always available from inline script).
 * Falls back to window.gtag when the GA library has loaded.
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// ── Track: push to dataLayer (always available), gtag as fallback ──
function track(event: string, params: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;
  try {
    // Match the inline gtag() format: dataLayer.push(['event', name, params])
    // This is how page_view and other built-in events are sent.
    if (window.dataLayer) {
      window.dataLayer.push(['event', event, params]);
    }
  } catch {}
}

// ── Conversions ────────────────────────────────────────────────

export function trackSignUp(method: 'google' | 'email') {
  track('sign_up', { signup_method: method });
}

export function trackLogin(method: 'google' | 'email') {
  track('login', { signup_method: method });
}

export function trackCreateCampaign(trackTitle: string, budget: number) {
  track('create_campaign', { track_title: trackTitle, budget });
}

export function trackFundCampaign(amount: number) {
  track('begin_checkout', { value: amount, currency: 'USD' });
  track('fund_campaign', { value: amount, currency: 'USD' });
}

export function trackSubmitContent(platform: string) {
  track('submit_content', { platform });
}

export function trackApproveSubmission() {
  track('approve_submission', {});
}

export function trackConnectStripe() {
  track('connect_stripe', {});
}

export function trackConnectCompleted() {
  track('connect_completed', {});
}

export function trackConnectSocial(platform: string) {
  track('connect_social', { platform });
}

export function trackSaveSettings() {
  track('save_settings', {});
}
