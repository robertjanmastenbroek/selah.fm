import type { Metadata } from 'next';
import HomePageClient from '@/components/HomePageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Selah.fm — Open Source CPM Music Promotion Marketplace',
  description: 'Open source CPM marketplace for music promotion. Artists set budgets, creators make TikToks/Reels/Shorts, artists approve and pay for verified views. MIT licensed.',
  openGraph: {
    title: 'Selah.fm — CPM Music Promotion Marketplace',
    description: 'Set your CPM rate, approve every video, pay only for verified views. Fully open source under MIT license. Star us on GitHub.',
    type: 'website',
    siteName: 'Selah.fm',
    url: 'https://selah.fm',
    images: [{ url: 'https://selah.fm/images/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Selah.fm — Music Promotion Marketplace',
    description: 'Set your CPM, approve every video, pay only for verified views. Fully open source.',
    images: ['https://selah.fm/images/og-image.jpg'],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://selah.fm' },
};

export default function HomePage() {
  return <HomePageClient />;
}
