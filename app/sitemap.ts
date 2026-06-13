import { MetadataRoute } from 'next';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

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

  // Blog posts
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await sql`
      SELECT slug, updated_at FROM blog_posts WHERE status = 'published'
      ORDER BY published_at DESC LIMIT 100
    `;
    blogPages = posts.map((p: any) => ({
      url: `${baseUrl}/blog/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch { /* skip */ }

  // Q&A pages (AI-optimized short answers)
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

  // Active campaign pages
  let campaignPages: MetadataRoute.Sitemap = [];
  try {
    const campaigns = await sql`
      SELECT c.slug, c.track_title, c.updated_at
      FROM campaigns c
      WHERE c.status = 'active' AND c.track_title IS NOT NULL
      ORDER BY c.updated_at DESC LIMIT 100
    `;
    campaignPages = campaigns.map((c: any) => ({
      url: `${baseUrl}/c/${c.slug || c.id}`,
      lastModified: new Date(c.updated_at),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));
  } catch { /* skip */ }

  return [...staticPages, ...toolPages, ...blogPages, ...qaPages, ...campaignPages];
}
