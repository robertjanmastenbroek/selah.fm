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
    { url: `${baseUrl}/artists`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/creators`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/welcome-artists`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/welcome-creators`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/open-source`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/content-guidelines`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/tos`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/report-bug`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ];

  // Blog posts (highest SEO priority)
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await sql`
      SELECT slug, updated_at FROM blog_posts WHERE status = 'published'
      ORDER BY published_at DESC LIMIT 500
    `;
    blogPages = posts.map((p: any) => ({
      url: `${baseUrl}/blog/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {}

  // Campaign pages
  let campaignPages: MetadataRoute.Sitemap = [];
  try {
    const campaigns = await sql`
      SELECT id, slug, updated_at FROM campaigns WHERE status IN ('active', 'draft')
      ORDER BY updated_at DESC LIMIT 500
    `;
    campaignPages = campaigns.map((c: any) => ({
      url: `${baseUrl}/c/${c.slug || c.id}`,
      lastModified: new Date(c.updated_at),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));
  } catch {}

  // Artist pages
  let artistPages: MetadataRoute.Sitemap = [];
  try {
    const artists = await sql`
      SELECT id, updated_at FROM users WHERE is_artist = true ORDER BY created_at DESC LIMIT 200
    `;
    artistPages = artists.map((a: any) => ({
      url: `${baseUrl}/artists/${a.id}`,
      lastModified: new Date(a.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {}

  // Creator pages
  let creatorPages: MetadataRoute.Sitemap = [];
  try {
    const creators = await sql`
      SELECT id, updated_at FROM users WHERE is_creator = true ORDER BY created_at DESC LIMIT 200
    `;
    creatorPages = creators.map((c: any) => ({
      url: `${baseUrl}/creators/${c.id}`,
      lastModified: new Date(c.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {}

  // Programmatic SEO landing pages (keyword-targeted)
  const toolSlugs = ["music-promotion","promote-music","independent-artist","spotify-promotion","tiktok-promotion","earn-money","cpm-rates","side-hustle","tiktok-marketing","hire-creators","creator-marketplace"];
  const toolPages = toolSlugs.map(slug => ({ url: `${baseUrl}/tools/${slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 }));

  return [...staticPages, ...toolPages, ...blogPages, ...campaignPages, ...artistPages, ...creatorPages];
}
