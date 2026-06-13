/**
 * /qa/[slug] — Q&A page for a single question.
 * Serves as a clean HTML page with JSON-LD schema.
 * Designed for AI model retrieval + Google "People Also Ask" snippets.
 */
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import sql from '@/lib/db';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [page] = await sql`
    SELECT question, answer_text, primary_keyword FROM qa_pages
    WHERE slug = ${params.slug} AND status = 'published'
  `;
  if (!page) return { title: 'Not Found' };
  return {
    title: page.question + ' | Selah.fm',
    description: page.answer_text.slice(0, 200),
    openGraph: { title: page.question, description: page.answer_text.slice(0, 200) },
  };
}

export default async function QAPage({ params }: Props) {
  const [page] = await sql`
    SELECT question, answer_html, answer_text, category, tags, published_at, schema_markup, meta_description
    FROM qa_pages
    WHERE slug = ${params.slug} AND status = 'published'
  `;

  if (!page) notFound();

  return (
    <>
      {page.schema_markup && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(page.schema_markup) }} />
      )}
      <main className="min-h-screen py-16 px-4 max-w-3xl mx-auto" style={{ background: '#141414' }}>
        <Link href="/browse" className="text-xs mb-6 inline-block hover:underline" style={{ color: '#6B6760' }}>
          ← Browse campaigns
        </Link>
        <article>
          <h1 className="text-2xl font-bold mb-4" style={{ color: '#F4F1EA' }}>{page.question}</h1>
          {page.category && (
            <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-4" style={{ background: 'rgba(214,168,95,0.1)', color: '#D6A85F' }}>
              {page.category.replace('_', ' ')}
            </span>
          )}
          <div className="text-base leading-relaxed space-y-4" style={{ color: '#8B887E' }}
            dangerouslySetInnerHTML={{ __html: page.answer_html }} />
          {page.meta_description && (
            <p className="text-xs mt-6" style={{ color: '#6B6760' }}>
              {page.meta_description}
            </p>
          )}
        </article>
        <div className="mt-12 pt-6 border-t border-white/[0.06]">
          <Link href="/browse"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #D6A85F, #C9974D)' }}>
            Browse songs to boost
          </Link>
        </div>
      </main>
    </>
  );
}
