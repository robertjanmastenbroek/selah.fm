import { Metadata } from 'next';
import CampaignDetailClient from './CampaignDetailClient';

export const dynamic = 'force-dynamic';

interface Props { params: { id: string } }

async function getCampaign(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://selah.fm';
    const res = await fetch(`${baseUrl}/api/campaigns/${id}`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const campaign = await getCampaign(params.id);
  if (!campaign) return { title: 'Campaign not found — Selah.fm' };

  const imageUrl = campaign.cover_art_url || 'https://selah.fm/images/og-social.png';
  const desc = campaign.requirements
    ? `Promote "${campaign.track_title}" on TikTok, Reels & Shorts. ${campaign.requirements.slice(0, 120)}…`
    : `Promote "${campaign.track_title}" on TikTok, Instagram Reels, and YouTube Shorts. Creators earn per verified view.`;

  return {
    title: `Promote "${campaign.track_title}" — Selah.fm`,
    description: desc,
    openGraph: {
      title: `Promote "${campaign.track_title}" — Selah.fm`,
      description: desc,
      type: 'website',
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Promote "${campaign.track_title}" — Selah.fm`,
      description: desc,
      images: [imageUrl],
    },
  };
}

export default async function CampaignPage({ params }: Props) {
  const campaign = await getCampaign(params.id);
  return <CampaignDetailClient id={params.id} initialCampaign={campaign} />;
}
