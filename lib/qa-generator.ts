/**
 * Q&A Page Generator — short, structured answers optimized for AI models.
 * Each Q&A page answers ONE question concisely.
 * 
 * Compared to blog posts:
 * - Shorter: 80-200 words vs 500-3000
 * - Cheaper: ~1K tokens vs ~8K
 * - Higher volume: 50-100/day vs 12/day
 * - Better for AI retrieval: direct answers, no fluff
 */
import sql from '@/lib/db';

const QUESTIONS_PER_RUN = 6;
const ANSWER_TOKENS = 500;
const PROMPT_TOKENS = 2000;

/** Generate a concise Q&A from a question using DeepSeek */
async function generateQA(question: string): Promise<{ answer: string; keyword: string } | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You write concise, factual answers for a music promotion platform called Selah.fm. Keep answers 60-150 words. Write in plain HTML: <p> tags for paragraphs, <strong> for emphasis. Use one <ul> if listing 2+ items. Never invent statistics. Begin with the direct answer.' },
          { role: 'user', content: `Write a concise answer to this question about music promotion:\n\n"${question}"\n\nFormat: {\n  "answer_html": "<p>Direct answer here.</p>",\n  "answer_text": "Plain text version of the answer.",\n  "keyword": "main-seo-keyword"\n}` },
        ],
        temperature: 0.7,
        max_tokens: ANSWER_TOKENS,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const raw = JSON.parse(data.choices?.[0]?.message?.content || '{}');

    return {
      answer: raw.answer_html || '',
      keyword: raw.keyword || question.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().slice(0, 60).replace(/\s+/g, '-'),
    };
  } catch {
    return null;
  }
}

/** Make a URL-safe slug from a question */
function makeSlug(question: string): string {
  const base = question
    .toLowerCase()
    .replace(/["'""'']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return base + '-' + Date.now().toString(36);
}

/** Run the Q&A generator — picks unused questions, generates answers, publishes */
export async function runQAGenerator(
  batchId?: string
): Promise<{ generated: number; errors: string[] }> {
  const errors: string[] = [];
  let generated = 0;

  // Get the active batch
  if (!batchId) {
    const [batch] = await sql`
      SELECT id FROM batches WHERE status NOT IN ('completed', 'archived') ORDER BY created_at DESC LIMIT 1
    `;
    if (!batch) { errors.push('No active batch'); return { generated: 0, errors }; }
    batchId = batch.id;
  }

  // Pick unused questions — favor uncategorized ones that haven't been used as blog posts
  const questions = await sql`
    SELECT bq.id, bq.raw_question, bq.category
    FROM batch_questions bq
    WHERE bq.batch_id = ${batchId}
      AND NOT EXISTS (SELECT 1 FROM used_questions uq WHERE uq.normalized_text = LOWER(REGEXP_REPLACE(bq.raw_question, '[^a-z0-9\\s]', '', 'g')))
      AND NOT EXISTS (SELECT 1 FROM batch_interviews bi WHERE bi.source_question_id = bq.id)
      AND NOT EXISTS (SELECT 1 FROM qa_pages qp WHERE qp.source_question_id = bq.id)
    ORDER BY random()
    LIMIT ${QUESTIONS_PER_RUN}
  `;

  for (const q of questions) {
    try {
      const result = await generateQA(q.raw_question);
      if (!result || !result.answer) {
        errors.push(`${q.raw_question.slice(0, 40)}: generation failed`);
        continue;
      }

      const answerText = result.answer.replace(/<[^>]*>/g, '').trim();
      const slug = makeSlug(q.raw_question);
      const keyword = result.keyword || q.raw_question.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().slice(0, 60).replace(/\s+/g, '-');

      const schema = {
        '@context': 'https://schema.org',
        '@type': 'QAPage',
        mainEntity: {
          '@type': 'Question',
          name: q.raw_question,
          answerCount: 1,
          acceptedAnswer: {
            '@type': 'Answer',
            text: answerText.slice(0, 500),
            url: `https://selah.fm/qa/${slug}`,
          },
        },
      };

      await sql`
        INSERT INTO qa_pages (question, answer_html, answer_text, slug, category, tags, source_question_id, primary_keyword, meta_description, faq_schema, schema_markup, word_count, status, published_at)
        VALUES (${q.raw_question}, ${result.answer}, ${answerText}, ${slug}, ${q.category || 'music_promotion'}, ${[q.category || 'music_promotion']}, ${q.id}, ${keyword}, ${answerText.slice(0, 200)}, ${JSON.stringify([{ '@type': 'Question', name: q.raw_question, acceptedAnswer: { '@type': 'Answer', text: answerText.slice(0, 500) } }])}, ${JSON.stringify(schema)}, ${answerText.split(/\s+/).length}, 'published', NOW())
      `;

      // Mark as used
      const normalized = q.raw_question.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      await sql`
        INSERT INTO used_questions (question_text, normalized_text, status, source)
        VALUES (${q.raw_question.slice(0, 500)}, ${normalized}, 'used', 'qa_generator')
        ON CONFLICT (normalized_text) DO NOTHING
      `.catch(() => {});

      generated++;
    } catch (e: any) {
      errors.push(`${q.raw_question.slice(0, 40)}: ${e.message}`);
    }
  }

  return { generated, errors };
}
