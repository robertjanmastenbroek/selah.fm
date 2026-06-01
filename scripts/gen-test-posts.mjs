/**
 * Generate 2 blog posts immediately — uses the same pipeline functions.
 * Bypasses rate limit for testing the new answer-first format.
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Use the actual blog-engine functions via dynamic import
async function main() {
  console.log('📝 Generating 2 blog posts with answer-first format...\n');

  const { generateInterviewQuestions, generateArticle, generateFounderAnswers, generateDirectAnswer, findVoiceExamples } = await import('../lib/blog-engine.ts');

  // Pick 2 low-hanging fruit questions from the AI pool
  const { rows: questions } = await pool.query(
    `SELECT raw_question, category FROM batch_questions 
     WHERE platform = 'deepseek-generated' AND category = 'creator_marketplace'
     ORDER BY random() LIMIT 2`
  );

  if (questions.length === 0) {
    console.log('No questions found!');
    await pool.end();
    return;
  }

  const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(`\n📋 Post ${i + 1}: "${q.raw_question}"`);
    console.log(`   Category: ${q.category}`);

    try {
      // Step 1: Generate interview questions
      console.log('   Generating interview questions...');
      const interviewQs = await generateInterviewQuestions(q.raw_question);
      console.log(`   → ${interviewQs.length} questions generated`);

      // Step 2: Generate founder answers
      console.log('   Generating founder answers...');
      const voiceChunks = await pool.query('SELECT chunk_text FROM voice_chunks ORDER BY created_at DESC LIMIT 5');
      const voiceExamples = voiceChunks.rows.map((r: any) => r.chunk_text).filter(Boolean);
      const answers = await generateFounderAnswers(
        interviewQs.map(q => ({ question: q })),
        voiceExamples
      );
      const transcript = answers.map((a: any) => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n');
      console.log(`   → ${answers.length} answers generated`);

      // Step 3: Generate direct answer block
      console.log('   Generating direct answer...');
      const directAnswer = await generateDirectAnswer(q.raw_question);
      const daHtml = directAnswer?.answer_html || '';
      const daText = directAnswer?.answer_text || '';
      console.log(`   → Direct answer: ${daText.slice(0, 80)}...`);

      // Step 4: Generate article
      console.log('   Generating article...');
      const pastChunks = await pool.query('SELECT chunk_text FROM voice_chunks ORDER BY created_at DESC LIMIT 50');
      const articleVoiceExamples = await findVoiceExamples(
        transcript,
        pastChunks.rows.map((c: any) => ({ chunk_text: c.chunk_text, embedding: null }))
      );
      const article = await generateArticle(transcript, articleVoiceExamples);
      console.log(`   → Title: "${article.title?.slice(0, 60)}"`);

      // Step 5: Combine + store
      const fullHtml = daHtml + (daHtml ? '<hr>' : '') + (article.content_html || '');
      const slug = slugify(article.slug || article.title) + '-' + Date.now().toString(36);

      const { rows: [post] } = await pool.query(
        `INSERT INTO blog_posts (
          title, slug, content_html, excerpt, featured_image,
          meta_title, meta_description, tags,
          primary_keyword, internal_links, faq_schema, word_count,
          status, published_at, author_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'published',NOW(),
          (SELECT id FROM users WHERE email = 'info@selah.fm' LIMIT 1))
        RETURNING id, slug`,
        [
          article.title, slug, fullHtml, article.excerpt, '/images/og-image.jpg',
          article.title, article.meta_description || article.excerpt, article.tags || [],
          article.primary_keyword || null,
          JSON.stringify(article.internal_links || []),
          JSON.stringify(article.faq_schema || null),
          article.word_count_estimate || null,
        ]
      );

      // Step 6: Dual schema
      const schema = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Article',
            headline: article.title,
            description: article.meta_description || article.excerpt,
            datePublished: new Date().toISOString(),
            author: { '@type': 'Person', name: 'Robert-Jan Mastenbroek', url: 'https://selah.fm/about' },
            publisher: { '@type': 'Organization', name: 'Selah.fm', logo: { '@type': 'ImageObject', url: 'https://selah.fm/images/selah-nav-logo.png' } },
            mainEntityOfPage: { '@type': 'WebPage', '@id': `https://selah.fm/blog/${slug}` },
          },
          ...(daText ? [{
            '@type': 'QAPage',
            mainEntity: {
              '@type': 'Question',
              name: q.raw_question,
              answerCount: 1,
              acceptedAnswer: { '@type': 'Answer', text: daText, url: `https://selah.fm/blog/${slug}` },
            },
          }] : []),
        ],
      };
      await pool.query('UPDATE blog_posts SET schema_markup = $1 WHERE id = $2', [JSON.stringify(schema), post.id]);

      console.log(`   ✅ Published: https://selah.fm/blog/${slug}`);
    } catch (e) {
      console.log(`   ❌ Error: ${e.message}`);
    }
  }

  console.log('\n✅ Done!');
  await pool.end();
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
