/**
 * DeepSeek API integration for the Selah.fm blog system.
 * Handles: question generation, article writing, and voice matching.
 *
 * Requires DEEPSEEK_API_KEY in environment.
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE = 'https://api.deepseek.com/v1';

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function chat(messages: DeepSeekMessage[], options: { temperature?: number; max_tokens?: number } = {}) {
  if (!DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY not configured');

  const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// ── Question Generation ──────────────────────────────────────────

const QUESTION_GEN_PROMPT = `You are an expert interviewer for Selah.fm, a CPM marketplace for music promotion. 
Given a user's question about music promotion, content creation, or earning money from short-form video, generate 4-6 insightful interview questions that dig deeper into the topic.

Rules:
- Questions should feel conversational, like a podcast interview
- Mix practical ("How do you...") with philosophical ("Why do you think...")
- Keep questions under 100 characters each
- Return ONLY a JSON array of strings: ["Question 1?", "Question 2?", ...]

User question:`;

export async function generateInterviewQuestions(rawQuestion: string): Promise<string[]> {
  const response = await chat([
    { role: 'system', content: QUESTION_GEN_PROMPT },
    { role: 'user', content: rawQuestion },
  ], { temperature: 0.8, max_tokens: 500 });

  try {
    const parsed = JSON.parse(response);
    if (Array.isArray(parsed)) return parsed.slice(0, 6);
    // Sometimes it wraps in an object
    if (parsed.questions) return parsed.questions.slice(0, 6);
    return [response]; // fallback
  } catch {
    // Extract questions from text
    return response.split('\n').filter((l: string) => l.match(/^\d+\.\s*"/) || l.startsWith('"')).map((l: string) => l.replace(/^\d+\.\s*/, '').replace(/"/g, '').trim()).filter(Boolean).slice(0, 6);
  }
}

// ── Article Generation ───────────────────────────────────────────

const FOUNDER_BACKSTORY = `
Robert-Jan Mastenbroek is the founder of Selah.fm. His story:
- Was a professional musician who got a record deal at a young age but walked away after reading the contract — realized major labels take 98% of revenue and artists become "slaves to the system"
- Built the biggest personal crowdfunding platform in Holland/Belgium (Dream or Donate, €6M+ donated)
- Became a multi-millionaire by 27 through mindset coaching ($25K/weekend), Bitcoin mining, real estate, and email marketing
- Lost everything when the platform was hacked and he was publicly cancelled by national media — sold everything he owned to pay everyone back
- Started over from nothing, living in a campervan, busking on the streets of Tenerife with a guitar
- Found faith, quit smoking after 15 years, and now makes electronic worship music ("holy raves")
- Believes artists should own their promotion, not be dependent on labels or black-box ad platforms
- Lives by donations, doesn't own a house or car, but says "He always provides"
- Speaks with the wisdom of someone who's been at the top, lost it all, and found what really matters

TONE: Warm, wise, a little rough around the edges. Like a friend who's been through hell and came out the other side with clarity. Mixes spiritual depth (faith, purpose) with hard-earned practical advice (business, marketing). Never preachy — just real.`;

const ARTICLE_PROMPT = `You are Robert-Jan Mastenbroek, founder of Selah.fm, a CPM marketplace for music promotion. Write an authentic, practical blog post based on an interview transcript.

YOUR BACKSTORY (use naturally, don't force it):
${FOUNDER_BACKSTORY}

VOICE GUIDELINES:
- Warm, direct, and encouraging tone — like a friend who's been through it giving advice
- Mix spiritual depth with practical business sense (you're a worship musician AND a former multi-millionaire entrepreneur)
- Use personal anecdotes naturally ("When I had my record deal..." or "After losing everything...")
- Avoid corporate jargon — you're a barefoot guy on a beach, not a Silicon Valley CEO
- Include concrete examples and actionable steps from your own experience

STRUCTURE:
1. Click-worthy title (under 70 chars) — include the primary keyword naturally
2. Compelling opening hook (2-3 sentences that grab attention and include primary keyword)
3. Body with practical advice, stories, and steps — use H2 for main sections, H3 for sub-sections
4. Naturally mention Selah.fm 1-2 times where relevant (not forced)
5. Include 2-3 internal link suggestions to other relevant blog posts or selah.fm pages (e.g., /browse, /welcome-artists)
6. Conclusion with a call to action

SEO REQUIREMENTS:
- Primary keyword MUST appear in: title, first paragraph, one H2, and meta description
- Use short paragraphs (2-4 sentences max)
- Include bullet points or numbered lists where appropriate
- Readability: aim for 8th grade reading level — simple, direct language
- Meta description must be under 160 chars and compel clicks

FORMAT:
Return ONLY a JSON object with these fields:
{
  "title": "SEO-optimized title under 70 chars with primary keyword",
  "meta_description": "Compelling meta description under 160 chars with keyword",
  "slug": "url-friendly-slug-with-keyword",
  "content_html": "<h2>Section</h2><p>Full HTML content with proper heading hierarchy, internal links as <a href='/page'>anchor</a>...</p>",
  "excerpt": "2-3 sentence excerpt for previews with keyword",
  "tags": ["primary-keyword", "secondary-keyword", "category"],
  "primary_keyword": "the main keyword this post targets",
  "internal_links": [{"url": "/page", "anchor": "descriptive anchor text"}],
  "image_suggestions": [
    {"type": "featured", "description": "Description of ideal featured image"}
  ]
}`;

export async function generateArticle(
  interviewTranscript: string,
  voiceExamples: string[] = [],
  founderName: string = 'Robert-Jan Mastenbroek'
): Promise<{
  title: string;
  meta_description: string;
  slug: string;
  content_html: string;
  excerpt: string;
  tags: string[];
  image_suggestions: { type: string; description: string }[];
}> {
  const voiceContext = voiceExamples.length > 0
    ? `\n\nVOICE EXAMPLES (write in this style):\n${voiceExamples.map((ex, i) => `Example ${i + 1}:\n${ex}`).join('\n\n')}`
    : '';

  const prompt = `${ARTICLE_PROMPT}\n\nFOUNDER: ${founderName}${voiceContext}\n\nINTERVIEW TRANSCRIPT:\n${interviewTranscript}`;

  const response = await chat([
    { role: 'system', content: prompt },
    { role: 'user', content: 'Write the blog post based on this interview.' },
  ], { temperature: 0.7, max_tokens: 3000 });

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('No JSON found in response');
  } catch {
    // Fallback: extract what we can
    return {
      title: interviewTranscript.split('\n')[0]?.slice(0, 70) || 'New Blog Post',
      meta_description: interviewTranscript.slice(0, 160),
      slug: 'post-' + Date.now(),
      content_html: `<p>${response.replace(/\n/g, '</p><p>')}</p>`,
      excerpt: response.slice(0, 200),
      tags: ['music-promotion', 'content-creation'],
      image_suggestions: [{ type: 'featured', description: 'Music promotion marketplace dashboard' }],
    };
  }
}

// ── Voice Matching ───────────────────────────────────────────────

export async function findVoiceExamples(
  newTranscript: string,
  existingChunks: { chunk_text: string; embedding: number[] | null }[],
  count: number = 3
): Promise<string[]> {
  if (existingChunks.length === 0) return [];

  // Simple keyword overlap scoring (no embedding model needed)
  const newWords = new Set(newTranscript.toLowerCase().split(/\s+/));
  
  const scored = existingChunks.map(chunk => {
    const chunkWords = chunk.chunk_text.toLowerCase().split(/\s+/);
    const overlap = chunkWords.filter(w => newWords.has(w)).length;
    return { text: chunk.chunk_text, score: overlap / Math.max(chunkWords.length, 1) };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map(s => s.text);
}

// ── Batch Question Sourcing ──────────────────────────────────────

// ── SEO-optimized fallback questions targeting high-value keywords ──
// Organized by content pillar with primary keyword targets

const FALLBACK_QUESTIONS = [
  // PILLAR 1: Music Promotion for Independent Artists
  // Keywords: "promote music without label", "independent artist promotion", "music marketing"
  "How can independent artists promote their music without a record label in 2025?",
  "What's the most cost-effective way to market a new single on a $500 budget?",
  "How do I get my music heard by real people (not bots) on social media?",
  "What music promotion strategies actually work for unknown artists starting from zero?",
  "How do I find content creators who will make TikToks using my song?",
  
  // PILLAR 2: Creator Earnings & Monetization
  // Keywords: "get paid for TikTok views", "creator CPM rates", "earn making short videos"
  "How much money can you realistically make creating short-form videos for musicians?",
  "What CPM rates do content creators actually earn promoting music in 2025?",
  "How many views do you need on TikTok to start earning real money?",
  "Can you make a living as a short-form video creator without millions of followers?",
  "What's the difference between brand deals and CPM-based creator earnings?",
  
  // PILLAR 3: Platform Strategy
  // Keywords: "TikTok vs Reels for music", "YouTube Shorts monetization"
  "Is TikTok, Instagram Reels, or YouTube Shorts best for music promotion?",
  "How do the algorithms differ for music content on TikTok vs Instagram?",
  "Should independent artists focus on one platform or be everywhere at once?",
  "Do YouTube Shorts pay creators better than TikTok for music content?",
  "What's the best time to post music content for maximum views?",
  
  // PILLAR 4: CPM & Campaign Mechanics
  // Keywords: "CPM music promotion", "cost per view music", "pay per view marketing"
  "How does CPM-based music promotion work compared to traditional advertising?",
  "What's a good CPM rate to offer creators for promoting your music?",
  "How do you calculate the ROI of a CPM-based music promotion campaign?",
  "Is pay-per-view music promotion better than paying for playlist placement?",
  "How do you set a campaign budget that protects you from overspending?",
  
  // PILLAR 5: Creator Marketplace Model
  // Keywords: "UGC music promotion", "creator marketplace for artists", "hire creators"
  "How does a creator marketplace for music promotion actually work?",
  "What should artists look for when hiring content creators to promote music?",
  "How do you write campaign requirements that attract high-quality creators?",
  "What's the difference between UGC promotion and influencer marketing?",
  "How do you verify that video views are real and not bought?",
  
  // PILLAR 6: Faith, Purpose & Independent Music Business
  // Keywords: "faith music business", "christian electronic music", "purpose driven music"
  "How do you balance making money with making meaningful music?",
  "What does it look like to build a music career around faith and purpose?",
  "Can independent Christian/electronic artists find real audiences online?",
  "How do you stay true to your message while growing a music business?",
  "What's the future for independent artists who want creative freedom?",
];

export function getFallbackQuestions(count: number = 30): string[] {
  // Shuffle and take requested count
  const shuffled = [...FALLBACK_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function sourceQuestionsFromReddit(): Promise<{ question: string; url: string; category: string }[]> {
  // Attempt to fetch from Reddit API (r/musicmarketing, r/wearethemusicmakers, r/creators)
  // If fails, fall back to curated questions
  try {
    const subreddits = ['musicmarketing', 'wearethemusicmakers', 'creators', 'tiktokhelp'];
    const results: { question: string; url: string; category: string }[] = [];
    
    for (const sub of subreddits.slice(0, 2)) { // Limit to 2 to avoid rate limits
      const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=25`, {
        headers: { 'User-Agent': 'Selah.fm Blog Bot/1.0' },
      });
      if (!res.ok) continue;
      
      const data = await res.json();
      const posts = data?.data?.children || [];
      
      for (const post of posts) {
        const title = post.data?.title || '';
        if (title.endsWith('?') && title.length > 20 && title.length < 200) {
          results.push({
            question: title,
            url: `https://reddit.com${post.data.permalink}`,
            category: sub === 'creators' || sub === 'tiktokhelp' ? 'creator_income' : 'music_promotion',
          });
        }
      }
    }
    
    return results;
  } catch {
    return [];
  }
}
