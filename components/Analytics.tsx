'use client';

import { useEffect, useState } from 'react';

export default function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const [load, setLoad] = useState(false);

  useEffect(() => {
    if (!gaId) return;
    // Defer GA until 3s after load or first user interaction
    const timer = setTimeout(() => setLoad(true), 3000);
    const handler = () => { setLoad(true); clearTimeout(timer); };
    window.addEventListener('scroll', handler, { once: true });
    window.addEventListener('click', handler, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handler);
      window.removeEventListener('click', handler);
    };
  }, [gaId]);

  if (!load || !gaId) return null;

  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`,
        }}
      />
    </>
  );
}
