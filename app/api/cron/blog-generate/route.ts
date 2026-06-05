import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import crypto from 'crypto';

/**
 * Blog generate — dedicated fast route for generating 1 post immediately.
 * Designed to complete within Railway's 30s proxy timeout by doing
 * only the generation step (no sourcing, no interviews, no scheduling).
 * 
 * Called by dispatcher or manually: /api/cron/blog-generate?secret=...
 * 
 * Returns 202 immediately, then continues processing in background.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  // Generate a quick post from existing answered interviews
  // Must complete within Railway's 300s container timeout
  const result = await generateAndSchedulePost();
  return NextResponse.json(result, { status: result.error ? 500 : 200 });
}

/**
 * Generate a blog post from an answered interview and schedule it.
 * Designed to complete within Railway limits (single DeepSeek call).
 */
async function generateAndSchedulePost(): Promise<{ success: boolean; title?: string; error?: string }> {
  try {
    // Find an answered interview that hasn't been turned into a post yet
    const [answered] = await sql`
      SELECT bi.id, bi.transcript, bq.raw_question, bq.id as question_id
      FROM batch_interviews bi
      JOIN batch_questions bq ON bq.id = bi.source_question_id
      WHERE bi.status = 'answered' AND bi.transcript IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM blog_posts bp WHERE bp.interview_id = bi.id)
      ORDER BY bi.created_at DESC
      LIMIT 1
    `;

    if (!answered?.transcript) {
      // Fallback: use a random founder answer from the verified bank
      const categories: Record<string, { q: string; a: string }[]> = await import('@/lib/founder-answers.json').then(m => m.default || m);
      const allPairs: { q: string; a: string }[] = Object.values(categories).flat();
      if (allPairs.length > 0) {
        const random = allPairs[Math.floor(Math.random() * allPairs.length)];
        if (random?.q && random?.a) {
          answered.transcript = JSON.stringify({ interview: [{ question: random.q, answer: random.a }] });
          answered.raw_question = random.q;
        }
      }
      if (!answered?.transcript) return { success: false, error: 'No questions or founder answers available' };
    }

    // Import lazily
    const { generateArticle, findVoiceExamples, generateDirectAnswer } = await import('@/lib/blog-engine');
    const { fetchBlogImage, attachImageToPost } = await import('@/lib/blog-images');

    const pastChunks = await sql`SELECT chunk_text FROM voice_chunks ORDER BY created_at DESC LIMIT 50`;
    const voiceExamples = await findVoiceExamples(
      answered.transcript,
      pastChunks.map((c: any) => ({ chunk_text: c.chunk_text, embedding: null }))
    );

    const article = await generateArticle(answered.transcript, voiceExamples);
    const title = answered.raw_question || article.title || 'Music Promotion Tips';
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) + '-' + Date.now().toString(36);
    const imageQuery = article.image_suggestions?.[0]?.description || article.primary_keyword || 'music promotion';
    const featuredImage = await fetchBlogImage(imageQuery.slice(0, 100));

    // Direct answer
    let directAnswerHtml = '';
    let directAnswerText = '';
    if (answered.raw_question) {
      try {
        const da = await generateDirectAnswer(answered.raw_question);
        if (da) {
          directAnswerHtml = da.answer_html;
          directAnswerText = da.answer_text;
        }
      } catch { /* non-blocking */ }
    }

    let cleanHtml = (article.content_html || '');
    if (directAnswerHtml) cleanHtml = directAnswerHtml + '<hr>' + cleanHtml;

    const [post] = await sql`
      INSERT INTO blog_posts (
        interview_id, title, slug, content_html, excerpt, featured_image,
        meta_title, meta_description, tags,
        primary_keyword, faq_schema, word_count, status,
        author_id, author_name, author_url
      ) VALUES (
        ${answered.id || null}, ${title}, ${slug}, ${cleanHtml},
        ${article.excerpt || ''}, ${featuredImage},
        ${title}, ${article.meta_description || article.excerpt || ''},
        ${article.tags || []}, ${article.primary_keyword || null},
        ${JSON.stringify(article.faq_schema || null)},
        ${article.word_count_estimate || 0}, 'draft',
        (SELECT id FROM users WHERE email = 'info@selah.fm' LIMIT 1),
        'Selah.fm Music Team', 'https://selah.fm/about'
      )
      RETURNING id
    `;
    
    await attachImageToPost(featuredImage, post.id);

    // Add schema: NewsArticle + QAPage (Google Discover eligibility)
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': ['NewsArticle', 'Article'],
          headline: title,
          description: article.meta_description || article.excerpt || '',
          image: featuredImage,
          datePublished: new Date().toISOString(),
          dateModified: new Date().toISOString(),
          author: { '@type': 'Person', name: 'Selah.fm Music Team', url: 'https://selah.fm/about' },
          publisher: { '@type': 'Organization', name: 'Selah.fm' },
          mainEntityOfPage: { '@type': 'WebPage', '@id': `https://selah.fm/blog/${slug}` },
          articleSection: (article.tags?.[0]) || 'music-promotion',
        },
        ...(directAnswerText ? [{
          '@type': 'QAPage',
          mainEntity: { '@type': 'Question', name: answered.raw_question || title, answerCount: 1, acceptedAnswer: { '@type': 'Answer', text: directAnswerText, url: `https://selah.fm/blog/${slug}` } },
        }] : []),
      ],
    };
    await sql`UPDATE blog_posts SET schema_markup = ${JSON.stringify(schema)} WHERE id = ${post.id}`;

    // Schedule for next available slot
    const existingSlots = await sql`
      SELECT publish_at::date as d, EXTRACT(HOUR FROM publish_at)::int as h
      FROM blog_posts WHERE status = 'scheduled' AND publish_at::date >= CURRENT_DATE
    `;
    const takenSlots = new Set(existingSlots.map((r: any) => {
      const ds = typeof r.d === 'string' ? r.d : new Date(r.d).toISOString().slice(0, 10);
      return `${ds}-${r.h}`;
    }));

    const DAY_SLOTS = [9, 15];
    let scheduleDay = new Date();
    let found = false;
    while (!found) {
      for (const hour of DAY_SLOTS) {
        const slotKey = `${scheduleDay.toISOString().slice(0, 10)}-${hour}`;
        if (!takenSlots.has(slotKey)) {
          const publishAt = new Date(scheduleDay);
          publishAt.setUTCHours(hour, 0, 0, 0);
          if (publishAt <= new Date()) continue;
          await sql`UPDATE blog_posts SET status = 'scheduled', publish_at = ${publishAt.toISOString()} WHERE id = ${post.id}`;
          found = true;
          break;
        }
      }
      if (!found) scheduleDay.setDate(scheduleDay.getDate() + 1);
    }

    // Mark question as used
    if (answered.raw_question) {
      const normalized = answered.raw_question.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
      await sql`INSERT INTO used_questions (question_text, normalized_text, status, blog_post_id) VALUES (${answered.raw_question.slice(0, 500)}, ${normalized}, 'used', ${post.id}) ON CONFLICT (normalized_text) DO NOTHING`;
    }

    return { success: true, title };
  } catch (e: any) {
    console.error('[blog-generate] Error:', e.message);
    return { success: false, error: e.message };
  }
}
