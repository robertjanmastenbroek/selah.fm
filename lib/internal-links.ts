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
  '/browse': 'browse independent artists',
  '/dashboard': 'artist dashboard',
  '/welcome-artists': 'artist promotion platform',
  '/welcome-creators': 'creator earnings marketplace',
  '/checkout': 'support artists',
  '/messages': 'messaging',
  '/review': 'submission review',
  '/tools/cpm-calculator': 'CPM rate calculator',
  '/tools/creator-earnings': 'creator earnings calculator',
  '/tools/promotion-budget': 'music promotion budget calculator',
  '/tools/playlist-analyzer': 'Spotify playlist analyzer',
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
export function getArtistLinks(genres?: string[]): LinkTarget[] {
  const links: LinkTarget[] = [
    { url: '/browse', anchor: 'browse more independent artists', context: 'artist' },
    { url: '/welcome-creators', anchor: 'earn per view as a creator', context: 'creator' },
    { url: '/welcome-artists', anchor: 'learn how artists promote music on Selah.fm', context: 'artist-guide' },
    { url: '/tools/cpm-calculator', anchor: 'calculate your CPM rate', context: 'tool' },
    { url: '/tools/creator-earnings', anchor: 'estimate your creator earnings per view', context: 'tool' },
    { url: '/tools/promotion-budget', anchor: 'plan your music promotion budget', context: 'tool' },
  ];

  // Add genre-specific links
  if (genres?.length) {
    for (const genre of genres.slice(0, 2)) {
      links.push({
        url: `/browse/genre/${genre.toLowerCase()}`,
        anchor: `browse ${genre.toLowerCase()} music artists and campaigns`,
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
