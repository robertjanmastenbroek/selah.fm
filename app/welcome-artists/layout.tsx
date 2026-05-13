import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'For Artists — Real Music Promotion | Selah.fm',
  description: 'Ditch bots and wasted ad spend. Launch a campaign to have vetted creators share your music in TikToks, Reels & Shorts. You set the budget and only pay for verified views.',
  openGraph: {
    title: 'For Artists — Real Music Promotion | Selah.fm',
    description: 'Ditch bots and wasted ad spend. Launch a campaign to have vetted creators share your music in TikToks, Reels & Shorts. You set the budget and only pay for verified views.',
    url: 'https://selah.fm/welcome-artists',
    type: 'website',
    images: [{ url: 'https://selah.fm/images/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'For Artists — Real Music Promotion | Selah.fm',
    description: 'Ditch bots and wasted ad spend. Launch a campaign to have vetted creators share your music.',
    images: ['https://selah.fm/images/og-image.jpg'],
  },
};

export default function WelcomeArtistsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
