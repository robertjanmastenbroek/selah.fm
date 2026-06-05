import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

function formatCity(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const CITY_FAQS: Record<string, { q: string; a: string }[]> = {};

const DEFAULT_FAQS = [
  { q: 'How does music promotion work in this city?', a: 'Artists set a CPM rate and budget, creators submit videos, and artists pay per verified view. It works the same everywhere on Selah.fm.' },
  { q: 'Can I promote my music locally?', a: 'Yes — many creators specify their location. Browse campaigns and filter by platform to find local collaborators.' },
  { q: 'How much does music promotion cost?', a: 'Artists set their own CPM. You can start as low as $0.10 per 1,000 views.' },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cityName = formatCity(params.slug);
  const title = `Music Promotion in ${cityName} | Hire Local Creators — Selah.fm`;
  const description = `Promote your music in ${cityName}. Find local content creators to make TikToks, Reels, and Shorts for your songs. Pay per verified view.`;

  return {
    title,
    description,
    openGraph: { title, description, url: `https://selah.fm/city/${params.slug}`, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical: `https://selah.fm/city/${params.slug}` },
  };
}

export default async function CityPage({ params }: Props) {
  const cityName = formatCity(params.slug);
  const faqs = CITY_FAQS[params.slug] || DEFAULT_FAQS;

  // Find campaigns from artists in this city
  const campaigns = await sql`
    SELECT c.*, u.display_name as artist_name
    FROM campaigns c
    JOIN users u ON u.id = c.artist_id
    WHERE c.status IN ('active', 'draft')
      AND (u.bio ILIKE ${'%' + cityName + '%'} OR u.instagram_handle IS NOT NULL)
    ORDER BY c.created_at DESC
    LIMIT 12
  `;

  if (!campaigns || campaigns.length === 0) {
    notFound();
  }

  return (
    <div className="min-h-screen" style={{ background: '#0F0F23' }}>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <nav className="mb-6">
          <ol className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40">
            <li><Link href="/" className="hover:text-muted-foreground transition-colors">Selah.fm</Link></li>
            <li className="text-muted-foreground/20">/</li>
            <li><Link href="/browse" className="hover:text-muted-foreground transition-colors">Browse</Link></li>
            <li className="text-muted-foreground/20">/</li>
            <li className="text-muted-foreground/60">{cityName}</li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
            Music Promotion in {cityName}
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Promote your music in {cityName}. Find local content creators to make short-form videos 
            for your songs. Pay per verified view — only real views, real engagement.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {campaigns.map((c: any) => (
            <Link key={c.id} href={`/c/${c.slug || c.id}`} className="h-full flex flex-col rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-[#4338CA]/15 hover:bg-white/[0.04]">
              <div className="p-4">
                <p className="text-[11px] text-muted-foreground mb-1">{c.artist_name || 'Artist'}</p>
                <h3 className="text-sm font-semibold" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>{c.track_title}</h3>
              </div>
            </Link>
          ))}
        </div>

        {/* FAQ Section */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>FAQs about Music Promotion in {cityName}</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
                <h3 className="font-semibold text-sm mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
