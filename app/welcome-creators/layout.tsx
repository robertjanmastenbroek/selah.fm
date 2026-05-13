import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'For Creators — Get Paid for Your Content | Selah.fm',
  description: 'Turn your creativity into cash. Use TikTok, Instagram & YouTube Shorts to promote music you love, and earn based on real views. No upfront costs, fast payouts.',
  openGraph: {
    title: 'For Creators — Get Paid for Your Content | Selah.fm',
    description: 'Turn your creativity into cash. Use TikTok, Instagram & YouTube Shorts to promote music you love, and earn based on real views.',
    url: 'https://selah.fm/welcome-creators',
    type: 'website',
    images: [{ url: 'https://selah.fm/images/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'For Creators — Get Paid for Your Content | Selah.fm',
    description: 'Turn your creativity into cash. Use TikTok, Instagram & YouTube Shorts to promote music you love.',
    images: ['https://selah.fm/images/og-image.jpg'],
  },
};

export default function WelcomeCreatorsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
