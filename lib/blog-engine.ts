/**
 * DeepSeek API integration for the Selah.fm blog system.
 * Handles: question generation, article writing, and voice matching.
 *
 * Requires DEEPSEEK_API_KEY in environment.
 */

import { getBannedWordsList, recordBlogPost } from '@/lib/blog-vocabulary';
import { scoreBlogPost, formatScoreSummary } from '@/lib/blog-scorer';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE = 'https://api.deepseek.com/v1';

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function chat(messages: DeepSeekMessage[], options: { temperature?: number; max_tokens?: number; frequency_penalty?: number; presence_penalty?: number; top_p?: number } = {}) {
  if (!DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY not configured');

  // 120s timeout — prevents hanging when DeepSeek is slow on large prompts
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000);

  try {
    const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
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
      throw new Error(`DeepSeek API error ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  } finally {
    clearTimeout(timeoutId);
  }
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

// ── Post length/angle variety — randomly selected per post ──
const LENGTHS = [
  { label: 'Quick', words: 500, tokenMax: 3000, sections: '2-3 concise sections. No fluff.' },
  { label: 'Standard', words: 1000, tokenMax: 5000, sections: '3-4 sections with mixed paragraph lengths.' },
  { label: 'Deep', words: 1800, tokenMax: 8000, sections: '4-6 sections with detailed examples and stories.' },
  { label: 'Ultimate', words: 3000, tokenMax: 10000, sections: '6-8 sections. Comprehensive guide.' },
];
const STRUCTURES = [
  'Open with a punchy line → alternate story sections with advice → end with a challenge.',
  'Lead with the problem → walk through how you solved it → apply to reader → close short.',
  'Start with a vulnerable admission → use lists for action items → end with a bold statement.',
  'Listicle format with numbered items. Each item gets story + advice paragraphs.',
  'Q&A: Start with the question, answer directly, unpack reasoning with a personal story.',
];
const OPENERS = [
  'Open with a direct question.', 'Open with a confession.', 'Open with a specific remembered moment.',
  'Open with the conclusion first.', 'Open with a contrarian take.',
];
const POST_LENGTH = LENGTHS[Math.floor(Math.random() * LENGTHS.length)];
const POST_STRUCTURE = STRUCTURES[Math.floor(Math.random() * STRUCTURES.length)];
const POST_OPENER = OPENERS[Math.floor(Math.random() * OPENERS.length)];

// ── Writer personalities — picked randomly for each post ──
const WRITERS = [
  { name: 'Robert-Jan', voice: 'warm, wise, well-worn. Like a battle-scarred musician turned entrepreneur who lost it all and found something better. Raw, honest, occasionally funny.', style: 'first-person stories, vulnerable admissions, spiritual depth mixed with practical grit.' },
  { name: 'Maya', voice: 'sharp, analytical, a bit skeptical. Former A&R who\'s seen every scam in the book. Cuts through the BS with real talk and industry knowledge.', style: 'industry insider perspective, data-driven arguments, "here\'s what actually works" energy.' },
  { name: 'Jasper', voice: 'laid-back, technical, producer-brain. Lives in the DAW. Cares about sound quality and workflow, not hype.', style: 'hands-on production advice, gear-agnostic, "here\'s how I\'d actually do this" tone.' },
  { name: 'Elena', voice: 'strategic, results-oriented, calm. Music marketing strategist who runs real campaigns. No theory — just what\'s working right now.', style: 'data-backed strategies, case studies, bullet-proof actionable steps.' },
  { name: 'Luna', voice: 'indie artist energy. DIY, grassroots, community-first. Built her following from zero without a label.', style: 'personal journey, relatable struggle, "if I can do it, you can" encouragement.' },
  { name: 'Samir', voice: 'touring musician wisdom. Been on the road for 15 years. Knows what actually moves tickets and merch.', style: 'road-tested advice, live music perspective, long-game thinking.' },
];

const WRITER = WRITERS[Math.floor(Math.random() * WRITERS.length)];

const ARTICLE_PROMPT = `You are ${WRITER.name}. ${WRITER.voice}

Write one blog post in your natural voice. The topic comes from the interview transcript below.

THE ONE RULE: Sound like a real human wrote this. Not a blog. Not a textbook. Not marketing copy. A real person sharing what they know.

HOW TO DO THAT:
- Use contractions: don't, can't, won't, I've, you've, it's. This is non-negotiable.
- Vary your sentences. Long ones. Short ones. Fragments for punch. Three-word zingers. 30-word explanations. Mix them up.
- Start sentences however you want. And. But. So. Or. Because. Look. Here's the thing. Honestly?
- Write like you're talking to one person, not an audience. Use "you". Ask questions. Write the way you'd explain this to a friend over coffee.
- Include something unexpected. A tangent. A memory. An opinion. A doubt. Something that makes the reader think "huh, didn't expect that."
- Use real details from the interview. Specific moments. Actual numbers if they exist. Don't make things up — if you don't know, say "I'm not sure" or "it depends."
- End naturally. A final thought. A question. A challenge. A single line. Whatever feels right. Not "in conclusion."

WHAT TO AVOID:
- Lists of rules. Bureaucratic language. Corporate speak.
- Perfect paragraphs. Real writing is lumpy. Some paragraphs are one sentence. Some are five.
- Sounding like you're trying to sound smart. You're sharing, not lecturing.
- Predictable structures. Don't plan the post. Let it flow.

FORMAT (${POST_LENGTH.label} — roughly ${POST_LENGTH.words} words):
${POST_LENGTH.sections}
Flow: ${POST_STRUCTURE}
Open: ${POST_OPENER}

WORD CHOICE:
- Feelings over facts. "I was terrified" beats "this is a challenging situation."
- Simple words. "Use" not "utilize." "Help" not "empower." "Build" not "cultivate."
- Real phrases people actually say: "Here's the thing", "Look", "Honestly?", "I'll be real with you"
- If you catch yourself writing a sentence that sounds like it belongs in a corporate memo — rewrite it.

THE HONESTY RULE: If the interview doesn't have a specific answer for something, don't invent one. Say "I don't have a perfect answer for this" or "every artist's situation is different" or "honestly, it depends." Real humans admit uncertainty.

PLATFORM CONTEXT: Selah.fm is a fan-to-artist boost platform. Fans discover new songs and boost them directly (0% fee). The Selah Score (0-100) measures genuine belief in a song. Artists connect Stripe to withdraw. Creators make TikTok videos promoting songs and earn per verified view (CPM model, paid via Stripe).

WRITE IT NOW. One post. Your voice. The interview transcript is below.
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

STRUCTURE (${POST_LENGTH.label}, ~${POST_LENGTH.words} words):
${POST_LENGTH.sections}
Flow: ${POST_STRUCTURE}
Opening: ${POST_OPENER}

HTML REQUIREMENTS (for the JSON output):
- Use H2 for section headings, H3 for subsections
- Include 1-2 bulleted lists (for readability, not every section)
- FAQ section at the bottom with 2-4 questions using H3 for each
- Add the primary keyword naturally in the first 100 words and one H2
- The rest is up to you. No rigid template. Write it your way.

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
  "title": "THE QUESTION BEING ANSWERED — exact or closest variant, under 70 chars. This matches the H1, QAPage schema, and the query someone typed into Google.",
  "meta_description": "Compelling meta description under 160 chars with keyword",
  "slug": "url-friendly-slug-with-keyword",
  "content_html": "<h2>Section Heading</h2><p>Content with <a href='/page'>descriptive anchor</a>...</p><h3>Sub-section</h3><p>...</p><h2>FAQ</h2><h3>Question?</h3><p>Answer...</p>",
  "excerpt": "2-3 sentence preview with keyword",
  "tags": ["primary-keyword", "secondary-keyword", "content-pillar"],
  "primary_keyword": "the main keyword this post targets (use from the keyword database)",
  "internal_links": [{"url": "/page", "anchor": "descriptive keyword-rich anchor text"}],
  "faq_schema": [{"question": "FAQ question?", "answer": "Concise answer"}],
  "image_suggestions": [{"type": "featured", "description": "Description of ideal featured image"}],
  "word_count_estimate": ${POST_LENGTH.words}
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
  score?: { score: number; passed: boolean; summary: string };
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

  // ── Real platform data injection — makes every post unique ──
  let platformContext = '';
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.SUPABASE_DATABASE_URL?.replace('?pgbouncer=true', ''), ssl: { rejectUnauthorized: false }, max: 1, connectionTimeoutMillis: 3000 });
    const [stats] = (await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM campaigns WHERE status = 'active') as active_campaigns,
        (SELECT COALESCE(SUM(views_verified), 0)::bigint FROM submissions WHERE review_status = 'approved') as total_views,
        (SELECT COALESCE(SUM(payout_amount_cents), 0)::bigint FROM submissions WHERE payout_status = 'paid') as total_paid_cents
    `)).rows;
    await pool.end();
    if (stats) {
      const paidDollars = (stats.total_paid_cents / 100).toFixed(0);
      platformContext = `\n\n📊 REAL SELAH.FM DATA (USE THESE EXACT NUMBERS in the article — they are real and verifiable):\n- Active campaigns on the platform: ${stats.active_campaigns}\n- Total verified views across all campaigns: ${parseInt(stats.total_views).toLocaleString()}\n- Total paid out to creators: $${paidDollars}\n\nCRITICAL: Reference at least ONE of these real statistics in the post. Use the actual number, not a made-up approximation. This makes the post unique because no other blog has access to this data.`;
    }
  } catch { /* non-blocking — platform data injection is optional */ }

  // ── Self-learning banned words from blog vocabulary tracker ──
  // Every published post feeds back into what the AI avoids in future posts
  let bannedWordsContext = '';
  try {
    const bannedList = await getBannedWordsList();
    if (bannedList) {
      bannedWordsContext = `\n\n📛 SELF-LEARNING BANNED WORDS (from previous blog posts — these patterns are becoming detectable over time):\n${bannedList}\nThese are words and phrases our blog has been overusing. If any appear in your writing, replace them with fresh alternatives. This is critical — repeating vocabulary patterns is how AI detectors catch us.`;
    }
  } catch { /* non-blocking — static banned list in ARTICLE_PROMPT still applies */ }

  const prompt = `${ARTICLE_PROMPT}\n\nFOUNDER: ${founderName}${voiceContext}${founderContext}${keywordDirective}${bannedWordsContext}\n\nINTERVIEW TRANSCRIPT:\n${interviewTranscript}`;

  const response = await chat([
    { role: 'system', content: prompt },
    { role: 'user', content: keyword
      ? `Write a blog post targeting the keyword "${keyword}". This should answer the question someone typing "${keyword}" into Google would ask. Use the interview transcript as source material but make the post a definitive answer to that query.`
      : 'Write the blog post based on this interview.'
    },
  ], { 
    temperature: 0.85, 
    max_tokens: POST_LENGTH.tokenMax, 
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

IMPORTANT: The first element is a <blockquote class="direct-answer"> — this is the direct answer block. PRESERVE this element and its class. Only rewrite the inner text if it sounds AI-generated. Do NOT remove the blockquote tags or change its position.

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

      // ── Record vocabulary & score ────────────────────────────
      // Non-blocking: don't fail the post if recording fails
      try {
        await recordBlogPost(raw.content_html, raw.title, raw.excerpt);
      } catch { /* non-blocking */ }

      try {
        const blogScore = scoreBlogPost(raw.title, raw.content_html, raw.excerpt, raw.faq_schema);
        raw.score = blogScore as any;
        raw.score.summary = formatScoreSummary(blogScore);
      } catch { /* non-blocking */ }

      return raw;
    }
    throw new Error('No JSON found in response');
  } catch {
    // Fallback: extract what we can — use a proper title-based slug
    const fallbackTitle = interviewTranscript.split('\n')[0]?.slice(0, 70) || 'Music Promotion Tips';
    const responseText = (typeof response === 'string') ? response : interviewTranscript;
    return {
      title: fallbackTitle,
      meta_description: interviewTranscript.slice(0, 160),
      slug: fallbackTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) + '-' + Date.now().toString(36).slice(0, 6),
      content_html: `<p>${responseText.replace(/\n/g, '</p><p>')}</p>`,
      excerpt: responseText.slice(0, 200),
      tags: ['music-promotion', 'content-creation'],
      image_suggestions: [{ type: 'featured', description: 'Music promotion marketplace dashboard' }],
    };
  }
}

// ── Auto-Answer (Founder Voice Simulation) ───────────────────────

const AUTO_ANSWER_PROMPT = `You are Robert-Jan Mastenbroek, founder of Selah.fm. Answer these interview questions in your authentic voice.

BACKGROUND: Professional musician who walked away from a record deal (labels take 98%), built a €6M crowdfunding platform, lost everything, lived in a campervan busking on Tenerife beaches, found faith, now makes electronic worship music. You believe artists should own their promotion.

ANSWERING STYLE:
- Start every answer with the direct, objective answer. No warm-up, no throat-clearing.
- Short, punchy, honest — 80-180 words per answer. 
- Use contractions always: don't, can't, I've, it's, that's, won't, isn't, wasn't, we're, I'm, here's
- Share real specifics: busking on Tenerife beaches, the record deal at 21, the €6M crowdfunding platform (Dream or Donate), losing everything, the campervan, quitting smoking after 15 years, electronic worship music. ONLY these known details — never invent conversations, named people, exact amounts on specific days, or messages from fans.
- Be opinionated — you've seen both sides. Mix practical advice with spiritual wisdom naturally.
- Sometimes say "I don't know" or "I'm still figuring this out"
- Use "gonna", "wanna", "kinda" occasionally (1-2 per answer)
- End sentences with prepositions sometimes: "the platform I built", "the music I care about"
- Vary sentence length: mix 4-word punchy ones with 20-word flowing ones

BANNED WORDS — using any of these fails:
- Furthermore, Moreover, Consequently, Thus, Hence, Therefore, Additionally
- In conclusion, To summarize, In summary
- Crucial, Essential, Vital, Paramount, Imperative
- Delve into, Dive deep into, Explore the nuances of
- Game-changer, Revolutionary, Cutting-edge
- Leverage, Utilize (use "use"), Optimize, Maximize
- Robust, Seamless, Comprehensive, Holistic
- Foster, Cultivate, Empower, Enable (use "build", "grow", "help", "let")

FORMAT: Return ONLY a JSON array: [{"question": "Q?", "answer": "Your answer"}]`;

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

/** Generate a single direct answer for the "One Mississippi" block — first thing AI crawlers see */
export async function generateDirectAnswer(question: string): Promise<{
  question: string;
  answer_html: string;
  answer_text: string;
} | null> {
  try {
    const answers = await generateFounderAnswers(
      [{ question }],
      [] // No voice examples needed for direct answers
    );
    
    if (!answers?.[0]?.answer) return null;
    
    const answer = answers[0].answer;
    
    return {
      question,
      answer_html: `<blockquote class="direct-answer"><p><strong>The short answer:</strong> ${answer}</p></blockquote>`,
      answer_text: answer,
    };
  } catch {
    return null;
  }
}

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
  // LOW-HANGING FRUIT (high traffic + low competition — targeted first by pipeline)
  
  // PILLAR 1: Creator Marketplace (med traffic, ZERO competition, direct product fit)
  "How does a creator marketplace for music promotion work?",
  "What should artists look for when hiring content creators to promote music?",
  "How much does it cost to hire a TikTok creator for music promotion?",
  "What's the difference between UGC promotion and influencer marketing?",
  "How do you verify that video views are real and not bought?",
  
  // PILLAR 2: CPM Mechanics (med traffic, very low competition, we own this niche)
  "How does CPM-based music promotion work compared to traditional advertising?",
  "What's a good CPM rate to offer creators for promoting your music?",
  "How do you calculate the ROI of a CPM-based music promotion campaign?",
  "How do you set a campaign budget that protects you from overspending?",
  
  // PILLAR 3: Platform Strategy (med-high traffic, low competition on specific Qs)
  "Why do my TikTok videos get 200 views then stop?",
  "Is my music content shadowbanned on Instagram?",
  "How do I repurpose TikTok content for Reels and Shorts?",
  "What's the best time to post music content for maximum views?",
  
  // PILLAR 4: Creator Income (very high traffic, medium competition, ChatGPT cites)
  "How much money can you realistically make creating short-form videos for musicians?",
  "How many views do you need on TikTok to start earning real money?",
  "Can you make a living as a short-form video creator without millions of followers?",
  "What CPM rates do content creators actually earn promoting music?",
  
  // PILLAR 5: Music Promotion (high traffic, medium competition, core product)
  "How can independent artists promote their music without a record label in 2025?",
  "What's the most cost-effective way to market a new single on a $500 budget?",
  "How do I get my music heard by real people (not bots) on social media?",
  "What music promotion strategies actually work for unknown artists starting from zero?",
  "How do I find content creators who will make TikToks using my song?",
  
  // PILLAR 6: AI Music (exploding search volume, medium competition)
  "Can AI-generated music be promoted on streaming platforms?",
  "What's the best AI tool for creating music in 2025?",
  "How are independent artists using AI for music promotion?",
  "Is AI mastering better than human mastering for independent artists?",
  
  // PILLAR 7: Fan Engagement (medium traffic, low competition)
  "How do I build a fan community as an independent artist?",
  "Should musicians use Discord for fan engagement?",
  "How to grow an email list as a musician?",
  "How do I convert casual listeners into superfans?",
  
  // PILLAR 8: Faith, Purpose & Independent Music Business
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
  // Use the reliable old.reddit.com RSS-based scraper from web-research module
  try {
    const { sourceRedditQuestions } = await import('@/lib/web-research');
    const questions = await sourceRedditQuestions();
    return questions.map(q => ({
      question: q.question,
      url: q.url,
      category: q.category,
    }));
  } catch {
    return [];
  }
}
