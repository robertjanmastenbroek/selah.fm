import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { generateInterviewQuestions, generateArticle, generateFounderAnswers, findVoiceExamples, getFallbackQuestions } from '@/lib/blog-engine';
import { fetchBlogImage } from '@/lib/blog-images';

export const dynamic = 'force-dynamic';
export const maxDuration = 600;

/** Convert basic markdown to HTML — handles headings, bold, dividers, lists */
function cleanMarkdown(html: string): string {
  let cleaned = html
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/<p># (.*?)<\/p>/g, '<h2>$1</h2>')
    .replace(/<p>## (.*?)<\/p>/g, '<h3>$1</h3>')
    .replace(/<p>### (.*?)<\/p>/g, '<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/<p>---\s*<\/p>/g, '<hr>');
  
  // Convert markdown list items (- [text](link)) that appear outside <ul> tags
  // Pattern: "- [text](url)" or "- text" on separate lines within <p> tags
  cleaned = cleaned.replace(/<p>- \[(.*?)\]\((.*?)\)<\/p>/g, '<li><a href="$2">$1</a></li>');
  cleaned = cleaned.replace(/<p>- (.*?)<\/p>/g, '<li>$1</li>');
  
  // Wrap consecutive <li> tags in <ul>
  cleaned = cleaned.replace(/((?:<li>.*?<\/li>\s*)+)/g, (match) => {
    // Don't wrap if already inside ul/ol
    if (match.includes('<ul>')) return match;
    return `<ul>${match}</ul>`;
  });
  
  return cleaned;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

/**
 * Blog pipeline cron — fully automated: source → interview → answer → post → schedule.
 * Uses the same proven logic as the admin batch route.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const log: string[] = [];
  const results = { questions: 0, interviews: 0, answered: 0, posts: 0, scheduled: 0 };

  try {
    // Rate limit: only generate once per day (prevent manual trigger spam)
    const [recentPost] = await sql`SELECT id FROM blog_posts WHERE created_at > NOW() - INTERVAL '23 hours' ORDER BY created_at DESC LIMIT 1`;
    if (recentPost) {
      return NextResponse.json({ message: 'Already generated posts in the last 23 hours. Skipping to avoid duplicates.' });
    }

    // Find or create batch
    let [batch] = await sql`SELECT id, status FROM batches WHERE status NOT IN ('archived', 'completed', 'generated') ORDER BY created_at DESC LIMIT 1`;
    if (!batch) {
      const monthYear = new Date().toISOString().slice(0, 7);
      const [newBatch] = await sql`INSERT INTO batches (month_year, status) VALUES (${monthYear}, 'sourcing') RETURNING id, status`;
      batch = newBatch;
    }
    const batchId = batch.id;
    log.push(`Batch ${batchId.slice(0, 8)}: ${batch.status}`);

    // Step 1: Source questions (if needed)
    const questionCount = await sql`SELECT COUNT(*)::int FROM batch_questions WHERE batch_id = ${batchId}`;
    if (questionCount[0].count < 5) {
      log.push('Sourcing questions...');
      const fallback = getFallbackQuestions(10).map(q => ({ question: q, url: '', category: 'general' as const }));
      let stored = 0;
      for (const q of fallback) {
        await sql`INSERT INTO batch_questions (batch_id, raw_question, source_url, platform, category) VALUES (${batchId}, ${q.question}, ${q.url}, 'curated', ${q.category})`;
        stored++;
      }
      results.questions = stored;
      await sql`UPDATE batches SET status = 'interviewing' WHERE id = ${batchId}`;
      log.push(`Sourced ${stored} questions`);
    }

    // Step 2: Generate interviews
    const qs = await sql`
      SELECT bq.id, bq.raw_question FROM batch_questions bq
      WHERE bq.batch_id = ${batchId}
        AND NOT EXISTS (SELECT 1 FROM batch_interviews bi WHERE bi.source_question_id = bq.id)
      LIMIT 3
    `;
    for (const q of qs) {
      try {
        const generatedQs = await generateInterviewQuestions(q.raw_question);
        if (generatedQs?.length) {
          await sql`
            INSERT INTO batch_interviews (batch_id, source_question_id, generated_questions, status)
            VALUES (${batchId}, ${q.id}, ${JSON.stringify(generatedQs.map(q => ({ question: q })))}, 'pending')
          `;
          results.interviews++;
        }
      } catch (e: any) { log.push(`Interview err: ${e.message}`); }
    }
    log.push(`${results.interviews} interviews`);

    // Step 3: Auto-answer (inline from admin route)
    const pending = await sql`
      SELECT id, generated_questions FROM batch_interviews
      WHERE batch_id = ${batchId} AND status = 'pending' AND generated_questions IS NOT NULL
      LIMIT 4
    `;
    for (const iv of pending) {
      try {
        const questions = iv.generated_questions || [];
        if (questions.length === 0) continue;

        const existingAnswers = await sql`
          SELECT transcript FROM batch_interviews
          WHERE batch_id = ${batchId} AND status = 'answered' AND id != ${iv.id}
          ORDER BY created_at LIMIT 3
        `;
        const voiceChunks = await sql`SELECT chunk_text FROM voice_chunks ORDER BY created_at DESC LIMIT 5`;
        const voiceExamples: string[] = [
          ...existingAnswers.map((r: any) => r.transcript).filter(Boolean),
          ...voiceChunks.map((r: any) => r.chunk_text).filter(Boolean),
        ];

        const answers = await generateFounderAnswers(questions, voiceExamples);
        const transcript = answers.map((a: any) => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n');

        await sql`
          UPDATE batch_interviews
          SET founder_answers = ${JSON.stringify(answers)}, transcript = ${transcript}, status = 'answered'
          WHERE id = ${iv.id} AND batch_id = ${batchId}
        `;
        results.answered++;
        log.push(`  ✅ Answered ${iv.id.slice(0, 8)}`);
      } catch (e: any) {
        log.push(`  ❌ Answer ${iv.id.slice(0, 8)}: ${e.message?.slice(0, 80) || 'unknown error'}`);
      }
    }
    log.push(`${results.answered} answered`);

    // Step 4: Generate post (inline from admin route)
    const answered = await sql`
      SELECT id, transcript FROM batch_interviews
      WHERE batch_id = ${batchId} AND status = 'answered' AND transcript IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM blog_posts bp WHERE bp.interview_id = batch_interviews.id)
      ORDER BY created_at DESC
      LIMIT 2
    `;
    for (const iv of answered) {
      try {
        if (!iv.transcript) continue;

        const pastChunks = await sql`SELECT chunk_text FROM voice_chunks ORDER BY created_at DESC LIMIT 50`;
        const voiceExamples = await findVoiceExamples(
          iv.transcript,
          pastChunks.map((c: any) => ({ chunk_text: c.chunk_text, embedding: null }))
        );

        const article = await generateArticle(iv.transcript, voiceExamples);
        const slug = slugify(article.slug || article.title) + '-' + Date.now().toString(36);
        const imageQuery = article.image_suggestions?.[0]?.description || 'music promotion';
        const featuredImage = await fetchBlogImage(imageQuery);

        const cleanHtml = cleanMarkdown(article.content_html || '');

        const [post] = await sql`
          INSERT INTO blog_posts (
            interview_id, title, slug, content_html, excerpt, featured_image,
            meta_title, meta_description, tags,
            primary_keyword, internal_links, faq_schema, word_count,
            status, author_id
          ) VALUES (
            ${iv.id}, ${article.title}, ${slug}, ${cleanHtml}, ${article.excerpt}, ${featuredImage},
            ${article.title}, ${article.meta_description || article.excerpt}, ${article.tags || []},
            ${article.primary_keyword || null},
            ${JSON.stringify(article.internal_links || [])},
            ${JSON.stringify(article.faq_schema || null)},
            ${article.word_count_estimate || null},
            'draft',
            (SELECT id FROM users WHERE email = 'info@selah.fm' LIMIT 1)
          )
          RETURNING id
        `;

        // Add schema
        const schema = {
          '@context': 'https://schema.org', '@type': 'Article',
          headline: article.title,
          description: article.meta_description || article.excerpt,
          image: featuredImage,
          datePublished: new Date().toISOString(),
          author: { '@type': 'Person', name: 'Robert-Jan Mastenbroek', url: 'https://selah.fm/about' },
          publisher: { '@type': 'Organization', name: 'Selah.fm', logo: { '@type': 'ImageObject', url: 'https://selah.fm/images/selah-nav-logo.png' } },
          mainEntityOfPage: { '@type': 'WebPage', '@id': `https://selah.fm/blog/${slug}` },
        };
        await sql`UPDATE blog_posts SET schema_markup = ${JSON.stringify(schema)} WHERE id = ${post.id}`;

        // Add to voice library
        const chunks = iv.transcript.match(/.{1,500}/g) || [];
        for (const chunk of chunks.slice(0, 3)) {
          await sql`INSERT INTO voice_chunks (interview_id, chunk_text) VALUES (${iv.id}, ${chunk})`;
        }

        results.posts++;
        log.push(`  ✅ Post: ${article.title?.slice(0, 60)}`);
      } catch (e: any) {
        log.push(`  ❌ Post err: ${e.message?.slice(0, 80) || 'unknown'}`);
      }
    }
    log.push(`${results.posts} posts`);

    // Step 5: Schedule all generated posts (1 per day, starting tomorrow)
    if (results.posts > 0) {
      const drafts = await sql`SELECT id FROM blog_posts WHERE status = 'draft' ORDER BY created_at DESC LIMIT ${results.posts}`;
      const existingDates = await sql`SELECT publish_at::date as d FROM blog_posts WHERE status = 'scheduled' AND publish_at::date >= CURRENT_DATE ORDER BY d`;
      const taken = new Set(existingDates.map((r: any) => typeof r.d === 'string' ? r.d : new Date(r.d).toISOString().slice(0, 10)));
      let next = new Date(); next.setDate(next.getDate() + 1); next.setUTCHours(9, 0, 0, 0);
      
      for (const draft of drafts) {
        while (taken.has(next.toISOString().slice(0, 10))) next.setDate(next.getDate() + 1);
        await sql`UPDATE blog_posts SET status = 'scheduled', publish_at = ${next.toISOString()} WHERE id = ${draft.id}`;
        taken.add(next.toISOString().slice(0, 10));
        results.scheduled++;
        log.push(`Scheduled: ${next.toISOString().slice(0, 10)}`);
        next.setDate(next.getDate() + 1);
      }
    }

    // Step 6: Internal linking — connect new posts to related existing posts
    if (results.posts > 0) {
      try {
        const newPosts = await sql`
          SELECT id, title, slug, tags FROM blog_posts 
          WHERE status = 'scheduled' AND created_at > NOW() - INTERVAL '1 hour'
          ORDER BY created_at DESC LIMIT ${results.posts}
        `;
        
        for (const np of newPosts) {
          const tags = np.tags || [];
          const titleWords = (np.title || '').toLowerCase().split(/\s+/).filter((w: string) => w.length > 4);
          
          const related = await sql`
            SELECT id, title, slug, tags FROM blog_posts
            WHERE id != ${np.id} AND status = 'published'
            ORDER BY published_at DESC LIMIT 20
          `;
          
          const scored = related.map((p: any) => {
            let score = 0;
            const pTitle = (p.title || '').toLowerCase();
            for (const w of titleWords) { if (pTitle.includes(w)) score++; }
            if (tags.length > 0) {
              const pTags = p.tags || [];
              if (Array.isArray(pTags)) {
                for (const t of tags) { if (pTags.includes(t)) score += 2; }
              }
            }
            return { ...p, score };
          }).filter((p: any) => p.score > 0).sort((a: any, b: any) => b.score - a.score).slice(0, 3);
          
          if (scored.length > 0) {
            const links = scored.map((p: any) => ({ title: p.title, url: `/blog/${p.slug}` }));
            await sql`UPDATE blog_posts SET internal_links = ${JSON.stringify(links)} WHERE id = ${np.id}`;
            
            // Back-link: add this new post to related posts' internal links
            for (const rp of scored.slice(0, 2)) {
              const [existing] = await sql`SELECT internal_links FROM blog_posts WHERE id = ${rp.id}`;
              const existingLinks = existing?.internal_links || [];
              const alreadyLinked = Array.isArray(existingLinks) && existingLinks.some((l: any) => l.url === `/blog/${np.slug}`);
              if (!alreadyLinked) {
                const newLinks = [{ title: np.title, url: `/blog/${np.slug}` }, ...(Array.isArray(existingLinks) ? existingLinks : []).slice(0, 3)];
                await sql`UPDATE blog_posts SET internal_links = ${JSON.stringify(newLinks)} WHERE id = ${rp.id}`;
              }
            }
            log.push(`  🔗 Linked to ${scored.length} related posts`);
          }
        }
      } catch (e: any) { log.push(`Link err: ${e.message}`); }
    }

    log.push(`Done: ${results.questions}Q ${results.interviews}I ${results.answered}A ${results.posts}P ${results.scheduled}S`);
    return NextResponse.json({ results, log });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, results, log }, { status: 500 });
  }
}
