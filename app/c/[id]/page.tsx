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

  const displayTitle = campaign.title || campaign.track_title;
  const imageUrl = campaign.cover_art_url || 'https://selah.fm/images/hero-illustration.png';
  const desc = campaign.requirements
    ? `${campaign.requirements.slice(0, 120)}${campaign.requirements.length > 120 ? '…' : ''}`
    : `${displayTitle} on Selah.fm — creators earn per verified view.`;

  return {
    title: `${displayTitle} — Selah.fm`,
    description: desc,
    openGraph: {
      title: `${displayTitle} — Selah.fm`,
      description: desc,
      type: 'website',
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayTitle} — Selah.fm`,
      description: desc,
      images: [imageUrl],
    },
  };
}

export default async function CampaignPage({ params }: Props) {
  const campaign = await getCampaign(params.id);
  return <CampaignDetailClient id={params.id} initialCampaign={campaign} />;
}
