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

const ARTICLE_PROMPT = `You are the founder of Selah.fm, a CPM marketplace for music promotion where artists set budgets and creators earn per verified view. Write an authentic, practical blog post based on an interview transcript.

VOICE GUIDELINES:
- Warm, direct, and encouraging tone — like a friend giving advice
- Mix spiritual depth with practical business sense
- Use personal anecdotes where natural ("I've seen artists...")
- Avoid corporate jargon, be real and conversational
- Include concrete examples and actionable steps

STRUCTURE:
1. Click-worthy title (under 70 chars)
2. Compelling opening hook (2-3 sentences that grab attention)
3. Body with practical advice, stories, and steps
4. Conclusion with a call to action (join Selah.fm, try it yourself, etc.)

FORMAT:
Return ONLY a JSON object with these fields:
{
  "title": "SEO-optimized title under 70 chars",
  "meta_description": "Compelling meta description under 160 chars",
  "slug": "url-friendly-slug",
  "content_html": "<h2>Section</h2><p>Full HTML content with proper heading hierarchy...</p>",
  "excerpt": "2-3 sentence excerpt for previews",
  "tags": ["tag1", "tag2", "tag3"],
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

const FALLBACK_QUESTIONS = [
  "How much should I budget for my first music promotion campaign?",
  "What CPM rate do top creators actually expect in 2026?",
  "Is TikTok still the best platform for music promotion or is Reels catching up?",
  "How do I find creators who genuinely like my music genre?",
  "Can I make a living as a short-form video creator for musicians?",
  "What's the difference between playlist botting and real creator promotion?",
  "How many views does a typical TikTok video get from a $50 campaign?",
  "Should I require creators to use specific hashtags in their videos?",
  "How do I verify that views on submitted videos are real and not bought?",
  "What kind of content performs best for Christian/electronic music?",
  "How much do content creators actually earn per video on these platforms?",
  "What's the best way to write campaign requirements that attract good creators?",
  "Can I promote my music if I don't have a big social media following?",
  "How do I transition from running Facebook ads to creator-driven promotion?",
  "What makes a campaign cover image stand out to creators browsing?",
  "How do I calculate my ROI on music promotion campaigns?",
  "Is it better to run one big campaign or multiple small ones?",
  "What platforms should I accept submissions from for my campaign?",
  "How do I handle creators who submit low-quality content?",
  "What's the future of music promotion — are we moving away from ads?",
  "How do independent artists build real fan bases without major label budgets?",
  "What's the secret to getting your music used in viral TikTok trends?",
  "How much does the average creator earn per 1,000 views in 2026?",
  "Should I offer bonuses to creators who get exceptional view counts?",
  "What music genres perform best on short-form video platforms right now?",
  "How do I write a compelling campaign title that attracts creators?",
  "Is YouTube Shorts worth including in my music promotion strategy?",
  "What's the most common mistake artists make when launching a campaign?",
  "How do I build long-term relationships with creators who promote my music?",
  "What does a successful music promotion campaign look like from start to finish?",
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
