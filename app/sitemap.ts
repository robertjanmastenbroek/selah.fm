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
  } catch (e: any) { console.error('Unhandled error in sitemap.ts:', e); }

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
  } catch (e: any) { console.error('Unhandled error in sitemap.ts:', e); }

  // Artist profile pages (artists with at least one track)
  let artistPages: MetadataRoute.Sitemap = [];
  try {
    const artists = await sql`
      SELECT ap.slug, MAX(GREATEST(at.updated_at, da.updated_at)) as lastmod,
             MAX(da.monthly_listeners) as max_listeners,
             COUNT(at.id) as track_count,
             COUNT(DISTINCT cc.campaign_id) as campaign_count
      FROM artist_profiles ap
      JOIN discovered_artists da ON da.id = ap.artist_id
      LEFT JOIN artist_tracks at ON at.artist_id = da.id AND at.enabled = true
      LEFT JOIN campaign_claims cc ON cc.discovered_artist_id = da.id
      WHERE EXISTS (SELECT 1 FROM artist_tracks at2 WHERE at2.artist_id = da.id AND at2.enabled = true)
      GROUP BY ap.slug
      ORDER BY MAX(da.monthly_listeners) DESC NULLS LAST
      LIMIT 2000
    `;
    artistPages = artists.map((a: any) => {
      // Dynamic priority: artists with more data get higher priority
      const hasCampaigns = (a.campaign_count || 0) > 0;
      const hasListeners = (a.max_listeners || 0) > 0;
      const hasTracks = (a.track_count || 0) > 0;
      const score = (hasListeners ? 0.15 : 0) + (hasCampaigns ? 0.1 : 0) + (hasTracks ? 0.05 : 0);
      const priority = Math.min(1.0, 0.7 + score);
      return {
        url: `${baseUrl}/artist/${a.slug}`,
        lastModified: a.lastmod || new Date(),
        changeFrequency: hasCampaigns ? ('daily' as const) : ('weekly' as const),
        priority: parseFloat(priority.toFixed(2)),
      };
    });
  } catch (e: any) { console.error('Unhandled error in sitemap.ts:', e); }

  // Track pages (per-track SEO pages)
  let trackPages: MetadataRoute.Sitemap = [];
  try {
    const tracks = await sql`
      SELECT at.id, ap.slug, at.updated_at
      FROM artist_tracks at
      JOIN discovered_artists da ON da.id = at.artist_id
      JOIN artist_profiles ap ON ap.artist_id = da.id
      WHERE at.enabled = true
      ORDER BY at.created_at DESC
      LIMIT 1000
    `;
    trackPages = tracks.map((t: any) => ({
      url: `${baseUrl}/artist/${t.slug}/tracks/${t.id}`,
      lastModified: new Date(t.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch (e: any) { console.error('Track sitemap error:', e); }

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
    ...trackPages,
    ...campaignPages,
  ];
}
