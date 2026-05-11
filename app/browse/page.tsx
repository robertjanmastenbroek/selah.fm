import BrowseClient from './BrowseClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Browse Music Campaigns — Selah.fm',
    description: 'Discover music promotion campaigns from artists. Submit your video, earn for verified views, or donate to support your favorite tracks.',
    openGraph: {
      title: 'Browse Music Campaigns — Selah.fm',
      description: 'Discover music promotion campaigns from artists. Submit your video, earn for verified views, or donate to support your favorite tracks.',
      url: 'https://selah.fm/browse',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Browse Music Campaigns — Selah.fm',
      description: 'Discover music promotion campaigns from artists.',
    },
  };
}

async function getCampaigns() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://selah.fm';
    const res = await fetch(`${baseUrl}/api/campaigns`);
    if (!res.ok) return { campaigns: [], total: 0 };
    return res.json();
  } catch {
    return { campaigns: [], total: 0 };
  }
}

export default async function BrowsePage() {
  const data = await getCampaigns();
  return <BrowseClient initialCampaigns={data.campaigns || []} initialTotal={data.total || 0} />;
}
