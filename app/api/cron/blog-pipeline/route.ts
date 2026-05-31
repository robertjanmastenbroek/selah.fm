import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { generateInterviewQuestions, generateArticle, generateFounderAnswers, findVoiceExamples, sourceQuestionsFromReddit } from '@/lib/blog-engine';
import { fetchBlogImage } from '@/lib/blog-images';

export const dynamic = 'force-dynamic';
export const maxDuration = 600;

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

/**
 * Blog pipeline cron — fully automated blog generation.
 * 1. Source questions from Reddit
 * 2. Generate interview questions
 * 3. Auto-answer interviews 
 * 4. Generate blog posts
 * 5. Schedule one post per day
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const log: string[] = [];
  const results = { sourced: 0, interviews: 0, answered: 0, posts: 0, scheduled: 0, errors: 0 };

  try {
    // Find or create batch
    let [batch] = await sql`SELECT id, status FROM batches WHERE status NOT IN ('archived', 'completed', 'generated') ORDER BY created_at DESC LIMIT 1`;
    if (!batch) {
      const monthYear = new Date().toISOString().slice(0, 7);
      const [newBatch] = await sql`INSERT INTO batches (month_year, status) VALUES (${monthYear}, 'sourcing') RETURNING id, status`;
      batch = newBatch;
      log.push(`Created batch ${batch.id}`);
    }
    const batchId = batch.id;

    // Step 1: Source questions
    if (batch.status === 'sourcing') {
      const questions = await sourceQuestionsFromReddit();
      let stored = 0;
      for (const q of questions.slice(0, 15)) {
        const [dup] = await sql`SELECT id FROM batch_questions WHERE source_url = ${q.url} LIMIT 1`;
        if (dup) continue;
        await sql`INSERT INTO batch_questions (batch_id, raw_question, source_url, platform, category) VALUES (${batchId}, ${q.question}, ${q.url}, 'reddit', ${q.category})`;
        stored++;
      }
      results.sourced = stored;
      await sql`UPDATE batches SET status = 'interviewing' WHERE id = ${batchId}`;
      log.push(`Sourced ${stored} questions`);
    }

    // Step 2: Generate interviews
    if (batch.status === 'interviewing') {
      const qs = await sql`
        SELECT bq.id, bq.raw_question FROM batch_questions bq
        WHERE bq.batch_id = ${batchId}
          AND NOT EXISTS (SELECT 1 FROM batch_interviews bi WHERE bi.source_question_id = bq.id)
        LIMIT 5
      `;
      for (const q of qs) {
        try {
          const generatedQs = await generateInterviewQuestions(q.raw_question);
          if (generatedQs?.length) {
            await sql`
              INSERT INTO batch_interviews (batch_id, source_question_id, questions, status)
              VALUES (${batchId}, ${q.id}, ${JSON.stringify(generatedQs.map(q => ({ question: q })))}, 'pending')
            `;
            results.interviews++;
          }
        } catch (e: any) { log.push(`Interview err: ${e.message}`); results.errors++; }
      }
      log.push(`Generated ${results.interviews} interviews`);
    }

    // Step 3: Auto-answer
    const pending = await sql`
      SELECT id, questions FROM batch_interviews
      WHERE batch_id = ${batchId} AND status = 'pending' AND questions IS NOT NULL
      LIMIT 2
    `;
    for (const iv of pending) {
      try {
        const qs = (iv.questions || []).map((q: any) => q.question).filter(Boolean);
        if (!qs.length) continue;
        
        const voiceChunks = await sql`SELECT chunk_text FROM voice_chunks ORDER BY created_at DESC LIMIT 5`;
        const examples = voiceChunks.map((r: any) => r.chunk_text).filter(Boolean);
        
        const answers = await generateFounderAnswers(qs, examples);
        const transcript = answers.map((a: any) => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n');
        
        await sql`
          UPDATE batch_interviews 
          SET answers = ${JSON.stringify(answers)}, transcript = ${transcript}, status = 'answered'
          WHERE id = ${iv.id}
        `;
        results.answered++;
      } catch (e: any) { log.push(`Answer err: ${e.message}`); results.errors++; }
    }
    log.push(`Answered ${results.answered} interviews`);

    // Step 4: Generate posts
    const answered = await sql`
      SELECT bi.id, bi.transcript 
      FROM batch_interviews bi
      WHERE bi.batch_id = ${batchId} AND bi.status = 'answered'
        AND NOT EXISTS (SELECT 1 FROM blog_posts bp WHERE bp.interview_id = bi.id)
      LIMIT 1
    `;
    for (const iv of answered) {
      try {
        if (!iv.transcript) continue;
        const chunks = await sql`SELECT chunk_text FROM voice_chunks ORDER BY created_at DESC LIMIT 50`;
        const voiceExamples = await findVoiceExamples(iv.transcript, chunks.map((c: any) => ({ chunk_text: c.chunk_text, embedding: null })));
        const article = await generateArticle(iv.transcript, voiceExamples);
        const slug = slugify(article.slug || article.title) + '-' + Date.now().toString(36);
        
        const imageQuery = article.image_suggestions?.[0]?.description || 'music promotion';
        const featuredImage = await fetchBlogImage(imageQuery);
        
        await sql`
          INSERT INTO blog_posts (interview_id, title, slug, content_html, excerpt, featured_image, meta_title, meta_description, tags, status, author_id)
          VALUES (${iv.id}, ${article.title}, ${slug}, ${article.content_html}, ${article.excerpt}, ${featuredImage}, ${article.title}, ${article.meta_description || article.excerpt}, ${JSON.stringify(article.tags || [])}, 'draft', (SELECT id FROM users WHERE email = 'info@selah.fm' LIMIT 1))
        `;
        results.posts++;
      } catch (e: any) { log.push(`Post err: ${e.message}`); results.errors++; }
    }
    log.push(`Generated ${results.posts} posts`);

    // Step 5: Schedule one post
    if (results.posts > 0) {
      const [draft] = await sql`SELECT id FROM blog_posts WHERE status = 'draft' ORDER BY created_at DESC LIMIT 1`;
      if (draft) {
        const existingDates = await sql`SELECT publish_at::date as d FROM blog_posts WHERE status = 'scheduled' AND publish_at::date >= CURRENT_DATE ORDER BY d`;
        const taken = new Set(existingDates.map((r: any) => typeof r.d === 'string' ? r.d : new Date(r.d).toISOString().slice(0, 10)));
        let next = new Date(); next.setDate(next.getDate() + 1); next.setUTCHours(9, 0, 0, 0);
        while (taken.has(next.toISOString().slice(0, 10))) next.setDate(next.getDate() + 1);
        await sql`UPDATE blog_posts SET status = 'scheduled', publish_at = ${next.toISOString()} WHERE id = ${draft.id}`;
        results.scheduled++;
        log.push(`Scheduled for ${next.toISOString().slice(0, 10)}`);
      }
    }

    // ── Step 6: Internal linking ─────────────────────────
    if (results.posts > 0) {
      try {
        const [latest] = await sql`SELECT id, title, tags FROM blog_posts ORDER BY created_at DESC LIMIT 1`;
        if (latest) {
          const tags = latest.tags || [];
          const titleWords = latest.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4);
          
          // Find related posts by tag or title word overlap
          const related = await sql`
            SELECT id, title, slug FROM blog_posts
            WHERE id != ${latest.id} AND status = 'published'
            ORDER BY created_at DESC LIMIT 20
          `;
          
          const scored = related.map((p: any) => {
            let score = 0;
            const pTitle = (p.title || '').toLowerCase();
            for (const w of titleWords) { if (pTitle.includes(w)) score++; }
            if (tags.length > 0) {
              const pTags = p.tags || [];
              for (const t of tags) { if (pTags.includes(t)) score += 2; }
            }
            return { ...p, score };
          }).filter((p: any) => p.score > 0).sort((a: any, b: any) => b.score - a.score).slice(0, 5);
          
          if (scored.length > 0) {
            const links = scored.map((p: any) => ({
              title: p.title,
              url: `/blog/${p.slug}`,
            }));
            
            await sql`
              UPDATE blog_posts SET internal_links = ${JSON.stringify(links)} WHERE id = ${latest.id}
            `;
            
            // Also back-link: add this post to related posts' internal links
            for (const p of scored.slice(0, 3)) {
              const [existing] = await sql`SELECT internal_links FROM blog_posts WHERE id = ${p.id}`;
              const existingLinks = existing?.internal_links || [];
              const alreadyLinked = Array.isArray(existingLinks) && existingLinks.some((l: any) => l.url === `/blog/${latest.slug}`);
              if (!alreadyLinked) {
                const newLinks = [{ title: latest.title, url: `/blog/${latest.slug}` }, ...(Array.isArray(existingLinks) ? existingLinks : []).slice(0, 4)];
                await sql`UPDATE blog_posts SET internal_links = ${JSON.stringify(newLinks)} WHERE id = ${p.id}`;
              }
            }
            log.push(`Internal links: ${scored.length} related posts linked`);
          }
        }
      } catch (e: any) { log.push(`Link err: ${e.message}`); }
    }

    log.push(`Done: ${results.sourced}Q ${results.interviews}I ${results.answered}A ${results.posts}P ${results.scheduled}S`);
    return NextResponse.json({ results, log });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, results, log }, { status: 500 });
  }
}
