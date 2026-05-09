import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'SendMusic.io — Get your music heard. Only pay for real views.',
  description: 'CPM marketplace connecting artists with creators. Set your budget. Creators make TikToks and Reels. You approve and pay only for verified views.',
  openGraph: {
    title: 'SendMusic.io — Music promotion by real creators',
    description: 'Set your budget. Creators make TikToks and Reels with your track. You review, approve, and pay only for verified views.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SendMusic.io — Music promotion by real creators',
    description: 'Set your budget. Creators make TikToks and Reels with your track. You review, approve, and pay only for verified views.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen"><ToastProvider>{children}</ToastProvider></body>
    </html>
  );
}
