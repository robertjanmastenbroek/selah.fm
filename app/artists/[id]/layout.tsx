import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

async function getArtist(id: string) {
  try {
    const base = process.env.NEXT_PUBLIC_URL || 'https://selah.fm';
    const res = await fetch(`${base}/api/artists/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const artist = await getArtist(id);
  if (!artist) return { title: 'Artist — Selah.fm' };

  return {
    title: `${artist.display_name} — Selah.fm Artist`,
    description: artist.bio
      ? artist.bio.slice(0, 160)
      : `${artist.display_name} runs music promotion campaigns on Selah.fm with ${artist.active_campaigns || 0} active campaigns.`,
    openGraph: {
      title: `${artist.display_name} — Selah.fm`,
      description: artist.bio ? artist.bio.slice(0, 160) : `Music artist on Selah.fm`,
      url: `https://selah.fm/artists/${id}`,
      type: 'profile',
      images: artist.profile_image_url ? [{ url: artist.profile_image_url }] : [],
    },
    twitter: {
      card: 'summary',
      title: `${artist.display_name} — Selah.fm`,
      description: artist.bio ? artist.bio.slice(0, 160) : `Music artist on Selah.fm`,
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
