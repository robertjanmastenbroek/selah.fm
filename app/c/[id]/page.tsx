import { Metadata } from 'next';
import CampaignDetailClient from './CampaignDetailClient';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Props { params: { id: string } }

/** Direct DB query — no HTTP fetch, no network failure risk for metadata */
async function getCampaign(id: string) {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const campaigns = isUuid
      ? await sql`
          SELECT c.*, COALESCE(c.title, c.track_title) as title,
            COALESCE(u.display_name, da.artist_name) as artist_name
          FROM campaigns c
          LEFT JOIN users u ON u.id = c.artist_id
          LEFT JOIN campaign_claims cc ON cc.campaign_id = c.id
          LEFT JOIN discovered_artists da ON da.id = cc.discovered_artist_id
          WHERE c.id = ${id}::uuid
        `
      : await sql`
          SELECT c.*, COALESCE(c.title, c.track_title) as title,
            COALESCE(u.display_name, da.artist_name) as artist_name
          FROM campaigns c
          LEFT JOIN users u ON u.id = c.artist_id
          LEFT JOIN campaign_claims cc ON cc.campaign_id = c.id
          LEFT JOIN discovered_artists da ON da.id = cc.discovered_artist_id
          WHERE c.slug = ${id}
        `;
    return campaigns[0] || null;
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

function absoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_URL || 'https://selah.fm';
  if (!path) return `${base}/images/og-image.jpg`;
  if (path.startsWith('data:')) return `${base}/images/og-image.jpg`;
  if (path.startsWith('/images/campaigns/')) return `${base}${path}`;
  if (path.startsWith('/images/')) return `${base}${path}`;
  if (path.startsWith('http')) return path;
  return `${base}${path}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const campaign = await getCampaign(params.id);
  if (!campaign) {
    return {
      title: 'Campaign not found — Selah.fm',
      openGraph: { images: [{ url: 'https://selah.fm/images/og-image.jpg' }] },
      twitter: { card: 'summary_large_image', images: ['https://selah.fm/images/og-image.jpg'] },
    };
  }

  const displayTitle = campaign.title || campaign.track_title;
  const artistName = campaign.artist_name || 'the artist';
  const trackTitle = campaign.track_title;
  const cpm = campaign.cpm_rate_cents ? (campaign.cpm_rate_cents / 100).toFixed(2) : null;
  const imageUrl = absoluteUrl(campaign.cover_art_url);
  const canonicalUrl = `https://selah.fm/c/${params.id}`;

  // Tiered title templates — balanced default
  const title = `Join this campaign for ${artistName}'s "${trackTitle}" — Selah.fm`;

  // Meta description — keep under ~200 chars for WhatsApp/Instagram crawlers
  const desc = cpm
    ? `Join ${artistName}'s campaign for "${trackTitle}". Submit your video and earn $${cpm} per 1K verified views on Selah.fm.`
    : `Join ${artistName}'s campaign for "${trackTitle}". Submit your video and earn per view on Selah.fm.`;

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
      images: [{ url: imageUrl }],
      ...(process.env.FACEBOOK_APP_ID ? { 'fb:app_id': process.env.FACEBOOK_APP_ID } : {}),
    } as any,
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [imageUrl],
    },
    robots: { index: true, follow: true },
  };
}

function stripBase64Images(data: any): any {
  if (!data) return data;
  // If cover_art_url is a base64 data URL (>1KB), strip it from the initial payload
  if (typeof data.cover_art_url === 'string' && data.cover_art_url.startsWith('data:') && data.cover_art_url.length > 1000) {
    data = { ...data, cover_art_url: '' };
  }
  // Also strip from donations supporters
  return data;
}

export default async function CampaignPage({ params }: Props) {
  const campaign = await getCampaign(params.id);
  const lightweightCampaign = stripBase64Images(campaign);

  const displayTitle = campaign?.title || campaign?.track_title || 'Untitled';
  const artistName = campaign?.artist_name || 'an artist';
  const trackTitle = campaign?.track_title || '';
  const imageUrl = absoluteUrl(campaign?.cover_art_url);
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
          ? `Join this campaign and earn $${cpmDollars} per 1,000 verified views by submitting a video for "${trackTitle}".`
          : `Join this campaign for "${trackTitle}" and earn per verified view.`,
        thumbnailUrl: imageUrl,
        contentUrl: canonicalUrl,
        uploadDate: createdAt,
      },
      // EventSeries — ongoing music promotion event
      {
        '@type': 'EventSeries',
        name: `${trackTitle} Video Contest`,
        description: cpmDollars
          ? `Join this campaign and earn $${cpmDollars} per 1K views, or donate to support ${artistName}.`
          : `Join this campaign and earn, or donate to support ${artistName}.`,
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
        name: `Join campaign — earn $${cpmDollars} per 1,000 verified views`,
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
      <CampaignDetailClient id={params.id} initialCampaign={lightweightCampaign} />
    </>
  );
}
