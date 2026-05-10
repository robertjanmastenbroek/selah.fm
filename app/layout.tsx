import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Selah.fm — Music Promotion Marketplace | Pay Creators for TikTok, Reels & Shorts',
  description: 'Get your music heard on TikTok, Instagram Reels, and YouTube Shorts. Set your CPM rate, approve every video, and pay only for verified views. Free to start.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Selah.fm — Music Promotion Marketplace | Pay Creators for TikTok, Reels & Shorts',
    description: 'Set your CPM rate, approve every video, and pay only for verified views. The transparent marketplace for music promotion on TikTok, Reels, and Shorts.',
    type: 'website',
    siteName: 'Selah.fm',
    url: 'https://selah.fm',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Selah.fm — Music Promotion Marketplace | Pay Creators for TikTok, Reels & Shorts',
    description: 'Set your CPM, approve every video, pay only for verified views.',
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
        </ErrorBoundary>
      </body>
    </html>
  );
}
