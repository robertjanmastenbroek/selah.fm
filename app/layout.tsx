import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'sendmusic.io — Get your music heard. Only pay for real views.',
  description: 'A CPM marketplace connecting musicians with creators. Upload your track, set a budget, and only pay when verified views happen.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
