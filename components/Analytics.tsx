'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
