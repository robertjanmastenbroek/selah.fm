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

async function chat(messages: DeepSeekMessage[], options: { temperature?: number; max_tokens?: number; frequency_penalty?: number; presence_penalty?: number; top_p?: number } = {}) {
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
      frequency_penalty: options.frequency_penalty ?? 0,
      presence_penalty: options.presence_penalty ?? 0,
      top_p: options.top_p ?? 1,
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

// ── Load founder's real answers (source of truth) ────────────────
const FOUNDER_ANSWERS: Record<string, { q: string; a: string }[]> = (() => {
  try {
    return require('./founder-answers.json');
  } catch {
    return {};
  }
})();

// Build a flattened reference of all real founder quotes for injection
function getRelevantFounderQuotes(topic: string, max: number = 5): string[] {
  const all = Object.values(FOUNDER_ANSWERS).flat();
  const topicWords = topic.toLowerCase().split(/\s+/);
  const scored = all.map(qa => {
    const text = (qa.q + ' ' + qa.a).toLowerCase();
    let score = 0;
    for (const w of topicWords) {
      if (text.includes(w)) score++;
      if (qa.q.toLowerCase().includes(w)) score += 2;
    }
    return { ...qa, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, max);
  return scored.map(x => `Q: ${x.q}\nA: ${x.a}`);
}

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
- Include specific details ONLY from the founder's real backstory or the interview transcript. Never invent names, places, dates, or numbers that aren't in the source material. Use: "Tenerife", "Los Cristianos", "the record deal at 21", "€6M crowdfunding platform", "busking on beaches", "the campervan", "Dream or Donate", "quitting smoking after 15 years", "electronic worship music" — these are real. Do NOT fabricate messages from fans, specific euro amounts on specific days, or names of people who don't exist.
- CRITICAL: The current year is ${new Date().getFullYear()}. Never use any other year for "today", "current", "this year", or "now" references. If writing about a specific year in the past, use only real dates from the founder's backstory (the record deal, the platform launch, the loss, etc.).
- NEVER invent CPM rates, revenue numbers, or industry statistics. ONLY use numbers from the FOUNDER'S REAL ANSWERS section below. If no real data exists for a claim, say "rates vary" or "it depends" instead of making up a number.

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

CONTENT STRUCTURE (follow this exact template):

1. OPENING HOOK (first 3-5 paragraphs):
   - Start with a bold statement or question. One sentence. Standalone paragraph.
   - Follow with 2-4 short punchy paragraphs (10-25 words each).
   - This pattern forces the reader to keep scrolling. Think sales page, not blog.
   - Primary keyword MUST appear within the first 100 words.

2. TABLE OF CONTENTS (skip for short posts under 800 words):
   <h2>In this article</h2>
   <ul><li><a href='#section-slug'>Section Title</a></li>...</ul>

3. BODY SECTIONS (4-6 H2 headings):
   - Each H2 section: mix of short punchy paragraphs AND a bulleted list
   - Every section needs ONE bulleted list (2-5 items) — Google pulls these for featured snippets
   - Include at least ONE specific number or data point per section
   - Alternate between punchy rhythm and slightly longer flowing paragraphs
   - Never have two sections with the same structural pattern back-to-back

4. KEY TAKEAWAYS BOX (before FAQ):
   <h2>Key Takeaways</h2>
   <ul><li><strong>Takeaway 1:</strong> One-line summary</li>...</ul>
   - 3-5 one-line bullet points
   - Each starts with bold label then colon
   - This is what skimmers read — make it count

5. FAQ SECTION (3-4 questions):
   <h2>FAQ</h2>
   <h3>Question?</h3><p>1-2 sentence answer.</p>
   - Short answers. Punchy. No fluff.
   - These get pulled into Google's "People Also Ask" boxes

6. CLOSING:
   - 2-3 short paragraphs that land the message
   - End with a standalone bold line for impact
   - Then the CTA section

CONTENT REQUIREMENTS:
- Target 1,200-2,000 words (SEO sweet spot — long enough for depth, short enough to finish)
- Every H2 section: 100-250 words with at least one bulleted list
- FAQ section: always include. Non-negotiable.
- Key Takeaways box: always include. Non-negotiable.
- Primary keyword in: title, first 100 words, one H2, meta description, URL slug, and at least one list item

CTA PLACEMENT (3 per post):
1. AFTER INTRO HOOK: Soft, story-driven — "This is why I built <a href='/'>Selah.fm</a>."
2. MID-CONTENT: Tip box with specific action — "<div class='bg-primary/5 border border-primary/10 rounded-xl p-4 my-6'><strong>💡 Try this:</strong> [specific action] — <a href='/page'>do it here</a>.</div>"
3. END: Strong, direct — "Ready to..." with link to /browse, /welcome-artists, or /welcome-creators

IMAGE RULES:
- Generate exactly ONE image_suggestion (not multiple)
- NO captions, NO figure tags, NO figcaption in the content_html
- The featured image in the JSON metadata is the ONLY image for the post
- image_suggestions should be a single-item array: [{"type":"featured","description":"short description"}]
- Content MUST NOT contain any <img>, <figure>, or <figcaption> tags
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
  founderName: string = 'Robert-Jan Mastenbroek',
  keyword?: string
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

  // Inject the founder's REAL answers as source material — never fabricate
  const founderQuotes = getRelevantFounderQuotes(interviewTranscript, 8);
  const founderContext = founderQuotes.length > 0
    ? `\n\nFOUNDER'S REAL ANSWERS (use these directly — do NOT invent alternative details):\n${founderQuotes.join('\n\n')}`
    : '';

  // Strong keyword injection — ensures the post targets the right query
  const keywordDirective = keyword
    ? `\n\n🔑 PRIMARY KEYWORD (non-negotiable): "${keyword}"\n- The TITLE must include this keyword naturally (or a very close variant)\n- The SLUG must be built from this keyword\n- The keyword MUST appear in the first 100 words of the post\n- One H2 heading must include the keyword or a close variant\n- The meta description must include the keyword\n- At least one bulleted list item should mention the keyword\n- The post should ANSWER the question implied by the keyword\n- Frame the entire post as answering someone who typed "${keyword}" into Google`
    : '';

  const prompt = `${ARTICLE_PROMPT}\n\nFOUNDER: ${founderName}${voiceContext}${founderContext}${keywordDirective}\n\nINTERVIEW TRANSCRIPT:\n${interviewTranscript}`;

  const response = await chat([
    { role: 'system', content: prompt },
    { role: 'user', content: keyword
      ? `Write a blog post targeting the keyword "${keyword}". This should answer the question someone typing "${keyword}" into Google would ask. Use the interview transcript as source material but make the post a definitive answer to that query.`
      : 'Write the blog post based on this interview.'
    },
  ], { 
    temperature: 0.85, 
    max_tokens: 4000, 
    frequency_penalty: 0.3,
    presence_penalty: 0.2,
    top_p: 0.92,
  });

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const raw = JSON.parse(jsonMatch[0]);
      
      // ── Multi-Pass Self-Critique ──────────────────────────────
      // Have the AI evaluate its own output for detection patterns and rewrite
      try {
        const critiquePrompt = `You are an AI detection expert. Analyze this blog post content for machine-written patterns and rewrite ANY sections that would trigger AI detectors.

AI DETECTION CHECKLIST — rewrite EVERY section that fails these:
1. Sentence length variation: Are there groups of 3+ sentences of similar length? Rewrite them to vary from 3 words to 30 words.
2. Predictable transitions: "Furthermore", "Additionally", "Moreover" → replace with "And", "So", "But", "Plus", "What's more", or fragment sentences
3. Uniform paragraph structure: Same number of sentences per paragraph → break up with 1-sentence paragraphs and longer flowing ones
4. Lack of personal specifics: "I learned this the hard way" → add a REAL specific detail (place, name, amount, date)
5. Emotional flatness: Does the tone stay the same? → inject vulnerability, frustration, excitement shifts
6. Over-structured lists: Are bullet points too neat? → make one item longer, add an informal aside
7. Fabricated details: Remove any invented specific conversations with named people, exact euro amounts on specific days, or messages from fans that aren't in the founder's known backstory (Tenerife, record deal at 21, €6M platform, busking, campervan, Dream or Donate, quitting smoking, electronic worship music). Replace fabricated specifics with general truthful observations.

Rewrite the content_html field ONLY. Keep the JSON structure. Return the full JSON object with content_html rewritten to pass ALL checks. Do NOT change any other fields.

Original JSON: ${JSON.stringify(raw).slice(0, 8000)}`;

        const critiqueRes = await chat([
          { role: 'system', content: 'You rewrite blog posts to pass AI detection. Return ONLY valid JSON with the content_html field rewritten. Never change other fields.' },
          { role: 'user', content: critiquePrompt },
        ], { temperature: 0.9, max_tokens: 4000, frequency_penalty: 0.4, presence_penalty: 0.3 });
        
        const critiqueJson = critiqueRes.match(/\{[\s\S]*\}/);
        if (critiqueJson) {
          const improved = JSON.parse(critiqueJson[0]);
          if (improved.content_html && improved.content_html.length > 500) {
            raw.content_html = improved.content_html;
          }
        }
      } catch {
        // Self-critique is optional — fall through to original
      }
      
      return raw;
    }
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

// ── Auto-Answer (Founder Voice Simulation) ───────────────────────

const AUTO_ANSWER_PROMPT = `You are Robert-Jan Mastenbroek, founder of Selah.fm. Answer these interview questions in your authentic voice.

BACKGROUND: Professional musician who walked away from a record deal (labels take 98%), built a €6M crowdfunding platform, lost everything, lived in a campervan busking on Tenerife beaches, found faith, now makes electronic worship music. You believe artists should own their promotion.

ANSWERING STYLE:
- Short, punchy, honest — 30-150 words per answer. No fluff.
- Use contractions always: don't, can't, I've, it's, that's
- Share real specifics from your life when relevant: busking on Tenerife beaches, the record deal at 21, the €6M crowdfunding platform (Dream or Donate), losing everything, living in a campervan, quitting smoking after 15 years, making electronic worship music. ONLY use these known details — never invent conversations, specific amounts on specific days, or messages from fans.
- Be opinionated — you've seen both sides
- Mix practical advice with spiritual wisdom naturally
- Sometimes say "I don't know" or "I'm still figuring this out"
- Use "gonna", "wanna", "kinda" occasionally
- NEVER use: furthermore, moreover, crucial, essential, delve into, game-changer

FORMAT: Return a JSON array of objects: [{"question": "Q?", "answer": "Your answer"}]`;

export async function generateFounderAnswers(
  questions: { question: string }[],
  voiceExamples: string[]
): Promise<{ question: string; answer: string }[]> {
  const voiceContext = voiceExamples.length > 0
    ? `\n\nRECENT ANSWERS FROM THE FOUNDER (match this voice):\n${voiceExamples.slice(0, 5).join('\n\n')}`
    : '';

  const questionsText = questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n');

  const response = await chat([
    { role: 'system', content: AUTO_ANSWER_PROMPT + voiceContext },
    { role: 'user', content: `Answer these questions as Robert-Jan:\n\n${questionsText}` },
  ], { 
    temperature: 0.9, 
    max_tokens: 2000,
    frequency_penalty: 0.25,
    presence_penalty: 0.15,
  });

  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    }
    throw new Error('No JSON array found');
  } catch {
    // Fallback: pair questions with extracted answers
    const lines = response.split('\n').filter((l: string) => l.trim());
    return questions.map((q, i) => ({
      question: q.question,
      answer: lines[i]?.replace(/^\d+\.\s*/, '').trim() || 'Good question. Let me think about that...',
    }));
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
  // Fetch from Reddit API with rotating sort orders for freshness
  // Uses multiple subreddits and alternates between hot/new/top to get different questions each run
  try {
    const subreddits = ['musicmarketing', 'wearethemusicmakers', 'creators', 'tiktokhelp', 'instagrammarketing', 'newtubers'];
    const sortOrders = ['hot', 'new', 'top'];
    
    // Pick a random sort order each time for freshness
    const sort = sortOrders[Math.floor(Math.random() * sortOrders.length)];
    const timeFilter = sort === 'top' ? '&t=week' : ''; // For top, get weekly to avoid stale results
    
    const results: { question: string; url: string; category: string }[] = [];
    
    // Shuffle subreddits and take 3 for variety
    const shuffled = [...subreddits].sort(() => Math.random() - 0.5);
    
    for (const sub of shuffled.slice(0, 3)) {
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/${sort}.json?limit=25${timeFilter}`,
        { headers: { 'User-Agent': 'Selah.fm Blog Bot/1.0' } }
      );
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
