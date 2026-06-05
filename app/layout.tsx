import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Suspense, lazy } from 'react';
import Script from 'next/script';
import { ToastProvider } from '@/components/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import SupportWidget from '@/components/SupportWidget';
import CookieBanner from '@/components/CookieBanner';
import NewsletterSignup from '@/components/NewsletterSignup';
import { Poppins, Righteous } from "next/font/google";
import Analytics from '@/components/Analytics';
import CommandPalette from '@/components/CommandPalette';
import { cn } from "@/lib/utils";

// Dynamic import for page transitions — framer-motion is heavy (37+ files import it)
const PageTransition = lazy(() => import('@/components/PageTransition'));

const poppins = Poppins({subsets:['latin'],weight:['300','400','500','600','700'],variable:'--font-sans',display:'swap',preload:true});
const righteous = Righteous({subsets:['latin'],weight:'400',variable:'--font-heading',display:'swap',preload:true});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Allow pinch-zoom for WCAG 1.4.4 compliance
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: 'Selah.fm — Open Source Music Promotion Marketplace | Pay Creators for TikTok, Reels & Shorts',
  description: 'Open source CPM marketplace for music promotion. Artists set budgets, creators make TikToks/Reels/Shorts, artists approve and pay for verified views. MIT licensed.',
  icons: { icon: '/favicon.svg?v=2' },
  openGraph: {
    title: 'Selah.fm — Open Source Music Promotion Marketplace',
    description: 'Set your CPM rate, approve every video, pay only for verified views. Fully open source under MIT license. Star us on GitHub.',
    type: 'website',
    siteName: 'Selah.fm',
    url: 'https://selah.fm',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Selah.fm — Open Source Music Promotion Marketplace',
    description: 'Set your CPM, approve every video, pay only for verified views. Fully open source.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", poppins.variable, righteous.variable)}>
      <head>
        <link rel="icon" href="/favicon.svg?v=3" type="image/svg+xml" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://accounts.google.com" />
        <link rel="dns-prefetch" href="https://api.stripe.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="preload" as="image" href="/images/selah-nav-logo.png" fetchPriority="high" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0F0F23" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Selah.fm" />
        <link rel="apple-touch-icon" href="/images/selah-nav-logo.png" />
        {/* Third-party scripts moved to next/script in body for non-blocking loading */}
      </head>
      <body className="min-h-screen bg-background overflow-x-hidden">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[10000] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:text-sm focus:font-medium focus:outline-none">
          Skip to content
        </a>
        <div id="aria-live" aria-live="polite" aria-atomic="true" className="sr-only" />
        <ErrorBoundary>
          <PageTransition>
            <main id="main-content" tabIndex={-1}>
              <ToastProvider>{children}</ToastProvider>
            </main>
          </PageTransition>
        </ErrorBoundary>
        <footer className="border-t border-white/[0.04] py-5 px-4">
          <div className="flex items-center justify-center gap-5 flex-wrap">
            <a href="https://instagram.com/selahfm" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/40 hover:text-muted-foreground transition-colors" title="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="https://www.tiktok.com/@selah.fm" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/40 hover:text-muted-foreground transition-colors" title="TikTok">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
            </a>
            <a href="https://x.com/selah_fm" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/40 hover:text-muted-foreground transition-colors" title="X / Twitter">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <span className="text-muted-foreground/15 select-none">·</span>
            <a href="/blog" className="text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors">Blog</a>
            <span className="text-muted-foreground/15 select-none">·</span>
            <a href="/faq" className="text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors">FAQ & Support</a>
            <span className="text-muted-foreground/15 select-none">·</span>
            <a href="/privacy" className="text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors">Privacy</a>
            <span className="text-muted-foreground/15 select-none">·</span>
            <a href="/tos" className="text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors">Terms</a>
            <span className="text-muted-foreground/15 select-none">·</span>
            <a href="/dmca" className="text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors">DMCA</a>
            <span className="text-muted-foreground/15 select-none">·</span>
            <a href="https://github.com/robertjanmastenbroek/selah.fm" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="opacity-50">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Open source
            </a>
          </div>
        </footer>
        {/* Third-party scripts loaded non-blocking via next/script */}
        {process.env.NODE_ENV === 'production' && (
          <Script id="service-worker" strategy="lazyOnload" dangerouslySetInnerHTML={{
            __html: `if('serviceWorker'in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(err){console.log('SW registration failed:',err)})})}`
          }} />
        )}
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${process.env.NEXT_PUBLIC_META_PIXEL_ID}');fbq('track','PageView');`
          }} />
        )}
        {process.env.NEXT_PUBLIC_GOOGLE_ADS_ID && (
          <Script id="google-ads-config" strategy="afterInteractive" dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}');`
          }} />
        )}
        {process.env.NEXT_PUBLIC_GOOGLE_ADS_ID && (
          <Script id="google-ads-src" strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}`} />
        )}

        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        <Suspense fallback={null}>
          <SupportWidget />
        </Suspense>
        <Suspense fallback={null}>
          <CookieBanner />
          <CommandPalette />
        </Suspense>
        <Suspense fallback={null}>
          <NewsletterSignup source="selah.fm-layout" />
        </Suspense>
      </body>
    </html>
  );
}
