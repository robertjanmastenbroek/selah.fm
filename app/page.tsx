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

export default async function HomePage() {
  // Fetch stats server-side from the API (avoids DB connection issues in server components)
  let initialStats = { artists: 0, creators: 0, activeCampaigns: 0, totalPaidCents: 0, totalViews: 0, donors: 0, totalDonatedCents: 0, totalDepositedCents: 0 };
  let featuredCampaigns: any[] = [];
  let totalActive = 0;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://selah.fm';
    const [statsRes, campaignsRes] = await Promise.all([
      fetch(`${baseUrl}/api/stats`, { next: { revalidate: 60 } }),
      fetch(`${baseUrl}/api/campaigns?limit=6&sort=recent`, { next: { revalidate: 60 } }),
    ]);

    if (statsRes.ok) {
      const stats = await statsRes.json();
      initialStats = stats;
      totalActive = stats.activeCampaigns || 0;
    }

    if (campaignsRes.ok) {
      const campaigns = await campaignsRes.json();
      featuredCampaigns = campaigns.campaigns || [];
      if (campaigns.total) totalActive = campaigns.total;
    }
  } catch {}

  return <HomePageClient initialStats={initialStats} initialFeatured={featuredCampaigns} initialTotalActive={totalActive} />;
}
