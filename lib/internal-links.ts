/**
 * Selah.fm — Internal Linking Engine
 * Generates cross-links between artists, campaigns, blog posts, and tools.
 */

interface LinkTarget {
  url: string;
  anchor: string;
  context: string; // what type of page it links to
}

// Map of known page URLs to their descriptive anchor text
const PAGE_ANCHORS: Record<string, string> = {
  '/': 'Selah.fm homepage',
  '/browse': 'browse independent artists on Selah.fm',
  '/dashboard': 'artist and creator dashboard',
  '/welcome-artists': 'how artists can promote their music on Selah.fm',
  '/welcome-creators': 'how creators earn money making videos on Selah.fm',
  '/earnings': 'creator earnings leaderboard',
  '/checkout': 'support artists and fund campaigns',
  '/messages': 'send and receive messages on Selah.fm',
  '/review': 'review and approve video submissions',
  '/blog': 'music promotion blog and guides',
  '/tools/cpm-calculator': 'CPM rate calculator for music promotion',
  '/tools/creator-earnings': 'creator earnings calculator per view',
  '/tools/promotion-budget': 'music promotion budget calculator',
  '/tools/playlist-analyzer': 'Spotify playlist analyzer tool',
  '/campaigns': 'browse all music promotion campaigns',
  '/faq': 'frequently asked questions about Selah.fm',
};

export function getPageLink(page: string): LinkTarget | null {
  const anchor = PAGE_ANCHORS[page];
  if (!anchor) return null;
  return { url: page, anchor, context: 'page' };
}

/**
 * Generate artist-card cross-links for a specific artist page.
 * Links to: browse, tools, and related content.
 */
export function getArtistLinks(genres?: string[], campaignSlugs?: string[]): LinkTarget[] {
  const links: LinkTarget[] = [
    { url: '/browse', anchor: 'browse more independent artists on Selah.fm', context: 'artist' },
    { url: '/welcome-creators', anchor: 'how creators earn money making videos on Selah.fm', context: 'creator' },
    { url: '/welcome-artists', anchor: 'how artists promote their music on Selah.fm', context: 'artist-guide' },
    { url: '/earnings', anchor: 'view the creator earnings leaderboard', context: 'earnings' },
    { url: '/tools/cpm-calculator', anchor: 'calculate your CPM rate for music promotion', context: 'tool' },
    { url: '/tools/creator-earnings', anchor: 'estimate your creator earnings per million views', context: 'tool' },
    { url: '/tools/promotion-budget', anchor: 'plan your music promotion budget', context: 'tool' },
    { url: '/tools/playlist-analyzer', anchor: 'analyze Spotify playlists for your music', context: 'tool' },
    { url: '/blog', anchor: 'read music promotion tips and guides', context: 'blog' },
    { url: '/faq', anchor: 'frequently asked questions about Selah.fm', context: 'faq' },
  ];

  // Add genre-specific links
  if (genres?.length) {
    for (const genre of genres.slice(0, 2)) {
      links.push({
        url: `/browse/genre/${genre.toLowerCase()}`,
        anchor: `browse and discover ${genre.toLowerCase()} music artists on Selah.fm`,
        context: 'genre',
      });
    }
  }

  // Add related campaign links
  if (campaignSlugs?.length) {
    for (const slug of campaignSlugs.slice(0, 3)) {
      links.push({
        url: `/c/${slug}`,
        anchor: `support this artist by joining their music promotion campaign`,
        context: 'campaign',
      });
    }
  }

  return links;
}

/**
 * Generate track/campaign page links.
 */
export function getCampaignLinks(genres?: string[]): LinkTarget[] {
  const links: LinkTarget[] = [
    { url: '/browse', anchor: 'browse artists and campaigns on Selah.fm', context: 'browse' },
    { url: '/welcome-creators', anchor: 'how creators earn per view on Selah.fm', context: 'creator-guide' },
    { url: '/tools/cpm-calculator', anchor: 'music CPM calculator for creators and artists', context: 'tool' },
    { url: '/blog', anchor: 'music promotion guides and creator tips', context: 'blog' },
    { url: '/earnings', anchor: 'see how much top creators earn on Selah.fm', context: 'earnings' },
  ];

  if (genres?.length) {
    for (const genre of genres.slice(0, 2)) {
      links.push({
        url: `/browse/genre/${genre.toLowerCase()}`,
        anchor: `browse ${genre.toLowerCase()} music campaigns and artists`,
        context: 'genre',
      });
    }
  }

  return links;
}

/**
 * Generate blog post links — related artists, campaigns, tools.
 */
export function getBlogLinks(relatedArtists?: { slug: string; name: string }[]): LinkTarget[] {
  const links: LinkTarget[] = [
    { url: '/browse', anchor: 'discover more music artists and campaigns', context: 'browse' },
    { url: '/welcome-artists', anchor: 'how artists can promote music on Selah.fm', context: 'artist-guide' },
    { url: '/welcome-creators', anchor: 'how creators earn money making short-form videos', context: 'creator-guide' },
  ];

  if (relatedArtists) {
    for (const artist of relatedArtists.slice(0, 3)) {
      links.push({
        url: `/artist/${artist.slug}`,
        anchor: `${artist.name} — full artist profile and tracks`,
        context: 'related-artist',
      });
    }
  }

  return links;
}
