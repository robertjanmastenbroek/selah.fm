import type { Metadata } from 'next';
import HomePageClient from '@/components/HomePageClient';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Revalidate every 5 minutes

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
  // Fetch stats server-side so the page always shows the real count
  let initialStats = { artists: 0, creators: 0, activeCampaigns: 0, totalPaidCents: 0, totalViews: 0, donors: 0, totalDonatedCents: 0, totalDepositedCents: 0 };
  let featuredCampaigns: any[] = [];
  let totalActive = 0;

  try {
    const [artistCount] = await sql`SELECT COUNT(*)::int as count FROM users WHERE is_artist = true`;
    const [creatorCount] = await sql`SELECT COUNT(*)::int as count FROM users WHERE is_creator = true`;
    const [campaignCount] = await sql`SELECT COUNT(*)::int as count FROM campaigns WHERE status = 'active'`;
    const [deposits] = await sql`SELECT COALESCE(SUM(total_budget_cents)::bigint, 0) as total FROM campaigns WHERE total_budget_cents > 0`;

    initialStats = {
      artists: artistCount?.count || 0,
      creators: creatorCount?.count || 0,
      activeCampaigns: campaignCount?.count || 0,
      totalPaidCents: 0,
      totalViews: 0,
      donors: 0,
      totalDonatedCents: 0,
      totalDepositedCents: Number(deposits?.total || 0),
    };
    totalActive = campaignCount?.count || 0;

    featuredCampaigns = await sql`
      SELECT c.id, c.track_title, c.title, c.slug, 
             COALESCE(c.cover_art_url, '/images/og-image.jpg') as cover_art_url,
             c.cpm_rate_cents, c.total_budget_cents, c.budget_remaining_cents, c.status, 
             u.display_name as artist_name
      FROM campaigns c
      LEFT JOIN users u ON u.id = c.artist_id
      WHERE c.status = 'active'
      ORDER BY c.created_at DESC
      LIMIT 6
    `;
  } catch {}

  return <HomePageClient initialStats={initialStats} initialFeatured={featuredCampaigns} initialTotalActive={totalActive} />;
}
