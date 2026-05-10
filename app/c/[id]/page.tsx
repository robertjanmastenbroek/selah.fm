import { Metadata } from 'next';
import sql from '@/lib/db';
import CampaignDetailClient from './CampaignDetailClient';

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const campaigns = await sql`
      SELECT track_title, cover_art_url, recommended_hashtags, requirements
      FROM campaigns WHERE id = ${params.id}
    `;
    if (campaigns.length === 0) {
      return { title: 'Campaign not found — Selah.fm' };
    }
    const c = campaigns[0];
    const imageUrl = c.cover_art_url || 'https://selah.fm/images/og-image.svg';
    const desc = c.requirements
      ? `Promote "${c.track_title}" on TikTok, Reels & Shorts. ${c.requirements.slice(0, 120)}…`
      : `Promote "${c.track_title}" on TikTok, Instagram Reels, and YouTube Shorts. Creators earn per verified view.`;

    return {
      title: `Promote "${c.track_title}" — Selah.fm`,
      description: desc,
      openGraph: {
        title: `Promote "${c.track_title}" — Selah.fm`,
        description: desc,
        type: 'website',
        images: [{ url: imageUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `Promote "${c.track_title}" — Selah.fm`,
        description: desc,
        images: [imageUrl],
      },
    };
  } catch {
    return { title: 'Campaign — Selah.fm' };
  }
}

export default function CampaignPage({ params }: Props) {
  return <CampaignDetailClient id={params.id} />;
}
