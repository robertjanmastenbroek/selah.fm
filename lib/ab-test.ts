/**
 * Lightweight A/B testing infrastructure.
 * Cookie-based variant assignment with no external dependencies.
 * 
 * Usage in components:
 *   import { getVariant } from '@/lib/ab-test';
 *   const variant = getVariant('homepage_cta'); // returns 'a' | 'b'
 *   
 * Usage in middleware:
 *   The middleware automatically sets the ab_variant cookie on first visit.
 * 
 * Variants are sticky per-browser (cookie-based) and reset when the experiment
 * name changes or the cookie expires (30 days).
 */

import { cookies } from 'next/headers';

const COOKIE_NAME = 'selah_ab';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

interface Experiment {
  name: string;
  variants: string[];
}

// Register experiments here. Add new experiments as needed.
const EXPERIMENTS: Experiment[] = [
  // { name: 'homepage_cta', variants: ['promote_your_music', 'start_a_campaign'] },
];

/**
 * Get the variant for a given experiment.
 * Works in both server components and client components.
 * 
 * Server component usage:
 *   const variant = getServerVariant('homepage_cta');
 * 
 * Client component usage (pass variant from server or use URL search params):
 *   const variant = searchParams.get('ab') || 'a';
 */
export function getServerVariant(experimentName: string): string {
  // Check if this experiment exists
  const experiment = EXPERIMENTS.find(e => e.name === experimentName);
  if (!experiment) return 'control';

  // Read existing cookie
  const cookieStore = cookies();
  const existingCookie = cookieStore.get(COOKIE_NAME);
  
  let assignments: Record<string, string> = {};
  if (existingCookie) {
    try {
      assignments = JSON.parse(existingCookie.value);
    } catch {
      assignments = {};
    }
  }

  // If already assigned, return existing variant
  if (assignments[experimentName]) {
    return assignments[experimentName];
  }

  // Assign random variant
  const variant = experiment.variants[Math.floor(Math.random() * experiment.variants.length)];
  assignments[experimentName] = variant;
  
  // Set cookie
  cookieStore.set(COOKIE_NAME, JSON.stringify(assignments), {
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    httpOnly: false, // Allow client-side reading
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return variant;
}

/**
 * Client-side variant reader — reads the cookie without Next.js APIs.
 * Use in 'use client' components.
 */
export function getClientVariant(experimentName: string): string {
  if (typeof document === 'undefined') return 'control';
  
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
  if (!match) return 'control';
  
  try {
    const assignments = JSON.parse(decodeURIComponent(match[1]));
    return assignments[experimentName] || 'control';
  } catch {
    return 'control';
  }
}

/**
 * Track an A/B test event for analytics.
 */
export function trackExperiment(experimentName: string, variant: string, event: string) {
  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: `ab_${event}`,
      path: window.location.pathname,
      metadata: { experiment: experimentName, variant },
    }),
  }).catch(() => {});
}
