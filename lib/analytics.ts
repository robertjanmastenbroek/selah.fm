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
    // Primary: push directly to dataLayer — always available from inline script
    if (window.dataLayer) {
      window.dataLayer.push(['event', event, params]);
    }
    // Secondary: also call window.gtag if the GA library has loaded
    if (window.gtag) {
      window.gtag('event', event, params);
    }
  } catch {}
}

// ── Conversions ────────────────────────────────────────────────

export function trackSignUp(method: 'google' | 'email') {
  track('sign_up', { method, event_category: 'engagement' });
}

export function trackLogin(method: 'google' | 'email') {
  track('login', { method, event_category: 'engagement' });
}

export function trackCreateCampaign(trackTitle: string, budget: number) {
  track('create_campaign', {
    track_title: trackTitle,
    budget,
    event_category: 'conversion',
  });
}

export function trackFundCampaign(amount: number) {
  track('begin_checkout', {
    value: amount,
    currency: 'USD',
    event_category: 'conversion',
  });
  track('fund_campaign', {
    value: amount,
    currency: 'USD',
    event_category: 'conversion',
  });
}

export function trackSubmitContent(platform: string) {
  track('submit_content', { platform, event_category: 'conversion' });
}

export function trackApproveSubmission() {
  track('approve_submission', { event_category: 'conversion' });
}

export function trackConnectStripe() {
  track('connect_stripe', { event_category: 'conversion' });
}

export function trackConnectCompleted() {
  track('connect_completed', { event_category: 'conversion' });
}

export function trackConnectSocial(platform: string) {
  track('connect_social', { platform, event_category: 'engagement' });
}

export function trackSaveSettings() {
  track('save_settings', { event_category: 'engagement' });
}
