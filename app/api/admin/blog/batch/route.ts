import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';
import {
  generateInterviewQuestions,
  generateArticle,
  generateFounderAnswers,
  findVoiceExamples,
  getFallbackQuestions,
  sourceQuestionsFromReddit,
} from '@/lib/blog-engine';
import { fetchBlogImage, loadUsedImages, markImageUsed } from '@/lib/blog-images';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

// ── POST /api/admin/blog/batch ────────────────────────────────────
export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await request.json();
  const action = body.action;

  try {
    switch (action) {
      case 'create_batch':        return createBatch();
      case 'source_questions':    return sourceQuestions(body.batchId);
      case 'generate_interviews': return generateInterviews(body.batchId);
      case 'save_answers':        return saveAnswers(body.batchId, body.interviewId, body.answers);
      case 'auto_answer':         return autoAnswer(body.batchId, body.interviewId);
      case 'auto_answer_all':     return autoAnswerAll(body.batchId);
      case 'preview_post':        return previewPost(body.interviewId);
      case 'generate_from_voice': return generateFromVoice(body.topic, body.keyword);
      case 'finalize_batch':      return finalizeBatch(body.batchId);
      case 'publish_post':        return publishPost(body.postId);
      case 'update_post':         return updatePost(body.postId, body.updates);
      case 'fetch_real_questions': return fetchRealQuestions();
      case 'auto_schedule':        return autoSchedulePost(body.postId);
      case 'batch_generate':       return batchGenerate(body.questions || []);
      case 'skip_question':        return skipQuestion(body.question);
      case 'get_used_questions':   return getUsedQuestions();
      default: return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (e: any) {
    console.error('Blog batch error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── GET /api/admin/blog/batch ────────────────────────────────────
export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get('batchId');
  const action = searchParams.get('action');
  const postId = searchParams.get('postId');

  try {
    if (action === 'overview') return getOverview();
    if (action === 'posts') return getPosts();
    if (postId) return getSinglePost(postId);
    if (batchId) return getBatch(batchId);
    return getBatches();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── Action handlers ──────────────────────────────────────────────

async function autoSchedulePost(postId: string) {
  // Find the next available day that doesn't have a scheduled post
  const existingDates = await sql`
    SELECT publish_at::date as d FROM blog_posts
    WHERE status = 'scheduled' AND publish_at > NOW()
    ORDER BY d
  `;
  const takenDays = new Set(existingDates.map((r: any) => r.d));

  // Start from tomorrow at 09:00 UTC
  let next = new Date();
  next.setUTCHours(9, 0, 0, 0);
  next.setDate(next.getDate() + 1);

  // Skip days that already have a scheduled post
  while (takenDays.has(next.toISOString().slice(0, 10))) {
    next.setDate(next.getDate() + 1);
  }

  const result = await sql`
    UPDATE blog_posts SET
      status = 'scheduled',
      publish_at = ${next.toISOString()},
      updated_at = NOW()
    WHERE id = ${postId}
    RETURNING *
  `;

  return NextResponse.json({
    post: result[0],
    scheduled_for: next.toISOString(),
    skipped_days: existingDates.length,
  });
}

async function batchGenerate(questions: string[]) {
  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: 'No questions provided' }, { status: 400 });
  }

  const results: any[] = [];
  const errors: { question: string; error: string }[] = [];

  for (const q of questions) {
    try {
      const req = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ action: 'generate_from_voice', keyword: q }),
      });
      const res = await POST(req);
      const data = await res.json();

      if (data.post) {
        results.push({ question: q, post: data.post });
        // Mark as used
        markQuestionUsed(q, data.post.id, 'answered');
      } else if (data.error) {
        errors.push({ question: q, error: data.error });
      }
    } catch (e: any) {
      errors.push({ question: q, error: e.message });
    }
  }

  return NextResponse.json({
    generated: results.length,
    total: questions.length,
    errors: errors.length > 0 ? errors : undefined,
    posts: results.map(r => ({ question: r.question, id: r.post.id, title: r.post.title, slug: r.post.slug })),
  });
}

async function createBatch() {
  const monthYear = new Date().toISOString().slice(0, 7);
  const existing = await sql`SELECT id FROM batches WHERE month_year = ${monthYear}`;
  if (existing.length > 0) {
    return NextResponse.json({ batch: existing[0], created: false });
  }
  const [batch] = await sql`
    INSERT INTO batches (month_year, status) VALUES (${monthYear}, 'sourcing')
    RETURNING *
  `;
  return NextResponse.json({ batch, created: true });
}

async function fetchRealQuestions() {
  try {
    // Load already-used question texts for dedup
    const usedRows = await sql`SELECT normalized_text FROM used_questions WHERE status IN ('answered', 'skipped')`;
    const usedSet = new Set(usedRows.map((r: any) => r.normalized_text));

    // Try Reddit for real human questions, filtering out used ones
    const redditQs = (await sourceQuestionsFromReddit())
      .map(q => ({
        question: q.question, url: q.url, platform: 'reddit' as const, category: q.category as string,
      }))
      .filter(q => !usedSet.has(q.question.toLowerCase().trim()));

    // Add curated fallback questions, also filtered
    const fallbackQs = getFallbackQuestions(20)
      .map(q => ({ question: q, url: '', platform: 'curated' as const, category: 'general' as const }))
      .filter(q => !usedSet.has(q.question.toLowerCase().trim()));

    // Combine and deduplicate by question text
    const seen = new Set<string>();
    const all = [...redditQs, ...fallbackQs].filter((q: { question: string; url: string; platform: string; category: string }) => {
      const key = q.question.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Track counts for UI
    const totalAvailable = all.length;
    const usedCount = usedSet.size;

    // Group by category for nice UI display
    const byCategory: Record<string, { question: string; url: string; platform: string }[]> = {};
    for (const q of all.slice(0, 30)) {
      const cat = q.category || 'general';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push({ question: q.question, url: q.url, platform: q.platform || 'curated' });
    }

    return NextResponse.json({
      questions: all.slice(0, 30),
      by_category: byCategory,
      total: all.length,
      total_available: totalAvailable,
      already_used: usedCount,
      sourced_from: all.length > 0 ? 'reddit_and_curated' : 'all_exhausted',
    });
  } catch (e: any) {
    // Always fall back to curated questions, filtering used ones
    const usedRows = await sql`SELECT normalized_text FROM used_questions WHERE status IN ('answered', 'skipped')`.catch(() => ({ rows: [] }));
    const usedSet = new Set(usedRows.rows?.map((r: any) => r.normalized_text) || []);

    const fallbackQs: { question: string; url: string; platform: string; category: string }[] = getFallbackQuestions(30)
      .map(q => ({ question: q, url: '', platform: 'curated', category: 'general' }))
      .filter(q => !usedSet.has(q.question.toLowerCase().trim()));

    return NextResponse.json({
      questions: fallbackQs,
      by_category: { general: fallbackQs },
      total: fallbackQs.length,
      total_available: fallbackQs.length,
      already_used: usedSet.size,
      sourced_from: 'curated_fallback',
    });
  }
}

/** Mark a question as used when a blog post is generated from it */
async function markQuestionUsed(question: string, blogPostId?: string, status: string = 'answered') {
  const normalized = question.toLowerCase().trim();
  try {
    await sql`
      INSERT INTO used_questions (question_text, normalized_text, blog_post_id, status)
      VALUES (${question}, ${normalized}, ${blogPostId || null}, ${status})
      ON CONFLICT (normalized_text) DO UPDATE
      SET blog_post_id = COALESCE(${blogPostId || null}, used_questions.blog_post_id),
          status = ${status},
          updated_at = NOW()
    `;
  } catch (e) {
    console.error('Failed to mark question as used:', (e as Error).message);
  }
}

async function skipQuestion(question: string) {
  await markQuestionUsed(question, undefined, 'skipped');
  return NextResponse.json({ skipped: true, question });
}

async function getUsedQuestions() {
  const rows = await sql`
    SELECT question_text, status, blog_post_id, created_at
    FROM used_questions ORDER BY created_at DESC LIMIT 100
  `;
  const answered = rows.filter((r: any) => r.status === 'answered').length;
  const skipped = rows.filter((r: any) => r.status === 'skipped').length;
  return NextResponse.json({ used: rows, answered, skipped, total: rows.length });
}

async function sourceQuestions(batchId: string) {
  const redditQs = await sourceQuestionsFromReddit();
  const allQuestions = [...redditQs, ...getFallbackQuestions(30).map(q => ({
    question: q, url: '', category: 'general' as const
  }))].slice(0, 30);

  for (const q of allQuestions) {
    await sql`
      INSERT INTO batch_questions (batch_id, raw_question, source_url, platform, category)
      VALUES (${batchId}, ${q.question}, ${q.url || null}, ${q.url ? 'reddit' : 'fallback'}, ${q.category})
    `;
  }
  await sql`UPDATE batches SET status = 'interviewing', updated_at = NOW() WHERE id = ${batchId}`;

  const questions = await sql`SELECT * FROM batch_questions WHERE batch_id = ${batchId} ORDER BY created_at`;
  return NextResponse.json({ questions, batchId });
}

async function generateInterviews(batchId: string) {
  const questions = await sql`SELECT * FROM batch_questions WHERE batch_id = ${batchId}`;
  const interviews = [];
  for (const q of questions) {
    const generatedQs = await generateInterviewQuestions(q.raw_question);
    const [interview] = await sql`
      INSERT INTO batch_interviews (batch_id, question_id, generated_questions, status)
      VALUES (${batchId}, ${q.id}, ${JSON.stringify(generatedQs.map(q => ({ question: q })))}, 'pending')
      RETURNING *
    `;
    interviews.push(interview);
  }
  await sql`UPDATE batches SET status = 'interviewing', updated_at = NOW() WHERE id = ${batchId}`;
  return NextResponse.json({ interviews, batchId });
}

async function saveAnswers(batchId: string, interviewId: string, answers: { question: string; answer: string }[]) {
  const transcript = answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n');
  await sql`
    UPDATE batch_interviews
    SET founder_answers = ${JSON.stringify(answers)}, transcript = ${transcript}, status = 'answered', updated_at = NOW()
    WHERE id = ${interviewId} AND batch_id = ${batchId}
  `;
  const status = await sql`
    SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'answered') as answered
    FROM batch_interviews WHERE batch_id = ${batchId}
  `;
  if (Number(status[0].total) === Number(status[0].answered)) {
    await sql`UPDATE batches SET status = 'answers_complete', updated_at = NOW() WHERE id = ${batchId}`;
  }
  return NextResponse.json({ success: true, interviewId, totalAnswered: Number(status[0].answered), total: Number(status[0].total) });
}

async function autoAnswer(batchId: string, interviewId: string) {
  const [interview] = await sql`SELECT * FROM batch_interviews WHERE id = ${interviewId} AND batch_id = ${batchId}`;
  if (!interview) return NextResponse.json({ error: 'Interview not found' }, { status: 404 });

  const questions = interview.generated_questions || [];
  if (questions.length === 0) {
    return NextResponse.json({ error: 'No generated questions' }, { status: 400 });
  }

  const existingAnswers = await sql`
    SELECT transcript FROM batch_interviews
    WHERE batch_id = ${batchId} AND status = 'answered' AND id != ${interviewId}
    ORDER BY created_at LIMIT 3
  `;
  const voiceChunks = await sql`SELECT chunk_text FROM voice_chunks ORDER BY created_at DESC LIMIT 5`;

  const voiceExamples: string[] = [
    ...existingAnswers.map((r: any) => r.transcript).filter(Boolean),
    ...voiceChunks.map((r: any) => r.chunk_text).filter(Boolean),
  ];

  const answers = await generateFounderAnswers(questions, voiceExamples);
  const transcript = answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n');

  await sql`
    UPDATE batch_interviews
    SET founder_answers = ${JSON.stringify(answers)}, transcript = ${transcript}, status = 'answered', updated_at = NOW()
    WHERE id = ${interviewId} AND batch_id = ${batchId}
  `;

  const status = await sql`
    SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'answered') as answered
    FROM batch_interviews WHERE batch_id = ${batchId}
  `;
  if (Number(status[0].total) === Number(status[0].answered)) {
    await sql`UPDATE batches SET status = 'answers_complete', updated_at = NOW() WHERE id = ${batchId}`;
  }

  return NextResponse.json({ success: true, interviewId, answers, totalAnswered: Number(status[0].answered), total: Number(status[0].total) });
}

async function autoAnswerAll(batchId: string) {
  const pending = await sql`SELECT id FROM batch_interviews WHERE batch_id = ${batchId} AND status = 'pending' ORDER BY created_at`;
  if (pending.length === 0) {
    return NextResponse.json({ success: true, message: 'No pending interviews', autoAnswered: 0 });
  }
  let count = 0;
  for (const row of pending) {
    try {
      const req = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ action: 'auto_answer', batchId, interviewId: row.id }),
      });
      const res = await POST(req);
      if (res.ok) count++;
    } catch {}
  }
  return NextResponse.json({ success: true, autoAnswered: count, total: pending.length });
}

async function previewPost(interviewId: string) {
  await loadUsedImages(sql);
  const [interview] = await sql`SELECT * FROM batch_interviews WHERE id = ${interviewId} AND status = 'answered'`;
  if (!interview) return NextResponse.json({ error: 'Interview not found or not answered' }, { status: 404 });

  const pastChunks = await sql`SELECT chunk_text, embedding FROM voice_chunks ORDER BY created_at DESC LIMIT 50`;
  const voiceExamples = await findVoiceExamples(
    interview.transcript || '',
    pastChunks.map((c: any) => ({ chunk_text: c.chunk_text, embedding: c.embedding }))
  );

  const article = await generateArticle(interview.transcript || '', voiceExamples);
  const baseSlug = slugify(article.slug || article.title);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const imageQuery = article.image_suggestions?.[0]?.description || article.tags?.[0] || 'music promotion';
  const featuredImage = await fetchBlogImage(imageQuery);

  const [post] = await sql`
    INSERT INTO blog_posts (
      interview_id, title, slug, content_html, excerpt, featured_image,
      meta_title, meta_description, tags, image_suggestions,
      primary_keyword, internal_links, faq_schema, word_count, cta_positions,
      status, author_id
    ) VALUES (
      ${interview.id}, ${article.title}, ${slug}, ${article.content_html}, ${article.excerpt}, ${featuredImage},
      ${article.title}, ${article.meta_description || article.excerpt}, ${article.tags || []},
      ${JSON.stringify(article.image_suggestions || [])},
      ${article.primary_keyword || (article.tags?.[0] || null)},
      ${JSON.stringify(article.internal_links || [])},
      ${JSON.stringify(article.faq_schema || null)},
      ${article.word_count_estimate || null},
      ${JSON.stringify([
        {position: 'intro', type: 'soft', text: 'I built Selah.fm because...'},
        {position: 'mid', type: 'tip_box', text: 'Try this: browse campaigns on Selah.fm'},
        {position: 'end', type: 'strong', text: 'Ready to promote your music?'}
      ])},
      'draft',
      (SELECT id FROM users WHERE email = 'info@selah.fm' LIMIT 1)
    )
    RETURNING *
  `;

  if (post?.featured_image) markImageUsed(post.featured_image);

  // Add JSON-LD
  const schema: any = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: post.title, description: post.meta_description || post.excerpt,
    image: post.featured_image, datePublished: post.publish_at,
    author: { '@type': 'Person', name: 'Robert-Jan Mastenbroek', url: 'https://selah.fm/about' },
    publisher: { '@type': 'Organization', name: 'Selah.fm', logo: { '@type': 'ImageObject', url: 'https://selah.fm/images/selah-nav-logo.png' } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://selah.fm/blog/${post.slug}` },
  };
  if (post.faq_schema && Array.isArray(post.faq_schema) && post.faq_schema.length > 0) {
    schema.mainEntity = post.faq_schema.map((faq: any) => ({
      '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    }));
  }
  await sql`UPDATE blog_posts SET schema_markup = ${JSON.stringify(schema)} WHERE id = ${post.id}`;

  if (interview.transcript) {
    const chunks = interview.transcript.match(/.{1,500}/g) || [];
    for (const chunk of chunks.slice(0, 3)) {
      await sql`INSERT INTO voice_chunks (interview_id, chunk_text) VALUES (${interview.id}, ${chunk})`;
    }
  }

  return NextResponse.json({ post, preview: true });
}

async function updatePost(postId: string, updates: any) {
  if (!updates || Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  }

  const title = updates.title !== undefined ? String(updates.title).slice(0, 300) : undefined;
  const content_html = updates.content_html !== undefined ? updates.content_html : undefined;
  const excerpt = updates.excerpt !== undefined ? String(updates.excerpt).slice(0, 500) : undefined;
  const meta_description = updates.meta_description !== undefined ? String(updates.meta_description).slice(0, 300) : undefined;
  const slug = updates.slug !== undefined ? String(updates.slug).slice(0, 200) : undefined;
  const status = updates.status !== undefined ? updates.status : undefined;
  const publish_at = (status === 'scheduled' && updates.publish_at) ? new Date(updates.publish_at).toISOString() : undefined;
  const tags = updates.tags !== undefined ? updates.tags : undefined;

  const result = await sql`
    UPDATE blog_posts SET
      title = COALESCE(${title ?? null}, title),
      content_html = COALESCE(${content_html ?? null}, content_html),
      excerpt = COALESCE(${excerpt ?? null}, excerpt),
      meta_description = COALESCE(${meta_description ?? null}, meta_description),
      slug = COALESCE(${slug ?? null}, slug),
      status = COALESCE(${status ?? null}, status),
      publish_at = CASE WHEN ${publish_at !== undefined} THEN ${publish_at ?? null}::timestamptz ELSE publish_at END,
      published_at = CASE WHEN ${status === 'published'} THEN NOW() ELSE published_at END,
      tags = COALESCE(${tags ?? null}, tags),
      updated_at = NOW()
    WHERE id = ${postId}
    RETURNING *
  `;

  const updatedPost = result[0];
  if (updatedPost?.featured_image) markImageUsed(updatedPost.featured_image);

  return NextResponse.json({ post: updatedPost });
}

async function generateFromVoice(topic: string, keyword: string) {
  if (!topic && !keyword) return NextResponse.json({ error: 'topic or keyword required' }, { status: 400 });
  const searchTopic = keyword || topic;
  const chunks = await sql`SELECT chunk_text FROM voice_chunks WHERE chunk_text NOT LIKE '%_session_start%' AND chunk_text NOT LIKE '%_interview_answer%' ORDER BY created_at DESC LIMIT 40`;
  if (chunks.length === 0) return NextResponse.json({ error: 'Voice library is empty' }, { status: 400 });

  const kws = searchTopic.toLowerCase().split(/\s+/);
  const relevantChunks = chunks.map((c: any) => c.chunk_text).filter((t: string) => kws.some(kw => t.toLowerCase().includes(kw)));
  const transcript = (relevantChunks.length > 0 ? relevantChunks : chunks.map((c: any) => c.chunk_text)).slice(0, 15).join('\n\n');

  const voiceExamples = await findVoiceExamples(transcript, chunks.map((c: any) => ({ chunk_text: c.chunk_text, embedding: null })));
  const article = await generateArticle(transcript, voiceExamples, 'Robert-Jan Mastenbroek', keyword);

  const baseSlug = slugify(article.slug || article.title);
  const slug = baseSlug + '-' + Date.now().toString(36);
  const imageQuery = article.image_suggestions?.[0]?.description || article.tags?.[0] || searchTopic;
  const featuredImage = await fetchBlogImage(imageQuery);

  const [post] = await sql`
    INSERT INTO blog_posts (
      title, slug, content_html, excerpt, featured_image,
      meta_title, meta_description, tags, image_suggestions,
      primary_keyword, internal_links, faq_schema, word_count, cta_positions,
      status, author_id
    ) VALUES (
      ${article.title}, ${slug}, ${article.content_html}, ${article.excerpt}, ${featuredImage},
      ${article.title}, ${article.meta_description || article.excerpt}, ${article.tags || []},
      ${JSON.stringify(article.image_suggestions || [])},
      ${keyword || article.primary_keyword || (article.tags?.[0] || null)},
      ${JSON.stringify(article.internal_links || [])},
      ${JSON.stringify(article.faq_schema || null)},
      ${article.word_count_estimate || null},
      ${JSON.stringify([
        {position: 'intro', type: 'soft', text: 'I built Selah.fm because...'},
        {position: 'mid', type: 'tip_box', text: 'Try this: browse campaigns on Selah.fm'},
        {position: 'end', type: 'strong', text: 'Ready to promote your music?'}
      ])},
      'draft',
      (SELECT id FROM users WHERE email = 'info@selah.fm' LIMIT 1)
    )
    RETURNING *
  `;

  if (post?.featured_image) markImageUsed(post.featured_image);

  // Mark the question as used so we don't answer it again
  if (keyword) markQuestionUsed(keyword, post.id, 'answered');

  return NextResponse.json({ post, generated_from: 'voice_library', chunks_used: relevantChunks.length || chunks.length, total_chunks_in_library: chunks.length });
}

async function finalizeBatch(batchId: string) {
  await loadUsedImages(sql);
  await sql`UPDATE batches SET status = 'generating', updated_at = NOW() WHERE id = ${batchId}`;

  const interviews = await sql`SELECT * FROM batch_interviews WHERE batch_id = ${batchId} AND status = 'answered'`;
  const pastChunks = await sql`SELECT chunk_text, embedding FROM voice_chunks ORDER BY created_at DESC LIMIT 50`;

  const posts: any[] = [];
  const publishDate = new Date();
  publishDate.setDate(publishDate.getDate() + 1);
  publishDate.setUTCHours(9, 0, 0, 0);

  for (const interview of interviews) {
    try {
      const voiceExamples = await findVoiceExamples(
        interview.transcript || '',
        pastChunks.map((c: any) => ({ chunk_text: c.chunk_text, embedding: c.embedding }))
      );

      const article = await generateArticle(interview.transcript || '', voiceExamples);
      const baseSlug = slugify(article.slug || article.title);
      const slug = `${baseSlug}-${Date.now().toString(36)}`;
      const imageQuery = article.image_suggestions?.[0]?.description || article.tags?.[0] || 'music promotion';
      const featuredImage = await fetchBlogImage(imageQuery);

      const [post] = await sql`
        INSERT INTO blog_posts (
          interview_id, title, slug, content_html, excerpt, featured_image,
          meta_title, meta_description, tags, image_suggestions,
          primary_keyword, internal_links, faq_schema, word_count, cta_positions,
          status, publish_at, author_id
        ) VALUES (
          ${interview.id}, ${article.title}, ${slug}, ${article.content_html}, ${article.excerpt}, ${featuredImage},
          ${article.title}, ${article.meta_description || article.excerpt}, ${article.tags || []},
          ${JSON.stringify(article.image_suggestions || [])},
          ${article.primary_keyword || (article.tags?.[0] || null)},
          ${JSON.stringify(article.internal_links || [])},
          ${JSON.stringify(article.faq_schema || null)},
          ${article.word_count_estimate || null},
          ${JSON.stringify([
            {position: 'intro', type: 'soft', text: 'I built Selah.fm because...'},
            {position: 'mid', type: 'tip_box', text: 'Try this: browse campaigns on Selah.fm'},
            {position: 'end', type: 'strong', text: 'Ready to promote your music?'}
          ])},
          'scheduled', ${publishDate.toISOString()},
          (SELECT id FROM users WHERE email = 'info@selah.fm' LIMIT 1)
        )
        RETURNING *
      `;

      if (post?.featured_image) markImageUsed(post.featured_image);

      if (interview.transcript) {
        const chunks = interview.transcript.match(/.{1,500}/g) || [];
        for (const chunk of chunks.slice(0, 3)) {
          await sql`INSERT INTO voice_chunks (interview_id, chunk_text) VALUES (${interview.id}, ${chunk})`;
        }
      }

      await sql`UPDATE batch_interviews SET status = 'converted', updated_at = NOW() WHERE id = ${interview.id}`;
      posts.push(post);
      publishDate.setDate(publishDate.getDate() + 1);
    } catch (e: any) {
      console.error(`Failed to generate article for interview ${interview.id}:`, e.message);
    }
  }

  await sql`UPDATE batches SET status = 'generated', updated_at = NOW() WHERE id = ${batchId}`;

  for (const post of posts) {
    const schema: any = {
      '@context': 'https://schema.org', '@type': 'Article',
      headline: post.title, description: post.meta_description || post.excerpt,
      image: post.featured_image, datePublished: post.publish_at,
      author: { '@type': 'Person', name: 'Robert-Jan Mastenbroek', url: 'https://selah.fm/about' },
      publisher: { '@type': 'Organization', name: 'Selah.fm', logo: { '@type': 'ImageObject', url: 'https://selah.fm/images/selah-nav-logo.png' } },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `https://selah.fm/blog/${post.slug}` },
    };
    if (post.faq_schema && Array.isArray(post.faq_schema) && post.faq_schema.length > 0) {
      schema.mainEntity = post.faq_schema.map((faq: any) => ({
        '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      }));
    }
    await sql`UPDATE blog_posts SET schema_markup = ${JSON.stringify(schema)} WHERE id = ${post.id}`;
  }

  return NextResponse.json({ posts: posts.length, batchId });
}

async function publishPost(postId: string) {
  const [post] = await sql`
    UPDATE blog_posts SET status = 'published', published_at = NOW(), updated_at = NOW()
    WHERE id = ${postId}
    RETURNING *
  `;
  return NextResponse.json({ post });
}

// ── Query handlers ───────────────────────────────────────────────

async function getOverview() {
  const [batchCount] = await sql`SELECT COUNT(*)::int FROM batches`;
  const [postCount] = await sql`SELECT COUNT(*)::int FROM blog_posts WHERE status = 'published'`;
  const [scheduledCount] = await sql`SELECT COUNT(*)::int FROM blog_posts WHERE status = 'scheduled'`;
  const [nextPost] = await sql`SELECT title, publish_at FROM blog_posts WHERE status = 'scheduled' ORDER BY publish_at LIMIT 1`;
  const [voiceChunks] = await sql`SELECT COUNT(*)::int FROM voice_chunks`;
  const [activeBatch] = await sql`SELECT * FROM batches WHERE status NOT IN ('archived') ORDER BY created_at DESC LIMIT 1`;

  return NextResponse.json({
    totalBatches: batchCount?.count || 0,
    publishedPosts: postCount?.count || 0,
    scheduledPosts: scheduledCount?.count || 0,
    nextPost: nextPost || null,
    voiceLibrarySize: voiceChunks?.count || 0,
    activeBatch: activeBatch || null,
  });
}

async function getBatches() {
  const batches = await sql`
    SELECT b.*, COUNT(bq.id)::int as question_count, COUNT(bi.id)::int as interview_count,
      COUNT(bi.id) FILTER (WHERE bi.status = 'answered')::int as answered_count
    FROM batches b
    LEFT JOIN batch_questions bq ON bq.batch_id = b.id
    LEFT JOIN batch_interviews bi ON bi.batch_id = b.id
    GROUP BY b.id ORDER BY b.created_at DESC LIMIT 20
  `;
  return NextResponse.json(batches);
}

async function getBatch(batchId: string) {
  const [batch] = await sql`SELECT * FROM batches WHERE id = ${batchId}`;
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  const questions = await sql`SELECT * FROM batch_questions WHERE batch_id = ${batchId} ORDER BY created_at`;
  const interviews = await sql`
    SELECT bi.*, bq.raw_question, bq.source_url, bq.platform, bq.category
    FROM batch_interviews bi JOIN batch_questions bq ON bq.id = bi.question_id
    WHERE bi.batch_id = ${batchId} ORDER BY bi.created_at
  `;
  const posts = await sql`
    SELECT * FROM blog_posts WHERE interview_id IN (
      SELECT id FROM batch_interviews WHERE batch_id = ${batchId}
    ) ORDER BY publish_at
  `;
  return NextResponse.json({ batch, questions, interviews, posts });
}

async function getSinglePost(postId: string) {
  const [post] = await sql`
    SELECT bp.*, bi.transcript, b.month_year as batch_month
    FROM blog_posts bp
    LEFT JOIN batch_interviews bi ON bi.id = bp.interview_id
    LEFT JOIN batches b ON b.id = bi.batch_id
    WHERE bp.id = ${postId}
  `;
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  return NextResponse.json(post);
}

async function getPosts() {
  const posts = await sql`
    SELECT bp.*, bi.transcript, b.month_year as batch_month
    FROM blog_posts bp
    LEFT JOIN batch_interviews bi ON bi.id = bp.interview_id
    LEFT JOIN batches b ON b.id = bi.batch_id
    ORDER BY bp.created_at DESC LIMIT 50
  `;
  return NextResponse.json(posts);
}
