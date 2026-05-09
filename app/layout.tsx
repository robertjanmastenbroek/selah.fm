import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/Toast';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Selah.fm — Get your music heard.',
  description: 'Get paid to post music you love. The transparent CPM marketplace connecting artists and creators on TikTok, Reels, and Shorts.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Selah.fm — Get your music heard.',
    description: 'Get paid to post music you love. The transparent CPM marketplace for music promotion.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Selah.fm — Get your music heard.',
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
