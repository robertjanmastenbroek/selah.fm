import ArtistsPage from './ArtistsClient';

export const metadata = {
  title: 'Artists — Cross-Platform Stats | Selah.fm',
  description: 'Browse 2,038 independent artists tracked across 27 platforms. Spotify listeners, Instagram followers, TikTok followers, and more. Updated daily.',
};

export const dynamic = 'force-dynamic';

export default function Page() {
  return <ArtistsPage />;
}
