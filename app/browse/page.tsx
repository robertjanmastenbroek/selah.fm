import { Suspense } from 'react';
import BrowseClient from './BrowseClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Browse Campaigns — Selah.fm | Songs Worth Believing In',
    description: 'Browse music promotion campaigns on Selah.fm. Discover tracks with active budgets, or earn as a creator making TikTok videos per verified view.',
    openGraph: {
      title: 'Browse Campaigns — Selah.fm',
      description: 'Browse songs worth believing in. Discover new music, boost artists, or earn per verified TikTok view.',
      url: 'https://selah.fm/browse',
      type: 'website',
      images: [{ url: 'https://selah.fm/images/og-image.jpg', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Browse — Selah.fm',
      description: 'Discover artists and campaigns. Earn per verified view.',
      images: ['https://selah.fm/images/og-image.jpg'],
    },
  };
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen" style={{ background: '#0F0F23' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
          <div className="grid gap-4 sm:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse">
                <div className="h-40 w-full rounded-t-2xl bg-white/[0.03]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-2/3 bg-white/[0.03] rounded" />
                  <div className="h-3 w-1/3 bg-white/[0.03] rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <BrowseClient />
    </Suspense>
  );
}
