import { Metadata } from 'next';
import Link from 'next/link';
import QABrowseClient from './QABrowseClient';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Q&A — Music Promotion Questions Answered | Selah.fm',
  description: 'Expert answers to music promotion questions. Discover how to promote your music on TikTok, earn as a creator, set CPM rates, and more.',
  openGraph: {
    title: 'Selah.fm Q&A — Music Promotion Answers',
    description: 'Expert answers to music promotion questions. Free, no signup required.',
    url: 'https://selah.fm/qa',
  },
};

export default async function QAPage() {
  const [categories, qaPages] = await Promise.all([
    sql`SELECT category, COUNT(*)::int as count FROM qa_pages WHERE status = 'published' AND category IS NOT NULL GROUP BY category ORDER BY count DESC`,
    sql`
      SELECT slug, question, answer_text, category, published_at, primary_keyword
      FROM qa_pages
      WHERE status = 'published'
      ORDER BY published_at DESC
      LIMIT 500
    `,
  ]);

  const totalCount = qaPages.length;

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(67,56,202,0.2) 0%, #0F0F23 60%), #0F0F23' }}>
      {/* Simple top nav */}
      <div className="border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/images/Selah Logo transparant no text.png" alt="Selah" className="h-8 w-auto" />
            <span className="text-sm font-semibold text-white/80 hidden sm:inline">Selah.fm</span>
          </Link>
          <nav className="flex items-center gap-5 text-[13px]">
            <Link href="/browse" className="text-white/40 hover:text-white/70 transition-colors">Browse</Link>
            <Link href="/faq" className="text-white/40 hover:text-white/70 transition-colors">FAQ</Link>
            <Link href="/login" className="text-white/40 hover:text-white/70 transition-colors">Sign in</Link>
          </nav>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Music promotion <span className="bg-gradient-to-r from-[#4338CA] via-[#818CF8] to-[#22C55E] bg-clip-text text-transparent">Q&A</span>
          </h1>
          <p className="text-white/40 text-sm max-w-lg">
            {totalCount} answers to help you promote your music, earn as a creator, and navigate the music industry.
          </p>
        </div>

        {(categories.length > 0 || qaPages.length > 0) ? (
          <QABrowseClient
            initialCategories={categories.map((c: any) => ({ name: c.category, count: c.count }))}
            initialPages={qaPages.map((p: any) => ({
              slug: p.slug,
              question: p.question,
              preview: (p.answer_text || '').replace(/<[^>]*>/g, '').slice(0, 160),
              category: p.category || 'uncategorized',
              keyword: p.primary_keyword || '',
              date: p.published_at ? new Date(p.published_at).toISOString().slice(0, 10) : '',
            }))}
          />
        ) : (
          <div className="text-center py-20">
            <p className="text-white/30 text-sm">No Q&A pages yet. Check back soon.</p>
          </div>
        )}

        {/* Structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: 'Music Promotion Q&A',
              description: 'Expert answers to music promotion questions.',
              url: 'https://selah.fm/qa',
            }),
          }}
        />
      </main>
    </div>
  );
}
