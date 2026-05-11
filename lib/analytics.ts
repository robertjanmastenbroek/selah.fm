/**
 * Google Analytics / gtag event tracking utility.
 * All events are non-blocking — failures are silently ignored.
 * Events fired before GA loads are queued and flushed once GA is ready.
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// ── Event queue — buffers events before GA loads ────────────────
const eventQueue: Array<[string, Record<string, any>]> = [];

function gtag(...args: any[]) {
  if (typeof window !== 'undefined' && window.gtag) {
    try { window.gtag(...args); } catch {}
  }
}

function track(event: string, params: Record<string, any> = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    // GA is loaded — send directly and flush any pending events
    flushAnalyticsQueue();
    try { window.gtag('event', event, params); } catch {}
  } else {
    // GA not loaded yet — queue for later
    eventQueue.push([event, params]);
  }
}

/** Call this after GA script loads to replay queued events */
export function flushAnalyticsQueue() {
  if (typeof window === 'undefined' || !window.gtag) return;
  while (eventQueue.length > 0) {
    const [event, params] = eventQueue.shift()!;
    try { window.gtag('event', event, params); } catch {}
  }
}

// Also expose for inline script in Analytics component
if (typeof window !== 'undefined') {
  (window as any).__selahFlushGA = flushAnalyticsQueue;
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
