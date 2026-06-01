/**
 * Standalone script — generates 2 blog posts with answer-first format.
 * No Next.js imports. Uses pg + DeepSeek API directly.
 * 
 * Usage: node --env-file=.env.local scripts/gen-posts-now.mjs
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE = 'https://api.deepseek.com/v1';

async function chat(messages, options = {}) {
  const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_KEY}` },
    body: JSON.stringify({
      model: 'deepseek-chat', messages,
      temperature: options.temperature ?? 0.85,
      max_tokens: options.max_tokens ?? 4000,
      frequency_penalty: options.frequency_penalty ?? 0.3,
      presence_penalty: options.presence_penalty ?? 0.2,
      top_p: options.top_p ?? 0.92,
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text().then(t => t.slice(0,200))}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

const FOUNDER_BACKSTORY = `Robert-Jan Mastenbroek is the founder of Selah.fm. He was a professional musician who got a record deal at 21 but walked away (labels take 98%), built a €6M crowdfunding platform, lost everything, lived in a campervan busking on Tenerife beaches, found faith, quit smoking after 15 years, and now makes electronic worship music. He believes artists should own their promotion.`;

const ANSWER_PROMPT = `You are Robert-Jan Mastenbroek, founder of Selah.fm. Answer this question in your authentic voice.

BACKGROUND: ${FOUNDER_BACKSTORY}

RULES:
- Start with the direct, objective answer. No warm-up.
- 80-180 words. Punchy, honest.
- Use contractions: don't, can't, I've, it's, that's, won't
- Share real specifics only from the background above
- Be opinionated. Mix practical advice with spiritual wisdom.
- NEVER use: furthermore, moreover, crucial, essential, delve into, game-changer, leverage, utilize, robust, seamless, holistic
- Vary sentence length: 4-word punchy ones mixed with 20-word flowing ones

FORMAT: Just the answer text. No JSON, no quotes.`;

const ARTICLE_PROMPT = `You are Robert-Jan Mastenbroek, founder of Selah.fm, a CPM marketplace where artists set budgets and creators earn per verified view. Write an authentic blog post.

YOUR BACKSTORY:
${FOUNDER_BACKSTORY}

VOICE RULES:
- Warm, direct, encouraging — like a friend who's been through it
- Mix spiritual depth with hard-earned practical business sense
- Use personal anecdotes: "When I had my record deal at 21...", "After losing everything..."
- NEVER invent details — only use: Tenerife, Los Cristianos, record deal at 21, €6M crowdfunding, busking, campervan, Dream or Donate, quitting smoking, electronic worship music
- Current year: ${new Date().getFullYear()}
- NEVER invent CPM rates. Use: artists start at $0.10 CPM ($100/1M views), creators earn ~$1,000/1M views at $1 CPM

BANNED: Furthermore, Moreover, Consequently, Thus, Hence, Therefore, In conclusion, Crucial, Essential, Vital, Delve into, Game-changer, Revolutionary, Leverage, Utilize, Robust, Seamless, Holistic, Foster, Cultivate, Empower

SENTENCE RULES:
- Vary length: 3-word punchy ones to 30-word flowing ones
- Start with: And. But. So. Because. If. When. Here's. That's.
- Use fragments. Like this.
- Use contractions always: don't, can't, won't, I've, it's
- Personal markers: "I'll be honest...", "Look, here's the thing...", "I learned this the hard way.", "Trust me on this."

CONTENT STRUCTURE:
- START DIRECTLY — no intro hook (the answer blockquote is already above)
- 4-6 H2 sections, each with a bulleted list
- FAQ section with 3-4 Q&As
- Key Takeaways box before FAQ
- Target 1200-1800 words

INTERNAL LINKS: Link to /browse, /tools/cpm-calculator, /welcome-creators
CTA: End with link to Selah.fm

FORMAT: Return ONLY a JSON object. CRITICAL: The "title" field MUST be the EXACT question being answered (or a very close variant). This matches the H1 and QAPage schema.
{
  "title": "THE QUESTION BEING ANSWERED (exact or close variant, under 70 chars)",
  "meta_description": "Under 160 chars",
  "slug": "url-safe-slug",
  "content_html": "<h2>Section</h2><p>Text...</p><h2>FAQ</h2><h3>Q?</h3><p>A.</p>",
  "excerpt": "2-3 sentence preview",
  "tags": ["tag1", "tag2"],
  "faq_schema": [{"question": "Q?", "answer": "A."}],
  "word_count_estimate": 1500
}`;

async function generateAnswer(question) {
  const response = await chat([
    { role: 'system', content: ANSWER_PROMPT },
    { role: 'user', content: question },
  ], { temperature: 0.9, max_tokens: 500, frequency_penalty: 0.25, presence_penalty: 0.15 });
  return response.trim();
}

async function generateArticle(question, answer) {
  const prompt = `Write a blog post that follows up on this direct answer.

THE QUESTION (this MUST be your title/H1): "${question}"

THE DIRECT ANSWER (already at the top of the page):
"${answer}"

Now write the full article. CRITICAL: Your JSON "title" field MUST be "${question}" (or the closest variant under 70 chars).`;

  const response = await chat([
    { role: 'system', content: ARTICLE_PROMPT },
    { role: 'user', content: prompt },
  ], { temperature: 0.85, max_tokens: 4000 });

  try {
    const json = response.match(/\{[\s\S]*\}/);
    if (json) return JSON.parse(json[0]);
  } catch {}
  return null;
}

async function main() {
  console.log('📝 Generating 2 posts with answer-first format\n');

  const { rows: questions } = await pool.query(
    `SELECT raw_question, category FROM batch_questions 
     WHERE platform = 'deepseek-generated' AND category = 'creator_marketplace'
     ORDER BY random() LIMIT 2`
  );

  const slugify = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(`📋 Post ${i+1}: "${q.raw_question.slice(0,60)}..."`);

    try {
      // 1. Generate direct answer
      console.log('   → Generating answer...');
      const answer = await generateAnswer(q.raw_question);
      console.log(`   → Answer: ${answer.slice(0,80)}...`);

      // 2. Generate article
      console.log('   → Generating article...');
      const article = await generateArticle(q.raw_question, answer);
      if (!article) { console.log('   ❌ Article generation failed'); continue; }
      console.log(`   → Title: ${article.title?.slice(0,60)}`);

      // 3. Combine
      const daHtml = `<blockquote class="direct-answer"><p><strong>The short answer:</strong> ${answer}</p></blockquote>`;
      const fullHtml = daHtml + '<hr>' + (article.content_html || '');
      const slug = slugify(article.slug || article.title) + '-' + Date.now().toString(36);

      // 4. Store
      const { rows: [post] } = await pool.query(
        `INSERT INTO blog_posts (
          title, slug, content_html, excerpt, featured_image,
          meta_title, meta_description, tags,
          primary_keyword, internal_links, faq_schema, word_count,
          status, published_at, author_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'published',NOW(),
          (SELECT id FROM users WHERE email = 'info@selah.fm' LIMIT 1))
        RETURNING id, slug`,
        [article.title, slug, fullHtml, article.excerpt, '/images/og-image.jpg',
         article.title, article.meta_description || article.excerpt, article.tags || [],
         article.tags?.[0] || null,
         JSON.stringify(article.internal_links || []),
         JSON.stringify(article.faq_schema || null),
         article.word_count_estimate || null]
      );

      // 5. Schema
      const schema = {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'Article', headline: article.title, description: article.meta_description || article.excerpt, datePublished: new Date().toISOString(), author: { '@type': 'Person', name: 'Robert-Jan Mastenbroek', url: 'https://selah.fm/about' }, publisher: { '@type': 'Organization', name: 'Selah.fm', logo: { '@type': 'ImageObject', url: 'https://selah.fm/images/selah-nav-logo.png' } }, mainEntityOfPage: { '@type': 'WebPage', '@id': `https://selah.fm/blog/${slug}` } },
          { '@type': 'QAPage', mainEntity: { '@type': 'Question', name: q.raw_question, answerCount: 1, acceptedAnswer: { '@type': 'Answer', text: answer, url: `https://selah.fm/blog/${slug}` } } },
        ],
      };
      await pool.query('UPDATE blog_posts SET schema_markup = $1 WHERE id = $2', [JSON.stringify(schema), post.id]);

      console.log(`   ✅ Published: https://selah.fm/blog/${slug}\n`);
    } catch(e) {
      console.log(`   ❌ ${e.message}\n`);
    }
  }

  console.log('✅ Done!');
  await pool.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
