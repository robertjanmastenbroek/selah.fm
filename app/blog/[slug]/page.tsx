import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import sql from '@/lib/db';

// ISR with 1h freshness — published blog content barely changes
export const revalidate = 3600;

interface Props { params: { slug: string } }

const getPostCached = unstable_cache(
  async (slug: string) => {
    const posts = await sql`
      SELECT * FROM blog_posts WHERE slug = ${slug} AND status = 'published'
    `;
    return posts[0] || null;
  },
  ['blog-post-v1'],
  { revalidate: 3600, tags: ['blog'] }
);

/** Build enhanced JSON-LD with Person schema + correct author override */
function buildEnhancedSchema(schemaMarkup: unknown, authorName: string, authorUrl: string): object | null {
  if (!schemaMarkup) return null;
  const base = typeof schemaMarkup === 'string' ? JSON.parse(schemaMarkup) : schemaMarkup;
  if (!base['@graph']) return base;
  // Override author in Article schema with the stored author_name
  base['@graph'] = base['@graph'].map((item: any) => {
    if (item['@type'] === 'Article') {
      return { ...item, author: { '@type': 'Person', name: authorName, url: authorUrl } };
    }
    return item;
  });
  return base;
}

async function getRelatedPosts(currentSlug: string, tags: string[]) {
  if (!tags.length) return [];
  const related = await sql`
    SELECT title, slug, excerpt, featured_image, published_at
    FROM blog_posts
    WHERE slug != ${currentSlug} AND status = 'published' AND tags && ${tags}
    ORDER BY published_at DESC LIMIT 3
  `;
  return related;
}

function absoluteUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return `https://selah.fm${path}`;
  return `https://selah.fm/${path}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostCached(params.slug);
  if (!post) return { title: 'Post not found — Selah.fm Blog' };

  const ogImage = absoluteUrl(post.featured_image);

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      type: 'article',
      url: `https://selah.fm/blog/${post.slug}`,
      siteName: 'Selah.fm',
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : [],
      publishedTime: post.published_at,
      authors: [post.author_name || 'Selah.fm Music Team'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      images: ogImage ? [ogImage] : [],
    },
    alternates: { canonical: `https://selah.fm/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPostCached(params.slug);
  if (!post) notFound();

  const relatedPosts = post.tags ? await getRelatedPosts(params.slug, post.tags) : [];
  const readingTime = post.content_html
    ? Math.max(1, Math.round(post.content_html.replace(/<[^>]*>/g, '').split(/\s+/).length / 200))
    : 5;

  const authorName = post.author_name || 'Selah.fm Music Team';
  const authorUrl = post.author_url || 'https://selah.fm/about';
  const enhancedSchema = buildEnhancedSchema(post.schema_markup, authorName, authorUrl);

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(67,56,202,0.2) 0%, #0F0F23 60%), #0F0F23' }}>
      {/* JSON-LD Schema (Article + QAPage + Person — enhanced at render time) */}
      {enhancedSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(enhancedSchema) }}
        />
      )}
      {/* Person schema — standalone fallback if schema_markup has no @graph */}
      {!enhancedSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Person', name: authorName, url: authorUrl }) }}
        />
      )}
      {/* FAQ Schema (separate — Google prefers it standalone) */}
      {post.faq_schema && (() => {
        try {
          const faq = typeof post.faq_schema === 'string' ? JSON.parse(post.faq_schema) : post.faq_schema;
          if (Array.isArray(faq) && faq.length > 0) {
            const faqLD = {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faq.map((item: any) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: { '@type': 'Answer', text: item.answer },
              })),
            };
            return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLD) }} />;
          }
        } catch (e: any) { console.error('Unhandled error in blog/[slug]/page.tsx:', e); }
        return null;
      })()}

      <article className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <a href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to blog
        </a>

        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {/* Author byline with icon */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <span className="font-medium text-foreground/70">{authorName}</span>
            </div>
            <span className="text-muted-foreground/30">·</span>
            {post.published_at && (
              <time dateTime={post.published_at}>
                {new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </time>
            )}
            <span className="text-muted-foreground/30">·</span>
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/50">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {readingTime} min read
            </span>
          </div>
          {/* Author bio micro-link — subtle, SEO-friendly */}
          {authorUrl && (
            <div className="mt-1 text-xs text-muted-foreground/50">
              by <a href={authorUrl} className="hover:text-primary transition-colors" rel="author">{authorName}</a>
            </div>
          )}
          {(post.tags || []).length > 0 && (
            <div className="flex gap-1.5 mt-4 flex-wrap">
              {(post.tags || []).map((tag: string) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{tag}</span>
              ))}
            </div>
          )}
        </header>

        {post.featured_image && (
          <div className="rounded-2xl overflow-hidden mb-10 ring-1 ring-white/[0.06]">
            <img src={post.featured_image?.startsWith("/") ? "https://selah.fm" + post.featured_image : post.featured_image} alt={post.title} className="w-full h-auto object-cover" loading="eager" />
          </div>
        )}

        {/* Blog typography styles — these work regardless of Tailwind prose plugin */}
        <style dangerouslySetInnerHTML={{ __html: `
          .blog-content h2 { font-size: 1.5rem; font-weight: 700; color: #f0f0f0; margin-top: 3rem; margin-bottom: 0.75rem; line-height: 1.3; letter-spacing: -0.01em; }
          .blog-content h3 { font-size: 1.15rem; font-weight: 600; color: #e8e8e8; margin-top: 2rem; margin-bottom: 0.5rem; line-height: 1.4; }
          .blog-content p { color: #b0b0b0; line-height: 1.85; margin-top: 1rem; margin-bottom: 1rem; font-size: 1.05rem; }
          .blog-content p:first-child { font-size: 1.15rem; color: #c8c8c8; }
          .blog-content a { color: #4338CA; text-decoration: none; border-bottom: 1px solid rgba(67,56,202,0.3); }
          .blog-content a:hover { border-bottom-color: #4338CA; }
          .blog-content strong { color: #e0e0e0; font-weight: 600; }
          .blog-content em { color: #c0c0c0; font-style: italic; }
          .blog-content ul, .blog-content ol { padding-left: 1.5rem; margin: 1.25rem 0; }
          .blog-content li { color: #b0b0b0; margin: 0.4rem 0; line-height: 1.75; padding-left: 0.25rem; }
          .blog-content img { border-radius: 0.75rem; margin: 2rem 0; max-width: 100%; }
          .blog-content blockquote { border-left: 3px solid rgba(67,56,202,0.4); padding: 0.5rem 0 0.5rem 1.5rem; margin: 1.5rem 0; color: #999; font-style: italic; }
          .blog-content hr { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 2.5rem 0; }
          .direct-answer { border-left: 3px solid #22C55E; background: rgba(34,197,94,0.06); padding: 1rem 1.25rem; margin: 0 0 2rem 0; border-radius: 0 0.75rem 0.75rem 0; color: #d0d0d0; font-style: normal; }
          .direct-answer p { color: #d0d0d0 !important; font-size: 1rem !important; line-height: 1.7 !important; margin: 0 !important; }
          .direct-answer strong { color: #22C55E; }
        `}} />

        <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.content_html }} />

        <div className="mt-16 p-8 rounded-2xl bg-primary/[0.04] border border-primary/10 text-center">
          <h3 className="text-xl font-bold mb-2">Ready to promote your music?</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Join Selah.fm and connect with real creators who will promote your tracks on TikTok, Reels, and Shorts — you only pay for verified views.</p>
          <div className="flex gap-3 justify-center">
            <a href="/welcome-artists" className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">I&apos;m an artist</a>
            <a href="/welcome-creators" className="px-6 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] font-semibold text-sm hover:bg-white/[0.08] transition-colors">I&apos;m a creator</a>
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-white/[0.06]">
            <h2 className="text-xl font-bold mb-6">Related articles</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedPosts.map((rp: any) => (
                <a key={rp.slug} href={`/blog/${rp.slug}`} className="group block rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden hover:bg-white/[0.04] transition-colors">
                  {rp.featured_image && <img src={rp.featured_image?.startsWith("/") ? "https://selah.fm" + rp.featured_image : rp.featured_image} alt={rp.title} className="w-full h-32 object-cover" loading="lazy" />}
                  <div className="p-4">
                    <h3 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-2">{rp.title}</h3>
                    {rp.published_at && <p className="text-[10px] text-muted-foreground mt-1">{new Date(rp.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}