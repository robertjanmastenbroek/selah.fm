import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

interface Props { params: { slug: string } }

async function getPost(slug: string) {
  const posts = await sql`
    SELECT * FROM blog_posts WHERE slug = ${slug} AND status = 'published'
  `;
  return posts[0] || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: 'Post not found — Selah.fm Blog' };

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      type: 'article',
      url: `https://selah.fm/blog/${post.slug}`,
      siteName: 'Selah.fm',
      images: post.featured_image ? [{ url: post.featured_image, width: 1200, height: 630 }] : [],
      publishedTime: post.published_at,
      authors: ['Robert-Jan Mastenbroek'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      images: post.featured_image ? [post.featured_image] : [],
    },
    alternates: { canonical: `https://selah.fm/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.2) 0%, #0A0A0A 60%), #0A0A0A' }}>
      {/* JSON-LD Schema */}
      {post.schema_markup && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: typeof post.schema_markup === 'string' ? post.schema_markup : JSON.stringify(post.schema_markup) }}
        />
      )}

      <article className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        {/* Back link */}
        <a href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to blog
        </a>

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {post.published_at && (
              <time dateTime={post.published_at}>
                {new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </time>
            )}
            <span>·</span>
            <span>Robert-Jan Mastenbroek</span>
          </div>
          {(post.tags || []).length > 0 && (
            <div className="flex gap-1.5 mt-4 flex-wrap">
              {(post.tags || []).map((tag: string) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Featured image */}
        {post.featured_image && (
          <div className="rounded-2xl overflow-hidden mb-10">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-auto"
              loading="eager"
            />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-invert prose-lg max-w-none
            prose-headings:text-foreground prose-headings:font-semibold
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground
            prose-li:text-muted-foreground
            prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.content_html }}
        />

        {/* CTA */}
        <div className="mt-16 p-8 rounded-2xl bg-primary/[0.04] border border-primary/10 text-center">
          <h3 className="text-xl font-bold mb-2">Ready to promote your music?</h3>
          <p className="text-muted-foreground mb-6">Join Selah.fm and connect with real creators who will promote your tracks on TikTok, Reels, and Shorts.</p>
          <div className="flex gap-3 justify-center">
            <a href="/welcome-artists" className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
              I&apos;m an artist
            </a>
            <a href="/welcome-creators" className="px-6 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] font-semibold text-sm hover:bg-white/[0.08] transition-colors">
              I&apos;m a creator
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}
