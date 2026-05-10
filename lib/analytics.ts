/**
 * Google Analytics / gtag event tracking utility.
 * All events are non-blocking — failures are silently ignored.
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

function gtag(...args: any[]) {
  if (typeof window !== 'undefined' && window.gtag) {
    try { window.gtag(...args); } catch {}
  }
}

// ── Conversions ────────────────────────────────────────────────

export function trackSignUp(method: 'google' | 'email') {
  gtag('event', 'sign_up', { method, event_category: 'engagement' });
}

export function trackLogin(method: 'google' | 'email') {
  gtag('event', 'login', { method, event_category: 'engagement' });
}

export function trackCreateCampaign(trackTitle: string, budget: number) {
  gtag('event', 'create_campaign', {
    track_title: trackTitle,
    budget,
    event_category: 'conversion',
  });
}

export function trackFundCampaign(amount: number) {
  gtag('event', 'begin_checkout', {
    value: amount,
    currency: 'USD',
    event_category: 'conversion',
  });
  gtag('event', 'fund_campaign', {
    value: amount,
    currency: 'USD',
    event_category: 'conversion',
  });
}

export function trackSubmitContent(platform: string) {
  gtag('event', 'submit_content', { platform, event_category: 'conversion' });
}

export function trackApproveSubmission() {
  gtag('event', 'approve_submission', { event_category: 'conversion' });
}

export function trackConnectStripe() {
  gtag('event', 'connect_stripe', { event_category: 'conversion' });
}

export function trackConnectSocial(platform: string) {
  gtag('event', 'connect_social', { platform, event_category: 'engagement' });
}

export function trackSaveSettings() {
  gtag('event', 'save_settings', { event_category: 'engagement' });
}
