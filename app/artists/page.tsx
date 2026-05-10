import ArtistsClient from './ArtistsClient';

export const dynamic = 'force-dynamic';

async function getArtists() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://selah.fm';
    const res = await fetch(`${baseUrl}/api/artists`, { next: { revalidate: 60 } });
    if (!res.ok) return { artists: [] };
    return res.json();
  } catch {
    return { artists: [] };
  }
}

export default async function ArtistsPage() {
  const data = await getArtists();
  return <ArtistsClient initialArtists={data.artists || []} />;
}
