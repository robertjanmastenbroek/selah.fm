import BrowseClient from './BrowseClient';

export const dynamic = 'force-dynamic';

async function getCampaigns() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://selah.fm';
    const res = await fetch(`${baseUrl}/api/campaigns`, { next: { revalidate: 30 } });
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
