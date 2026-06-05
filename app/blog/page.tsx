import type { Metadata } from 'next';
import Link from 'next/link';
import sql from '@/lib/db';

export const revalidate = 3600; // ISR — revalidate every hour
// Note: removed force-dynamic which was overriding revalidate

export const metadata: Metadata = {
  title: 'Blog — Selah.fm | Music Promotion Tips & Creator Insights',
  description: 'Practical advice for music artists and content creators. Learn about CPM strategies, video monetization, audience growth, and the future of music promotion.',
  openGraph: {
    title: 'Selah.fm Blog — Music Promotion Tips & Creator Insights',
    description: 'Practical advice for music artists and content creators.',
    type: 'website',
    url: 'https://selah.fm/blog',
    siteName: 'Selah.fm',
    images: [{ url: 'https://selah.fm/images/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Selah.fm Blog — Music Promotion Tips & Creator Insights',
    description: 'Practical advice for music artists and content creators.',
    images: ['https://selah.fm/images/og-image.jpg'],
  },
};

async function getPosts() {
  try {
    const posts = await sql`
      SELECT id, title, slug, excerpt, featured_image, meta_description, tags, published_at
      FROM blog_posts
      WHERE status = 'published'
      ORDER BY published_at DESC
      LIMIT 30
    `;
    return posts;
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(67,56,202,0.2) 0%, #0F0F23 60%), #0F0F23' }}>
      <main className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Selah.fm <span className="text-primary">Blog</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Practical advice for music artists and content creators. CPM strategies, video monetization, audience growth, and the future of music promotion.
          </p>
          {posts.length > 0 && (
            <p className="text-[11px] text-muted-foreground/40 mt-3">
              {posts.length} articles · Last updated{' '}
              {new Date(posts[0].published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📝</p>
            <h2 className="text-xl font-semibold mb-2">Coming soon</h2>
            <p className="text-muted-foreground">Our first blog posts are being written. Check back soon.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {posts.map((post: any) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden hover:border-primary/20 transition-all hover:-translate-y-1"
              >
                {post.featured_image && (
                  <div className="aspect-video bg-white/[0.02] overflow-hidden">
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h2 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {post.meta_description || post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5 flex-wrap">
                      {(post.tags || []).slice(0, 3).map((tag: string) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {post.published_at && (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* FAQ Section — keyword-rich, captures "People Also Ask" for blog-related queries */}
        <section className="mt-20 pt-12 border-t border-white/[0.06]">
          <h2 className="text-2xl font-bold mb-8">Frequently asked questions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { q: 'How do independent artists promote music without a label?', a: 'Independent artists promote music by working directly with content creators on platforms like TikTok, Instagram Reels, and YouTube Shorts. On Selah.fm, artists set a CPM budget, creators make videos using their song, and artists only pay for verified views — no label required.' },
              { q: "What's the most cost-effective way to promote a new single?", a: "Creator-driven promotion on short-form video platforms is currently the most cost-effective approach. Instead of paying for ads that people scroll past, you pay creators to make engaging content featuring your music. You set the budget and only pay for verified views — so every dollar goes to actual exposure." },
              { q: 'How much do content creators earn promoting music?', a: "It varies by platform. TikTok's Creator Fund pays $0.02–0.04 per 1,000 views. YouTube Shorts pays $0.01–0.06. On Selah.fm, creators earn whatever CPM the artist sets — typically $5–30 per 1,000 verified views. That's 100x more than platform funds for the same content." },
              { q: 'Is CPM-based promotion better than paying for playlist placements?', a: 'Yes, for most artists. Playlist placements put your song in a list where you hope people listen. Creator promotion puts your song in videos that people watch because the content is entertaining. 80% of new music discovery now happens through short-form video. Creators help you build real fans, not just passive streams.' },
              { q: 'Do I need a big following to earn as a music content creator?', a: 'No. CPM-based promotion pays per view, not per follower. A creator with 2,000 followers who consistently gets 10,000 views per video can earn more than someone with 100,000 followers making low-engagement content. Quality and consistency matter more than follower count.' },
              { q: 'How do I start promoting my music with creators?', a: 'Create a free Selah.fm artist account, set a CPM rate and budget, write a clear campaign brief describing what kind of videos you want, and creators will submit videos for your approval. You only pay when you approve the video and the views are verified.' },
            ].map((faq, i) => (
              <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-5">
                <h3 className="font-semibold text-sm mb-2">{faq.q}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FAQ structured data — Google "People Also Ask" rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              { '@type': 'Question', name: 'How do independent artists promote music without a label?', acceptedAnswer: { '@type': 'Answer', text: 'Independent artists promote music by working directly with content creators on platforms like TikTok, Instagram Reels, and YouTube Shorts. On Selah.fm, artists set a CPM budget, creators make videos using their song, and artists only pay for verified views.' } },
              { '@type': 'Question', name: "What's the most cost-effective way to promote a new single?", acceptedAnswer: { '@type': 'Answer', text: 'Creator-driven promotion on short-form video platforms is currently the most cost-effective approach. Instead of paying for ads, you pay creators to make engaging content featuring your music. You set the budget and only pay for verified views.' } },
              { '@type': 'Question', name: 'How much do content creators earn promoting music?', acceptedAnswer: { '@type': 'Answer', text: "TikTok's Creator Fund pays $0.02–0.04 per 1,000 views. YouTube Shorts pays $0.01–0.06. On Selah.fm, creators earn $5–30 CPM — 100x more than platform funds for the same content." } },
              { '@type': 'Question', name: 'Do I need a big following to earn as a music content creator?', acceptedAnswer: { '@type': 'Answer', text: 'No. CPM-based promotion pays per view, not per follower. A creator with 2,000 followers getting 10,000 views per video can earn more than someone with 100,000 followers making low-engagement content.' } },
              { '@type': 'Question', name: 'How do I start promoting my music with creators?', acceptedAnswer: { '@type': 'Answer', text: 'Create a free Selah.fm artist account, set a CPM rate and budget, write a clear campaign brief, and creators will submit videos for your approval. You only pay when you approve the video and the views are verified.' } },
            ],
          }),
        }}
      />

      {/* Blog listing structured data — helps Google understand site structure */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Selah.fm Blog — Music Promotion Tips & Creator Insights',
            description: 'Practical advice for music artists and content creators. CPM strategies, video monetization, audience growth, and the future of music promotion.',
            url: 'https://selah.fm/blog',
            hasPart: posts.map((post: any) => ({
              '@type': 'BlogPosting',
              headline: post.title,
              url: `https://selah.fm/blog/${post.slug}`,
              description: post.meta_description || post.excerpt,
              datePublished: post.published_at,
            })),
          }),
        }}
      />
    </div>
  );
}
