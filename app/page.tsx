import type { Metadata } from 'next';
import HomePageClient from '@/components/HomePageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Selah.fm — Music Promotion Marketplace | Get Your Music on TikTok, Reels & Shorts',
  description: 'The marketplace where real creators make content for your music. Set your CPM, approve every video, and only pay for verified views. Open source & fair.',
  openGraph: {
    title: 'Selah.fm — Music Promotion Marketplace',
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
