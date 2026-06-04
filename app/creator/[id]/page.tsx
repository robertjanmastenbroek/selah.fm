import { Metadata } from 'next';
import CreatorPortfolioClient from './CreatorPortfolioClient';

export const dynamic = 'force-dynamic';

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'Creator Portfolio — Selah.fm',
    description: 'View a creator\'s submitted work and stats on Selah.fm.',
  };
}

export default function CreatorPage({ params }: Props) {
  return <CreatorPortfolioClient id={params.id} />;
}
