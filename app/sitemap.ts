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

  // Data-driven tools
  const toolPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/tools/cpm-calculator`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${baseUrl}/tools/creator-earnings`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${baseUrl}/tools/promotion-budget`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/tools/playlist-analyzer`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
  ];

  // Blog posts
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
      ORDER BY updated_at DESC LIMIT 3000
    `;
    campaignPages = campaigns.map((c: any) => ({
      url: `${baseUrl}/c/${c.slug || c.id}`,
      lastModified: new Date(c.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));
  } catch {}

  // Artist profile pages (from discovered_artists — all 2,158 artists)
  let artistPages: MetadataRoute.Sitemap = [];
  try {
    const artists = await sql`
      SELECT ap.slug FROM artist_profiles ap
      JOIN discovered_artists da ON da.id = ap.artist_id
      ORDER BY da.monthly_listeners DESC NULLS LAST
      LIMIT 2000
    `;
    artistPages = artists.map((a: any) => ({
      url: `${baseUrl}/artist/${a.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {}

  // Genre landing pages
  const GENRES = ['electronic', 'hip-hop', 'pop', 'rock', 'indie', 'r&b', 'jazz', 'metal',
                   'folk', 'country', 'ambient', 'punk', 'alternative', 'experimental', 'latin'];
  const genrePages: MetadataRoute.Sitemap = GENRES.map(g => ({
    url: `${baseUrl}/browse/genre/${g}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...toolPages,
    ...genrePages,
    ...blogPages,
    ...artistPages,
    ...campaignPages,
  ];
}
