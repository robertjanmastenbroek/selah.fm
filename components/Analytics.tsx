'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track pageview in our DB — session tracking, referrer, UTM, user flow
  useEffect(() => {
    try {
      // Generate or reuse session ID (groups all events from one visit)
      let sessionId = sessionStorage.getItem('selah_session_id');
      if (!sessionId) {
        sessionId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
        sessionStorage.setItem('selah_session_id', sessionId);
        
        // First event of session: capture referrer and all UTM params
        const firstRef = document.referrer || '';
        const firstUtmSource = searchParams.get('utm_source') || '';
        const firstUtmMedium = searchParams.get('utm_medium') || '';
        const firstUtmCampaign = searchParams.get('utm_campaign') || '';
        
        if (firstRef || firstUtmSource) {
          sessionStorage.setItem('selah_session_ref', firstRef);
          sessionStorage.setItem('selah_session_utm_source', firstUtmSource);
          sessionStorage.setItem('selah_session_utm_medium', firstUtmMedium);
          sessionStorage.setItem('selah_session_utm_campaign', firstUtmCampaign);
        }
      }

      const ref = sessionStorage.getItem('selah_session_ref') || '';
      const utmSource = sessionStorage.getItem('selah_session_utm_source') || searchParams.get('utm_source') || '';
      const utmMedium = sessionStorage.getItem('selah_session_utm_medium') || searchParams.get('utm_medium') || '';
      const utmCampaign = sessionStorage.getItem('selah_session_utm_campaign') || searchParams.get('utm_campaign') || '';

      // Fire page_view event with full context
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'page_view',
          path: pathname,
          session_id: sessionId,
          referrer: ref || document.referrer,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          metadata: {
            title: document.title,
            search: searchParams.toString(),
          },
        }),
      }).catch(() => {});
    } catch {}
  }, [pathname]);

  // Track UTM params on page load
  useEffect(() => {
    if (!gaId || typeof window === 'undefined') return;
    
    const gtag = (window as any).gtag;
    if (!gtag) return;

    // Send pageview
    gtag('config', gaId, {
      page_path: pathname + (searchParams.toString() ? '?' + searchParams.toString() : ''),
    });

    // Capture UTM params as user properties
    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');

    if (utmSource || utmMedium || utmCampaign) {
      gtag('event', 'utm_captured', {
        utm_source: utmSource || '',
        utm_medium: utmMedium || '',
        utm_campaign: utmCampaign || '',
      });

      // Set as user properties for session-level attribution
      gtag('set', 'user_properties', {
        utm_source: utmSource || 'direct',
        utm_medium: utmMedium || 'none',
        utm_campaign: utmCampaign || 'none',
      });
    }
  }, [pathname, searchParams, gaId]);

  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}',{send_page_view:false});`,
        }}
      />
    </>
  );
}
