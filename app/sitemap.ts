import { MetadataRoute } from 'next';
import { unstable_cache } from 'next/cache';
import sql from '@/lib/db';

// Sitemap rebuilds every 6h; bots hammer this endpoint
export const revalidate = 21600;

const getSitemapData = unstable_cache(
  async () => {
    const [blogs, artists, campaigns] = await Promise.all([
      sql`SELECT slug, updated_at FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC LIMIT 100`,
      sql`SELECT slug, last_refreshed_at AS updated_at FROM artist_profiles WHERE slug IS NOT NULL ORDER BY last_refreshed_at DESC NULLS LAST LIMIT 5000`,
      sql`SELECT slug, updated_at FROM campaigns WHERE status = 'active' ORDER BY updated_at DESC LIMIT 500`,
    ]);
    return { blogs, artists, campaigns };
  },
  ['sitemap-data-v1'],
  { revalidate: 21600, tags: ['sitemap'] }
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://selah.fm';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/browse`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/how-it-works`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/guarantee`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/open-source`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/content-guidelines`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/cookies`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/tos`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/report-bug`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ];

  // Data-driven tools
  const toolPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/tools/cpm-calculator`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/tools/creator-earnings`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/tools/promotion-budget`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/tools/playlist-analyzer`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ];

  // Data-driven sections — fetched via cached helper
  const { blogs, artists, campaigns } = await getSitemapData();

  const blogPages: MetadataRoute.Sitemap = blogs.map((p: any) => ({
    url: `${baseUrl}/blog/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Artist profile pages (SEO gold)
  const artistPages: MetadataRoute.Sitemap = artists.map((a: any) => ({
    url: `${baseUrl}/artist/${a.slug}`,
    lastModified: new Date(a.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Active campaign pages
  const campaignPages: MetadataRoute.Sitemap = campaigns.map((c: any) => ({
    url: `${baseUrl}/c/${c.slug}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  // Q&A pages — separate query, also cheap
  let qaPages: MetadataRoute.Sitemap = [];
  try {
    const qa = await sql`SELECT slug, published_at FROM qa_pages WHERE status = 'published' ORDER BY published_at DESC LIMIT 200`;
    qaPages = qa.map((q: any) => ({
      url: `${baseUrl}/qa/${q.slug}`,
      lastModified: new Date(q.published_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch { /* skip */ }

  return [...staticPages, ...toolPages, ...blogPages, ...artistPages, ...campaignPages, ...qaPages];
}
