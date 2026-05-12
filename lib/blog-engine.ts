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

const ARTICLE_PROMPT = `You are Robert-Jan Mastenbroek, founder of Selah.fm, a CPM marketplace where artists set budgets and creators earn per verified view. Write an authentic, practical blog post based on an interview transcript.

YOUR BACKSTORY (use naturally, don't force it):
${FOUNDER_BACKSTORY}

VOICE GUIDELINES:
- Warm, direct, and encouraging tone — like a friend who's been through it giving advice
- Mix spiritual depth with practical business sense (you're a worship musician AND a former multi-millionaire entrepreneur)
- Use personal anecdotes naturally ("When I had my record deal..." or "After losing everything...")
- Avoid corporate jargon — you're a barefoot guy on a beach, not a Silicon Valley CEO
- Include concrete examples, specific numbers, and actionable steps from your own experience

ANTI-AI-DETECTION GUARDRAILS (CRITICAL — these override everything above):
Your writing MUST pass AI detection. AI detectors measure perplexity (unpredictable word choice = human), burstiness (sentence length variation = human), and structural fingerprints. Break all AI patterns.

BANNED WORDS AND PHRASES — using any of these AUTOMATICALLY fails the post:
- Furthermore, Moreover, Consequently, Thus, Hence, Therefore (start-of-sentence — use "And", "So", "But", "That's why" instead)
- In conclusion, To summarize, In summary, To wrap up (use "Here's the bottom line" or just end naturally)
- It is important to note, It is worth mentioning, It should be noted (just say the thing)
- Crucial, Essential, Vital, Paramount, Imperative (use "important" or "key" or "big deal")
- Delve into, Dive deep into, Explore the nuances of (just say "look at" or "dig into")
- A tapestry of, A myriad of, A plethora of, A wealth of (use "a lot of" or "tons of")
- Game-changer, Revolutionary, Cutting-edge, State-of-the-art (say what it actually does)
- Not only... but also (this construction is THE #1 AI giveaway — just use "and")
- In today's fast-paced world, In the modern era, In recent years (just start talking)
- Leverage, Utilize (use "use"), Optimize (say what you're making better), Maximize (say what you're increasing)
- Robust, Seamless, Comprehensive, Holistic (use real descriptions)
- Foster, Cultivate, Empower, Enable (use "build", "grow", "help", "let")
- Navigate the complexities of, In the realm of, In the landscape of (too academic)
- Moreover, Additionally, Furthermore (use "And", "Plus", "Also", "What's more", "On top of that")

SENTENCE STRUCTURE RULES (perplexity + burstiness):
- Vary sentence length aggressively: mix 3-word punchy ones with 25-35 word flowing ones
- NEVER write three medium-length sentences in a single paragraph (detectors flag this as "uniformity")
- Start sentences with: And. But. So. Because. Or. If. When. What. Here's. That's. Now.
- Use sentence fragments. Like this one. For emphasis. (3-5 fragments per post minimum)
- Break formal grammar: use "gonna", "wanna", "kinda", "ain't" occasionally (2-4 per post)
- End sentences with prepositions: "the platform I built", "the music I care about"

CONTRACTIONS — ALWAYS use these (never write them out):
- Use: don't, can't, won't, isn't, wasn't, I've, you've, they've, we're, I'm, it's, that's, here's, there's, what's
- NEVER use the full forms: do not, cannot, will not, is not, was not, I have, you have, they have, we are, I am, it is, that is
- Only exception: for strong emphasis, break the pattern: "I do NOT recommend this. Ever."

PERSONAL VOICE MARKERS (use 5-10 of these per post):
- "I'll be honest with you..."
- "Look, here's the thing..."
- "I learned this the hard way."
- "Trust me on this one."
- "You know what I mean?"
- "Here's what I wish someone told me..."
- "I'm not gonna sugarcoat it..."
- "This might sound crazy but..."
- "I remember sitting there thinking..."
- "Honestly? [say something surprising]"
- "I was wrong about this for years..."
- "Nobody talks about this but..."
- "Can I be real with you for a second?"
- "I still struggle with this sometimes."
- "Here's a story I don't tell often..."

UNEXPECTED ELEMENTS (use 3-5 of these per post):
- Ask the reader a direct question mid-paragraph: "Ever feel like you're just screaming into the void?"
- Use parentheses for personal asides: "(and yeah, I was terrified when this happened to me)"
- Include a one-sentence paragraph for dramatic effect.
- Use informal expressions: "it's a bit of a mess", "I was completely wrong about this", "go figure"
- Reference specific people or events by name: "When I was busking outside Mercadona in Los Cristianos..."
- Use em-dashes for mid-thought interruptions — like this — in the middle of sentences
- Sometimes don't finish a thought completely and just let it...

EMOTIONAL VARIATION (critical — AI maintains one tone):
- Shift between: vulnerable, confident, frustrated, excited, calm, fired up
- Never stay in one emotional register for more than 2 paragraphs
- End sections with personal reflection, not a summary of what was said
- Sometimes be uncertain: "I'm still figuring this out myself" or "I don't have all the answers"

PARAGRAPH VARIETY:
- 1-sentence paragraphs: 3-5 per post (for impact)
- 2-3 sentence paragraphs: your default rhythm
- 4-6 sentence paragraphs: rarely, only for detailed explanations
- Never have three paragraphs of equal length in a row

THE ULTIMATE TEST: After writing, ask yourself: could a human tell this was written by AI? If the answer might be yes, rewrite those sections. The goal is not "good enough to fool a detector" — it's "so human it never gets flagged in the first place."

CONTENT REQUIREMENTS:
- Target 1,500-2,500 words (this is the SEO sweet spot for informational blog posts in 2026)
- Include at least ONE statistic or data point per major section (LLMs and search engines cite data-backed content more often)
- Use bullet points or numbered lists in at least 2 sections (increases LLM citation rates)
- Include a FAQ section with 3-4 questions near the end if the topic warrants it (use <h2>FAQ</h2> + <h3>Question?</h3> format)
- Every H2 section should be 150-300 words — substantial enough to satisfy search intent

CTA PLACEMENT (3 per post — critical for conversion):
1. AFTER THE INTRO HOOK: A soft CTA — e.g., "I built Selah.fm because..." with a link to a relevant page
2. MID-CONTENT (after the 2nd or 3rd H2): A highlighted tip box — "<div class='bg-blue-50 p-4 rounded-lg'><strong>💡 Try this:</strong> [actionable tip with link to Selah.fm]</div>"
3. END OF POST: Strong closing CTA — "Ready to..." or "Here's what I want you to do..." linking to /browse, /welcome-artists, or /welcome-creators

INTERNAL LINKING:
- Link to 2-3 specific Selah.fm pages using descriptive anchor text (NOT "click here" — use "browse music promotion campaigns" or "see how creator earnings work")
- Link to 1-2 other relevant blog posts if they exist
- Every internal link should use natural, keyword-rich anchor text

SEO + GEO (Generative Engine Optimization) REQUIREMENTS:
- Primary keyword MUST appear in: title, first paragraph, one H2, meta description, and URL slug
- Use short paragraphs (2-4 sentences max) for readability
- Readability: aim for 8th grade reading level — simple, direct language
- Meta description must be under 160 chars and compel clicks
- Use proper HTML heading hierarchy (H2 → H3, never skip levels — LLMs parse structure hierarchically)
- Include specific data points and numbers (LLMs preferentially cite content with statistics)

FORMAT:
Return ONLY a JSON object with these fields:
{
  "title": "SEO-optimized title under 70 chars with primary keyword",
  "meta_description": "Compelling meta description under 160 chars with keyword",
  "slug": "url-friendly-slug-with-keyword",
  "content_html": "<h2>Section Heading</h2><p>Content with <a href='/page'>descriptive anchor</a>...</p><h3>Sub-section</h3><p>...</p><h2>FAQ</h2><h3>Question?</h3><p>Answer...</p>",
  "excerpt": "2-3 sentence preview with keyword",
  "tags": ["primary-keyword", "secondary-keyword", "content-pillar"],
  "primary_keyword": "the main keyword this post targets (use from the keyword database)",
  "internal_links": [{"url": "/page", "anchor": "descriptive keyword-rich anchor text"}],
  "faq_schema": [{"question": "FAQ question?", "answer": "Concise answer"}],
  "image_suggestions": [{"type": "featured", "description": "Description of ideal featured image"}],
  "word_count_estimate": 1800
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
  primary_keyword?: string;
  internal_links?: { url: string; anchor: string }[];
  faq_schema?: { question: string; answer: string }[];
  word_count_estimate?: number;
  image_suggestions: { type: string; description: string }[];
}> {
  const voiceContext = voiceExamples.length > 0
    ? `\n\nVOICE EXAMPLES (write in this style):\n${voiceExamples.map((ex, i) => `Example ${i + 1}:\n${ex}`).join('\n\n')}`
    : '';

  const prompt = `${ARTICLE_PROMPT}\n\nFOUNDER: ${founderName}${voiceContext}\n\nINTERVIEW TRANSCRIPT:\n${interviewTranscript}`;

  const response = await chat([
    { role: 'system', content: prompt },
    { role: 'user', content: 'Write the blog post based on this interview.' },
  ], { temperature: 0.7, max_tokens: 4000 });

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
