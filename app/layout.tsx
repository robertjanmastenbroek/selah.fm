import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import SupportWidgetClient from '@/components/SupportWidgetClient';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Selah.fm — Open Source Music Promotion Marketplace | Pay Creators for TikTok, Reels & Shorts',
  description: 'Open source CPM marketplace for music promotion. Artists set budgets, creators make TikToks/Reels/Shorts, artists approve and pay for verified views. MIT licensed.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Selah.fm — Open Source Music Promotion Marketplace',
    description: 'Set your CPM rate, approve every video, pay only for verified views. Fully open source under MIT license. Star us on GitHub.',
    type: 'website',
    siteName: 'Selah.fm',
    url: 'https://selah.fm',
    images: [{ url: 'https://selah.fm/images/og-social.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Selah.fm — Open Source Music Promotion Marketplace',
    description: 'Set your CPM, approve every video, pay only for verified views. Fully open source.',
    images: ['https://selah.fm/images/og-social.png'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <head>
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script dangerouslySetInnerHTML={{__html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`}} />
          </>
        )}
      </head>
      <body className="min-h-screen bg-background">
        {/* Grain texture overlay */}
        <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px 256px',
        }} />
        <ErrorBoundary>
          <ToastProvider>{children}</ToastProvider>
          <SupportWidgetClient />
        </ErrorBoundary>
        {/* Open source footer */}
        <footer className="border-t border-white/[0.04] py-4 px-4 text-center">
          <a
            href="https://github.com/robertjanmastenbroek/selah.fm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="opacity-50">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Open source · MIT licensed
          </a>
        </footer>
      </body>
    </html>
  );
}
