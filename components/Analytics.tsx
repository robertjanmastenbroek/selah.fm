'use client';

import { useEffect } from 'react';

export default function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  useEffect(() => {
    if (!gaId) return;
    // Load GA immediately — deferred loading causes events to be lost
    // when users sign up/login faster than the 3s delay.
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');setTimeout(function(){if(window.__selahFlushGA)window.__selahFlushGA()},500);`;
    document.head.appendChild(script2);
  }, [gaId]);

  if (!gaId) return null;
  return null; // scripts injected via useEffect
}
