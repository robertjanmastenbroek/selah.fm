import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/Toast';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Selah.fm — Get your music heard. Only pay for real views.',
  description: 'CPM marketplace connecting artists with creators. Set your budget. Creators make TikToks and Reels. You approve and pay only for verified views.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Selah.fm — Music promotion by real creators',
    description: 'Set your budget. Creators make TikToks and Reels with your track. You review, approve, and pay only for verified views.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Selah.fm — Music promotion by real creators',
    description: 'Set your budget. Creators make TikToks and Reels with your track. You review, approve, and pay only for verified views.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body className="min-h-screen"><ToastProvider>{children}</ToastProvider></body>
    </html>
  );
}
