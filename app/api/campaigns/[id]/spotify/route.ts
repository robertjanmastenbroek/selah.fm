import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getArtistSocialProof } from '@/lib/spotify';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const campaigns = await sql`
      SELECT track_url, track_title FROM campaigns WHERE id = ${params.id}
    `;
    if (campaigns.length === 0) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const { track_url } = campaigns[0];
    const data = await getArtistSocialProof(track_url);

    return NextResponse.json({
      monthlyListeners: data.monthlyListeners,
      artistName: data.spotifyArtistName,
    });
  } catch {
    return NextResponse.json({ monthlyListeners: null, artistName: null });
  }
}
