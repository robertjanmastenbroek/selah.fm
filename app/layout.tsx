import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/Toast';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Selah.fm — Music Promotion Marketplace | Pay Creators for TikTok, Reels & Shorts',
  description: 'Get your music heard on TikTok, Instagram Reels, and YouTube Shorts. Set your CPM rate, approve every video, and pay only for verified views. Free to start.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Selah.fm — Music Promotion Marketplace | Pay Creators for TikTok, Reels & Shorts',
    description: 'Get paid to post music you love. The transparent CPM marketplace for music promotion.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Selah.fm — Music Promotion Marketplace | Pay Creators for TikTok, Reels & Shorts',
    description: 'Get paid to post music you love.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body className="min-h-screen"><ToastProvider>{children}</ToastProvider></body>
    </html>
  );
}
