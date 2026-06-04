import type { Metadata } from 'next';
import sql from '@/lib/db';
import CollectionDetailClient from './CollectionDetailClient';

export const dynamic = 'force-dynamic';

interface Props { params: { id: string } }

async function getCollection(id: string) {
  try {
    const [collection] = await sql`
      SELECT c.*, u.display_name as owner_name
      FROM collections c
      JOIN users u ON u.id = c.user_id
      WHERE c.id = ${id}
      LIMIT 1
    `;
    if (!collection) return null;

    const items = await sql`
      SELECT ci.*, at.title, at.cover_art_url, at.cpm_rate_cents,
             da.artist_name, ap.slug as artist_slug
      FROM collection_items ci
      JOIN artist_tracks at ON at.id = ci.track_id
      JOIN artist_profiles ap ON ap.id = at.artist_id
      JOIN discovered_artists da ON da.id = ap.artist_id
      WHERE ci.collection_id = ${id}
      ORDER BY ci.sort_order ASC, ci.created_at DESC
      LIMIT 50
    `;

    return { ...collection, items };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getCollection(params.id);
  if (!data) return { title: 'Collection not found — Selah.fm' };

  return {
    title: `${data.name} by ${data.owner_name} — Track Collection | Selah.fm`,
    description: data.description || `Track collection by ${data.owner_name} on Selah.fm.`,
  };
}

export default async function CollectionPage({ params }: Props) {
  const data = await getCollection(params.id);
  if (!data) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Collection not found</p></div>;

  return <CollectionDetailClient id={params.id} />;
}
