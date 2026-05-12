import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession, isAdminRequest } from '@/lib/auth';
import {
  generateInterviewQuestions,
  generateArticle,
  findVoiceExamples,
  getFallbackQuestions,
  sourceQuestionsFromReddit,
} from '@/lib/blog-engine';
import { fetchBlogImage } from '@/lib/blog-images';

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
      case 'create_batch':
        return createBatch();
      case 'source_questions':
        return sourceQuestions(body.batchId);
      case 'generate_interviews':
        return generateInterviews(body.batchId);
      case 'save_answers':
        return saveAnswers(body.batchId, body.interviewId, body.answers);
      case 'finalize_batch':
        return finalizeBatch(body.batchId);
      case 'publish_post':
        return publishPost(body.postId);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
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

  try {
    if (action === 'overview') return getOverview();
    if (action === 'posts') return getPosts();
    if (batchId) return getBatch(batchId);
    return getBatches();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── Action handlers ──────────────────────────────────────────────

async function createBatch() {
  const monthYear = new Date().toISOString().slice(0, 7); // "2026-05"
  
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

async function sourceQuestions(batchId: string) {
  // Try Reddit first, fill gaps with fallbacks
  const redditQs = await sourceQuestionsFromReddit();
  
  // Combine and ensure we have 30
  const allQuestions = [...redditQs, ...getFallbackQuestions(30).map(q => ({
    question: q, url: '', category: 'general' as const
  }))].slice(0, 30);

  // Insert into DB
  for (const q of allQuestions) {
    await sql`
      INSERT INTO batch_questions (batch_id, raw_question, source_url, platform, category)
      VALUES (${batchId}, ${q.question}, ${q.url || null}, ${q.url ? 'reddit' : 'fallback'}, ${q.category})
    `;
  }

  await sql`UPDATE batches SET status = 'interviewing', updated_at = NOW() WHERE id = ${batchId}`;

  const questions = await sql`
    SELECT * FROM batch_questions WHERE batch_id = ${batchId} ORDER BY created_at
  `;

  return NextResponse.json({ questions, batchId });
}

async function generateInterviews(batchId: string) {
  const questions = await sql`
    SELECT * FROM batch_questions WHERE batch_id = ${batchId}
  `;

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

  // Check if all interviews are answered
  const status = await sql`
    SELECT COUNT(*) as total,
           COUNT(*) FILTER (WHERE status = 'answered') as answered
    FROM batch_interviews WHERE batch_id = ${batchId}
  `;

  if (status[0].total === status[0].answered) {
    await sql`UPDATE batches SET status = 'answers_complete', updated_at = NOW() WHERE id = ${batchId}`;
  }

  return NextResponse.json({ success: true, interviewId, totalAnswered: Number(status[0].answered), total: Number(status[0].total) });
}

async function finalizeBatch(batchId: string) {
  await sql`UPDATE batches SET status = 'generating', updated_at = NOW() WHERE id = ${batchId}`;

  const interviews = await sql`
    SELECT * FROM batch_interviews WHERE batch_id = ${batchId} AND status = 'answered'
  `;

  // Get voice examples from past interviews
  const pastChunks = await sql`
    SELECT chunk_text, embedding FROM voice_chunks ORDER BY created_at DESC LIMIT 50
  `;

  const posts = [];
  const publishDate = new Date();
  publishDate.setDate(publishDate.getDate() + 1); // Start tomorrow
  publishDate.setUTCHours(9, 0, 0, 0);

  for (const interview of interviews) {
    try {
      const voiceExamples = await findVoiceExamples(
        interview.transcript || '',
        pastChunks.map((c: any) => ({ chunk_text: c.chunk_text, embedding: c.embedding }))
      );

      const article = await generateArticle(interview.transcript || '', voiceExamples);

      // Slugify + ensure uniqueness
      const baseSlug = slugify(article.slug || article.title);
      const slug = `${baseSlug}-${Date.now().toString(36)}`;

      // Fetch featured image
      const imageQuery = article.image_suggestions?.[0]?.description || article.tags?.[0] || 'music promotion';
      const featuredImage = await fetchBlogImage(imageQuery);

      const [post] = await sql`
        INSERT INTO blog_posts (
          interview_id, title, slug, content_html, excerpt, featured_image,
          meta_title, meta_description, tags, image_suggestions,
          primary_keyword, internal_links, faq_schema, word_count, cta_positions,
          status, publish_at, author_id
        )
        VALUES (
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

      // Store voice chunks for future batches
      if (interview.transcript) {
        const chunks = interview.transcript.match(/.{1,500}/g) || [];
        for (const chunk of chunks.slice(0, 3)) {
          await sql`
            INSERT INTO voice_chunks (interview_id, chunk_text) VALUES (${interview.id}, ${chunk})
          `;
        }
      }

      // Update interview status
      await sql`
        UPDATE batch_interviews SET status = 'converted', updated_at = NOW() WHERE id = ${interview.id}
      `;

      posts.push(post);

      // Increment publish date by 1 day for next post
      publishDate.setDate(publishDate.getDate() + 1);
    } catch (e: any) {
      console.error(`Failed to generate article for interview ${interview.id}:`, e.message);
    }
  }

  await sql`UPDATE batches SET status = 'generated', updated_at = NOW() WHERE id = ${batchId}`;

  // Add JSON-LD schema to each post
  for (const post of posts) {
    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.meta_description || post.excerpt,
      image: post.featured_image,
      datePublished: post.publish_at,
      author: { '@type': 'Person', name: 'Robert-Jan Mastenbroek', url: 'https://selah.fm/about' },
      publisher: { '@type': 'Organization', name: 'Selah.fm', logo: { '@type': 'ImageObject', url: 'https://selah.fm/images/selah-nav-logo.png' } },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `https://selah.fm/blog/${post.slug}` },
    };
    // Add FAQ schema if post has FAQ data
    if (post.faq_schema && Array.isArray(post.faq_schema) && post.faq_schema.length > 0) {
      schema.mainEntity = post.faq_schema.map((faq: any) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
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
  const [nextPost] = await sql`
    SELECT title, publish_at FROM blog_posts WHERE status = 'scheduled'
    ORDER BY publish_at LIMIT 1
  `;
  const [voiceChunks] = await sql`SELECT COUNT(*)::int FROM voice_chunks`;

  // Active batch
  const [activeBatch] = await sql`
    SELECT * FROM batches WHERE status NOT IN ('archived') ORDER BY created_at DESC LIMIT 1
  `;

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
    SELECT b.*, 
      COUNT(bq.id)::int as question_count,
      COUNT(bi.id)::int as interview_count,
      COUNT(bi.id) FILTER (WHERE bi.status = 'answered')::int as answered_count
    FROM batches b
    LEFT JOIN batch_questions bq ON bq.batch_id = b.id
    LEFT JOIN batch_interviews bi ON bi.batch_id = b.id
    GROUP BY b.id
    ORDER BY b.created_at DESC
    LIMIT 20
  `;
  return NextResponse.json(batches);
}

async function getBatch(batchId: string) {
  const [batch] = await sql`SELECT * FROM batches WHERE id = ${batchId}`;
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

  const questions = await sql`
    SELECT * FROM batch_questions WHERE batch_id = ${batchId} ORDER BY created_at
  `;

  const interviews = await sql`
    SELECT bi.*, bq.raw_question, bq.source_url, bq.platform, bq.category
    FROM batch_interviews bi
    JOIN batch_questions bq ON bq.id = bi.question_id
    WHERE bi.batch_id = ${batchId}
    ORDER BY bi.created_at
  `;

  const posts = await sql`
    SELECT * FROM blog_posts WHERE interview_id IN (
      SELECT id FROM batch_interviews WHERE batch_id = ${batchId}
    ) ORDER BY publish_at
  `;

  return NextResponse.json({ batch, questions, interviews, posts });
}

async function getPosts() {
  const posts = await sql`
    SELECT bp.*, bi.transcript,
      b.month_year as batch_month
    FROM blog_posts bp
    LEFT JOIN batch_interviews bi ON bi.id = bp.interview_id
    LEFT JOIN batches b ON b.id = bi.batch_id
    ORDER BY bp.created_at DESC
    LIMIT 50
  `;
  return NextResponse.json(posts);
}
