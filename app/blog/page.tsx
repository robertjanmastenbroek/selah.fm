import type { Metadata } from 'next';
import Link from 'next/link';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export const metadata: Metadata = {
  title: 'Blog — Selah.fm | Music Promotion Tips & Creator Insights',
  description: 'Practical advice for music artists and content creators. Learn about CPM strategies, video monetization, audience growth, and the future of music promotion.',
  openGraph: {
    title: 'Selah.fm Blog — Music Promotion Tips & Creator Insights',
    description: 'Practical advice for music artists and content creators.',
    type: 'website',
    url: 'https://selah.fm/blog',
    siteName: 'Selah.fm',
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
      </main>
    </div>
  );
}
