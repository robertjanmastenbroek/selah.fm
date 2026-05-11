/**
 * Google Analytics Measurement Protocol — server-side event tracking.
 * Sends events from API routes, bypassing all client-side timing issues.
 */

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;
const GA_API_SECRET = process.env.GA_API_SECRET;

export async function trackEvent(
  eventName: string,
  params: Record<string, any> = {},
  clientId?: string
) {
  if (!GA_MEASUREMENT_ID || !GA_API_SECRET) return;
  
  try {
    const url = `https://www.google-analytics.com/mp/collect?api_secret=${GA_API_SECRET}&measurement_id=${GA_MEASUREMENT_ID}`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId || 'server-side',
        events: [{ name: eventName, params }],
      }),
    });
  } catch {
    // silently ignore — analytics is non-critical
  }
}

export function trackSignUp(method: 'google' | 'email', clientId?: string) {
  return trackEvent('sign_up', { signup_method: method }, clientId);
}

export function trackLogin(method: 'google' | 'email', clientId?: string) {
  return trackEvent('login', { signup_method: method }, clientId);
}

export function trackCreateCampaign(trackTitle: string, budget: number, clientId?: string) {
  return trackEvent('create_campaign', { track_title: trackTitle, budget }, clientId);
}

export function trackFundCampaign(amount: number, clientId?: string) {
  return trackEvent('fund_campaign', { value: amount, currency: 'USD' }, clientId);
}
