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

  // Return 202 immediately to avoid Railway 30s proxy timeout
  const response = NextResponse.json({ accepted: true, message: 'Generation started in background' }, { status: 202 });

  // Continue in background after response is sent
  setTimeout(async () => {
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
        console.log('[blog-generate] No answered interviews ready to generate');
        return;
      }

      // Import dynamically to avoid circular deps at module level
      const { generateArticle, findVoiceExamples, generateDirectAnswer } = await import('@/lib/blog-engine');
      const { fetchBlogImage, attachImageToPost } = await import('@/lib/blog-images');
      const { scoreBlogPost } = await import('@/lib/blog-scorer');

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

      // Clean markdown
      let cleanHtml = (article.content_html || '');
      if (directAnswerHtml) {
        cleanHtml = directAnswerHtml + '<hr>' + cleanHtml;
      }

      const [post] = await sql`
        INSERT INTO blog_posts (
          interview_id, title, slug, content_html, excerpt, featured_image,
          meta_title, meta_description, tags, primary_keyword, internal_links,
          faq_schema, word_count, status,
          author_id, author_name, author_url
        ) VALUES (
          ${answered.id}, ${title}, ${slug}, ${cleanHtml},
          ${article.excerpt || ''}, ${featuredImage},
          ${title}, ${article.meta_description || article.excerpt || ''},
          ${article.tags || []}, ${article.primary_keyword || null},
          ${JSON.stringify(article.internal_links || [])},
          ${JSON.stringify(article.faq_schema || null)},
          ${article.word_count_estimate || null}, 'draft',
          (SELECT id FROM users WHERE email = 'info@selah.fm' LIMIT 1),
          'Selah.fm Music Team', 'https://selah.fm/about'
        )
        RETURNING id
      `;
      
      await attachImageToPost(featuredImage, post.id);

      // Add schema
      const schema = {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'Article', headline: title, description: article.meta_description || '', image: featuredImage, datePublished: new Date().toISOString(), author: { '@type': 'Person', name: 'Selah.fm Music Team' }, publisher: { '@type': 'Organization', name: 'Selah.fm' }, mainEntityOfPage: { '@type': 'WebPage', '@id': `https://selah.fm/blog/${slug}` } },
          ...(directAnswerText ? [{ '@type': 'QAPage', mainEntity: { '@type': 'Question', name: answered.raw_question || title, answerCount: 1, acceptedAnswer: { '@type': 'Answer', text: directAnswerText, url: `https://selah.fm/blog/${slug}` } } }] : []),
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
            
            // For today: if it's before 15:00 UTC, schedule for 15:00 today
            // Otherwise schedule for 09:00 tomorrow
            if (publishAt <= new Date()) continue;
            
            await sql`UPDATE blog_posts SET status = 'scheduled', publish_at = ${publishAt.toISOString()} WHERE id = ${post.id}`;
            console.log(`[blog-generate] Scheduled: ${title} at ${publishAt.toISOString()}`);
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

      console.log(`[blog-generate] Done: ${title}`);
    } catch (e: any) {
      console.error('[blog-generate] Error:', e.message);
    }
  }, 100);

  return response;
}
