import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

async function getCreator(id: string) {
  try {
    const base = process.env.NEXT_PUBLIC_URL || 'https://selah.fm';
    const res = await fetch(`${base}/api/creators/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const creator = await getCreator(id);
  if (!creator) return { title: 'Creator — Selah.fm' };

  return {
    title: `${creator.display_name} — Selah.fm Creator`,
    description: creator.bio
      ? creator.bio.slice(0, 160)
      : `Hire ${creator.display_name} for music promotion. ${creator.total_verified_views || 0} verified views delivered.`,
    openGraph: {
      title: `${creator.display_name} — Selah.fm`,
      description: creator.bio ? creator.bio.slice(0, 160) : `Music promotion creator on Selah.fm`,
      url: `https://selah.fm/creators/${id}`,
      type: 'profile',
      images: creator.profile_image_url ? [{ url: creator.profile_image_url }] : [],
    },
    twitter: {
      card: 'summary',
      title: `${creator.display_name} — Selah.fm`,
      description: creator.bio ? creator.bio.slice(0, 160) : `Music promotion creator on Selah.fm`,
    },
  };
}

export default async function Layout(props: Props) {
  const { id } = await props.params;
  const creator = await getCreator(id);

  const jsonLd = creator ? {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: creator.display_name,
    description: creator.bio || `${creator.display_name} on Selah.fm`,
    image: creator.profile_image_url || undefined,
    url: `https://selah.fm/creators/${id}`,
    knowsAbout: creator.genres ? creator.genres.split(',').map((g: string) => g.trim()) : [],
  } : null;

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      {props.children}
    </>
  );
}
