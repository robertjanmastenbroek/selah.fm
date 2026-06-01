/**
 * Web Research System — reliable scraping, search, and data harvesting.
 * 
 * Uses old.reddit.com RSS feeds (200 OK, no auth required) instead of the broken JSON API.
 * Multiple search engine fallbacks for keyword research.
 * All harvested data persisted to research_data table for future use.
 */
import sql from '@/lib/db';

// ── Types ─────────────────────────────────────────────────────────

export interface RedditPost {
  title: string;
  url: string;
  author: string;
  publishedAt: string;
  isQuestion: boolean;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface KeywordVolume {
  keyword: string;
  estimatedVolume: number;
  cpc: number | null;
  competition: 'low' | 'medium' | 'high';
}

// ── Reddit Scraping via old.reddit.com RSS ────────────────────────

const REDDIT_SUBREDDITS = [
  'musicmarketing', 'wearethemusicmakers', 'musicians',
  'makinghiphop', 'edmproduction', 'songwriting',
  'indieheads', 'musicbusiness', 'musicproduction',
  'audioengineering', 'creators', 'tiktokhelp',
  'instagrammarketing', 'newtubers', 'youtubers',
  'socialmedia', 'contentcreation', 'spotify',
  'soundcloud', 'bandcamp', 'entrepreneur',
  'sidehustle', 'passiveincome', 'christianmusic',
];

function isQuestionTitle(title: string): boolean {
  if (!title || title.length < 20 || title.length > 200) return false;
  if (title.endsWith('?')) return true;
  return /^(how|what|why|where|when|who|can|should|do|does|is|are|has|have|will|would|any|anyone|am i|has anyone|does anyone|which|could)/i.test(title);
}

/** Parse Atom XML from old.reddit.com RSS into structured posts */
function parseRedditRSS(xml: string, subreddit: string): RedditPost[] {
  const posts: RedditPost[] = [];
  
  // Extract <entry> blocks
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  
  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    
    const titleMatch = entry.match(/<title>(.*?)<\/title>/);
    const linkMatch = entry.match(/<link href="([^"]+)"/);
    const authorMatch = entry.match(/<author><name>(.*?)<\/name>/);
    const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
    
    if (titleMatch) {
      const title = titleMatch[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      
      posts.push({
        title,
        url: linkMatch?.[1] || `https://old.reddit.com/r/${subreddit}/`,
        author: authorMatch?.[1]?.replace('/u/', '') || 'unknown',
        publishedAt: publishedMatch?.[1] || '',
        isQuestion: isQuestionTitle(title),
      });
    }
  }
  
  return posts;
}

/** Fetch posts from a subreddit via old.reddit.com RSS */
export async function fetchRedditRSS(subreddit: string): Promise<RedditPost[]> {
  try {
    const res = await fetch(`https://old.reddit.com/r/${subreddit}/.rss`, {
      headers: { 'User-Agent': 'python:selah.fm:v2.0 (by /u/selahfm)' },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRedditRSS(xml, subreddit);
  } catch {
    return [];
  }
}

/** Bulk fetch questions from multiple subreddits — returns deduplicated question titles */
export async function sourceRedditQuestions(subreddits: string[] = REDDIT_SUBREDDITS): Promise<{ question: string; url: string; subreddit: string; category: string }[]> {
  const results: { question: string; url: string; subreddit: string; category: string }[] = [];
  const seen = new Set<string>();
  
  // Shuffle subreddits for variety
  const shuffled = [...subreddits].sort(() => Math.random() - 0.5);
  
  for (const sub of shuffled.slice(0, 8)) {
    try {
      const posts = await fetchRedditRSS(sub);
      for (const post of posts) {
        if (!post.isQuestion) continue;
        const key = post.title.toLowerCase().trim();
        if (seen.has(key)) continue;
        seen.add(key);
        
        results.push({
          question: post.title,
          url: post.url,
          subreddit: sub,
          category: sub.includes('tiktok') || sub.includes('creator') || sub.includes('youtuber') ? 'creator_income'
            : sub.includes('spotify') || sub.includes('soundcloud') ? 'platform_strategy'
            : 'music_promotion',
        });
      }
    } catch {
      // Skip failed subreddits silently
    }
  }
  
  return results;
}

// ── Web Search ────────────────────────────────────────────────────

/** Search DuckDuckGo (no API key needed) — returns structured results */
export async function searchDuckDuckGo(query: string, maxResults = 10): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    
    const data = await res.json();
    const results: SearchResult[] = [];
    
    // Related topics
    for (const topic of (data.RelatedTopics || []).slice(0, maxResults)) {
      if (topic.Text && topic.FirstURL) {
        results.push({
          title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 100),
          url: topic.FirstURL,
          snippet: topic.Text.slice(0, 300),
          source: 'duckduckgo',
        });
      }
    }
    
    return results;
  } catch {
    return [];
  }
}

/** Fallback: use a simple web search via Bing (no API key) — returns raw HTML snippets */
export async function searchBing(query: string, maxResults = 5): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=${maxResults}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) return [];
    
    const html = await res.text();
    const results: SearchResult[] = [];
    
    // Extract search result snippets from Bing HTML
    const snippetRegex = /<li class="b_algo"[^>]*>[\s\S]*?<h2><a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/gi;
    let match;
    
    while ((match = snippetRegex.exec(html)) !== null && results.length < maxResults) {
      results.push({
        title: match[2].replace(/<[^>]*>/g, '').trim(),
        url: match[1],
        snippet: match[3].replace(/<[^>]*>/g, '').trim().slice(0, 300),
        source: 'bing',
      });
    }
    
    return results;
  } catch {
    return [];
  }
}

/** Unified search: tries DuckDuckGo first, falls back to Bing */
export async function searchWeb(query: string, maxResults = 10): Promise<SearchResult[]> {
  const ddg = await searchDuckDuckGo(query, Math.ceil(maxResults / 2));
  if (ddg.length >= 3) return ddg.slice(0, maxResults);
  
  const bing = await searchBing(query, maxResults - ddg.length);
  return [...ddg, ...bing];
}

// ── Keyword Research ──────────────────────────────────────────────

// Known keyword volumes from keyword research tools (Theseolabs, GrindSuccess, Semrush)
// These are periodically updated and serve as our volume baseline
const KNOWN_KEYWORD_VOLUMES: Record<string, { volume: number; cpc: number | null }> = {
  'spotify': { volume: 7480000, cpc: 19.40 },
  'youtube music': { volume: 3350000, cpc: 2.00 },
  'soundcloud': { volume: 1830000, cpc: 1.11 },
  'apple music': { volume: 673000, cpc: 2.00 },
  'guitar': { volume: 368000, cpc: 1.28 },
  'singing': { volume: 301000, cpc: 2.33 },
  'piano': { volume: 301000, cpc: 2.28 },
  'live music': { volume: 165000, cpc: 3.30 },
  'country music': { volume: 165000, cpc: 1.25 },
  'concert': { volume: 135000, cpc: 0.43 },
  'dj': { volume: 110000, cpc: 3.40 },
  'band': { volume: 110000, cpc: 2.56 },
  'hip hop': { volume: 74000, cpc: 3.11 },
  'classical music': { volume: 74000, cpc: 8.30 },
  'edm': { volume: 74000, cpc: 4.18 },
  'music video': { volume: 49500, cpc: 1.87 },
  'concert tickets': { volume: 49500, cpc: 2.84 },
  'royalties': { volume: 33100, cpc: 4.09 },
  'playlist': { volume: 33100, cpc: 2.20 },
  'indie music': { volume: 33100, cpc: 3.04 },
  'music festival': { volume: 27100, cpc: 3.24 },
  'musician': { volume: 27100, cpc: 2.42 },
  'music producer': { volume: 18100, cpc: 8.97 },
  'music production': { volume: 18100, cpc: 8.97 },
  'songwriter': { volume: 18100, cpc: 3.84 },
  'mastering': { volume: 14800, cpc: 7.69 },
  'record label': { volume: 12100, cpc: 2.39 },
  'music streaming': { volume: 9900, cpc: 3.31 },
  'music promotion': { volume: 2900, cpc: 6.77 },
  'music licensing': { volume: 2900, cpc: 7.39 },
  'artist management': { volume: 2400, cpc: 9.35 },
  'music education': { volume: 2400, cpc: 12.70 },
  'music blog': { volume: 1900, cpc: 3.99 },
  'music platform': { volume: 1900, cpc: 4.82 },
  'independent artist': { volume: 1600, cpc: 2.86 },
  'music collaborations': { volume: 480, cpc: 3.10 },
  'emerging artist': { volume: 720, cpc: 4.66 },
  'album release': { volume: 880, cpc: 0 },
  'single release': { volume: 140, cpc: 3.41 },
  'viral tiktok songs': { volume: 1900, cpc: 0 },
  'music tutorial': { volume: 210, cpc: 9.39 },
  'music community': { volume: 260, cpc: 10.17 },
};

/** Estimate keyword search volume based on known data + heuristics */
export function estimateKeywordVolume(keyword: string): KeywordVolume {
  const normalized = keyword.toLowerCase().trim();
  
  // Direct match
  if (KNOWN_KEYWORD_VOLUMES[normalized]) {
    const k = KNOWN_KEYWORD_VOLUMES[normalized];
    return {
      keyword,
      estimatedVolume: k.volume,
      cpc: k.cpc,
      competition: k.volume > 10000 ? 'high' : k.volume > 2000 ? 'medium' : 'low',
    };
  }
  
  // Partial match — check if any known keyword is contained
  for (const [known, data] of Object.entries(KNOWN_KEYWORD_VOLUMES)) {
    if (normalized.includes(known)) {
      // Long-tail: estimate ~10-20% of head term volume
      const estimated = Math.round(data.volume * 0.15);
      return {
        keyword,
        estimatedVolume: Math.max(estimated, 50),
        cpc: data.cpc ? Math.round(data.cpc * 0.8 * 100) / 100 : null,
        competition: estimated > 5000 ? 'medium' : 'low',
      };
    }
  }
  
  // Heuristic: question-based keywords with "how to" typically have decent volume
  if (/^how (to|do|can|much|many)/i.test(normalized)) {
    return { keyword, estimatedVolume: 500, cpc: null, competition: 'low' };
  }
  if (/^what (is|are|'s)/i.test(normalized)) {
    return { keyword, estimatedVolume: 800, cpc: null, competition: 'low' };
  }
  
  return { keyword, estimatedVolume: 100, cpc: null, competition: 'low' };
}

// ── DB Persistence ────────────────────────────────────────────────

/** Store harvested research data for future use */
export async function storeResearchData(data: {
  source: string;
  type: string;
  content: any;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    await sql`
      INSERT INTO research_data (source, type, content, metadata, created_at)
      VALUES (${data.source}, ${data.type}, ${JSON.stringify(data.content)}, ${JSON.stringify(data.metadata || {})}, NOW())
    `;
  } catch {
    // Silently fail — research storage is best-effort
  }
}

/** Query previously harvested research data */
export async function queryResearchData(type?: string, source?: string, limit = 50) {
  try {
    if (type && source) {
      return await sql`SELECT * FROM research_data WHERE type = ${type} AND source = ${source} ORDER BY created_at DESC LIMIT ${limit}`;
    }
    if (type) {
      return await sql`SELECT * FROM research_data WHERE type = ${type} ORDER BY created_at DESC LIMIT ${limit}`;
    }
    return await sql`SELECT * FROM research_data ORDER BY created_at DESC LIMIT ${limit}`;
  } catch {
    return [];
  }
}

/** Store trending Reddit questions in batch_questions + research_data */
export async function harvestAndStoreRedditQuestions(): Promise<number> {
  const questions = await sourceRedditQuestions();
  if (questions.length === 0) return 0;
  
  // Store in research_data for analysis
  await storeResearchData({
    source: 'reddit',
    type: 'trending_questions',
    content: questions.slice(0, 30),
    metadata: { fetched_at: new Date().toISOString(), count: questions.length },
  });
  
  // Also store as batch_questions for the blog pipeline (reuse AI-sourced batch or create new)
  // We skip direct batch_questions insert here — the pipeline handles sourcing
  return questions.length;
}

/** Get trending topics from stored research data */
export async function getTrendingTopics(): Promise<{ topic: string; count: number; source: string }[]> {
  try {
    const data = await sql`
      SELECT content, source FROM research_data
      WHERE type = 'trending_questions'
      ORDER BY created_at DESC LIMIT 5
    `;
    
    // Extract topic frequency from stored questions
    const topicCount: Record<string, { count: number; source: string }> = {};
    
    for (const row of data) {
      const questions = typeof row.content === 'string' ? JSON.parse(row.content) : (row.content || []);
      for (const q of questions) {
        const question = typeof q === 'string' ? q : q.question || '';
        const words = question.toLowerCase().split(/\s+/);
        for (const word of words) {
          if (word.length > 4 && !['about', 'there', 'their', 'which', 'would', 'could', 'should', 'because', 'really', 'actually'].includes(word)) {
            if (!topicCount[word]) topicCount[word] = { count: 0, source: row.source };
            topicCount[word].count++;
          }
        }
      }
    }
    
    return Object.entries(topicCount)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([topic, data]) => ({ topic, count: data.count, source: data.source }));
  } catch {
    return [];
  }
}
