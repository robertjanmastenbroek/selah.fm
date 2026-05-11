import { Metadata } from 'next';
import CampaignDetailClient from './CampaignDetailClient';

export const dynamic = 'force-dynamic';

interface Props { params: { id: string } }

async function getCampaign(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://selah.fm';
    const res = await fetch(`${baseUrl}/api/campaigns/${id}`, { next: { revalidate: 5 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const campaign = await getCampaign(params.id);
  if (!campaign) return { title: 'Campaign not found — Selah.fm' };

  const displayTitle = campaign.title || campaign.track_title;
  const artistName = campaign.artist_name || 'the artist';
  const trackTitle = campaign.track_title;
  const cpm = campaign.cpm_rate_cents ? (campaign.cpm_rate_cents / 100).toFixed(2) : null;
  const imageUrl = campaign.cover_art_url || 'https://selah.fm/images/hero-illustration.png';
  const canonicalUrl = `https://selah.fm/c/${params.id}`;

  // Tiered title templates — balanced default
  const title = `Submit a Video for ${artistName}'s "${trackTitle}" & Earn Per View — Selah.fm`;

  // Rich meta description
  const desc = cpm
    ? `Help promote ${artistName}'s track "${trackTitle}". Creators: submit your video and earn $${cpm} per 1K verified views. Fans: donate to boost the campaign. Join now on Selah.fm, the UGC music marketplace.`
    : `Help promote ${artistName}'s track "${trackTitle}". Creators: submit your video and earn per view. Fans: donate to support. Join now on Selah.fm.`;

  return {
    title,
    description: desc,
    alternates: { canonical: canonicalUrl },
    keywords: [
      `submit video ${trackTitle}`,
      `earn money ${artistName}`,
      `music promotion ${trackTitle}`,
      artistName,
      trackTitle,
      'music video contest',
      'get paid per view',
      'ugc music',
      'selah.fm',
    ],
    openGraph: {
      title,
      description: desc,
      type: 'website',
      url: canonicalUrl,
      siteName: 'Selah.fm',
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [imageUrl],
    },
    robots: { index: true, follow: true },
  };
}

export default async function CampaignPage({ params }: Props) {
  const campaign = await getCampaign(params.id);

  const displayTitle = campaign?.title || campaign?.track_title || 'Untitled';
  const artistName = campaign?.artist_name || 'an artist';
  const trackTitle = campaign?.track_title || '';
  const imageUrl = campaign?.cover_art_url || 'https://selah.fm/images/hero-illustration.png';
  const canonicalUrl = `https://selah.fm/c/${params.id}`;
  const createdAt = campaign?.created_at || new Date().toISOString();
  const cpmDollars = campaign?.cpm_rate_cents ? (campaign.cpm_rate_cents / 100).toFixed(2) : null;
  const budget = campaign?.total_budget_cents ? (campaign.total_budget_cents / 100).toFixed(0) : null;

  // Multi-schema JSON-LD
  const jsonLd = campaign ? {
    '@context': 'https://schema.org',
    '@graph': [
      // VideoObject — campaign as a video creation opportunity
      {
        '@type': 'VideoObject',
        name: `${artistName} - ${trackTitle} Campaign`,
        description: cpmDollars
          ? `Earn $${cpmDollars} per 1,000 verified views by submitting a video for "${trackTitle}".`
          : `Submit a video for "${trackTitle}" and earn per verified view.`,
        thumbnailUrl: imageUrl,
        contentUrl: canonicalUrl,
        uploadDate: createdAt,
      },
      // EventSeries — ongoing music promotion event
      {
        '@type': 'EventSeries',
        name: `${trackTitle} Video Contest`,
        description: cpmDollars
          ? `Submit your video and earn $${cpmDollars} per 1K views, or donate to support ${artistName}.`
          : `Submit your video and earn, or donate to support ${artistName}.`,
        url: canonicalUrl,
        startDate: createdAt,
        organizer: {
          '@type': 'MusicGroup',
          name: artistName,
        },
      },
      // BreadcrumbList
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Selah.fm', item: 'https://selah.fm' },
          { '@type': 'ListItem', position: 2, name: 'Browse Campaigns', item: 'https://selah.fm/browse' },
          { '@type': 'ListItem', position: 3, name: displayTitle, item: canonicalUrl },
        ],
      },
      // Offer
      ...(cpmDollars ? [{
        '@type': 'Offer',
        name: `Earn $${cpmDollars} per 1,000 verified views`,
        price: cpmDollars,
        priceCurrency: 'USD',
        description: `Creators earn 80% of $${cpmDollars} CPM rate.${budget ? ` Total budget: $${budget}.` : ''}`,
        url: canonicalUrl,
      }] : []),
    ],
  } : null;

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <CampaignDetailClient id={params.id} initialCampaign={campaign} />
    </>
  );
}
