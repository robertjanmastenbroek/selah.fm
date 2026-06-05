import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { generateInterviewQuestions, generateArticle, generateFounderAnswers, generateDirectAnswer, findVoiceExamples, getFallbackQuestions, sourceQuestionsFromReddit } from '@/lib/blog-engine';
import { fetchBlogImage, attachImageToPost } from '@/lib/blog-images';
import { scoreBlogPost } from '@/lib/blog-scorer';
import { getVocabStats, decayVocabulary } from '@/lib/blog-vocabulary';

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

/** Normalize question text for deduplication — lowercase, strip punctuation, collapse whitespace */
function normalizeQuestion(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

/** Check if a question has been used before (cross-batch dedup) */
async function isQuestionUsed(text: string): Promise<boolean> {
  const normalized = normalizeQuestion(text);
  const exists = await sql`SELECT id FROM used_questions WHERE normalized_text = ${normalized} LIMIT 1`;
  return exists.length > 0;
}

/** Mark a question as used after generating a post */
async function markQuestionUsed(text: string, blogPostId: string) {
  const normalized = normalizeQuestion(text);
  await sql`
    INSERT INTO used_questions (question_text, normalized_text, status, blog_post_id)
    VALUES (${text.slice(0, 500)}, ${normalized}, 'used', ${blogPostId})
    ON CONFLICT (normalized_text) DO NOTHING
  `;
}

/** Enforce question-title format — ALWAYS use the source question as the displayed title.
 * The source question from the AI pool is a real query someone types into Google.
 * The AI-generated title goes into meta_title for SEO, but the visible H1 must be the question. */
function enforceQuestionTitle(title: string, sourceQuestion: string): string {
  if (sourceQuestion) return sourceQuestion;
  if (title) return title;
  return 'Music Promotion Question';
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
    // Rate limit: delegated to dispatcher (only fires at hours 2, 8, 14, 20 UTC).
    // No additional cooldown needed — dispatcher scheduling prevents run drift.
    // Use ?force=true for manual backfills (skips all checks).

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
      
      // Try Reddit first — real questions people are asking right now
      const redditQs = await sourceQuestionsFromReddit();
      if (redditQs.length > 0) {
        let stored = 0;
        for (const q of redditQs.slice(0, 5)) {
          await sql`INSERT INTO batch_questions (batch_id, raw_question, source_url, platform, category) VALUES (${batchId}, ${q.question}, ${q.url}, 'reddit', ${q.category})`;
          stored++;
        }
        results.questions += stored;
        log.push(`Sourced ${stored} questions from Reddit`);
      }
      
      // Fill from AI-generated question pool — weighted by traffic priority
      const aiRemaining = 10 - results.questions;
      if (aiRemaining > 0) {
        const priorityOrder = [
          'creator_marketplace',  // med traffic, ZERO competition, direct product alignment
          'cpm_mechanics',        // med traffic, very low competition, we own this niche
          'platform_strategy',    // med-high traffic, low competition on specific questions
          'creator_income',       // very high traffic, medium competition, ChatGPT cites
          'music_promotion',      // high traffic, medium competition, core product
          'ai_music',             // high traffic (exploding), medium competition, less saturated
          'fan_engagement',       // medium traffic, low competition
          'paid_ads',             // medium traffic, medium competition
          'youtube_musicians',    // medium traffic, medium competition
          'artist_business',      // medium traffic, high competition (many finance blogs)
          'spotify_artists',      // med-high traffic, high competition (Spotify's own docs)
          'live_streaming',       // low-med traffic, low competition
        ];
        let aiStored = 0;
        
        for (const cat of priorityOrder) {
          if (aiStored >= aiRemaining) break;
          const catQs = await sql`
            SELECT raw_question, category FROM batch_questions bq
            WHERE bq.platform = 'deepseek-generated' AND bq.category = ${cat}
              AND NOT EXISTS (SELECT 1 FROM batch_questions bq2 WHERE bq2.raw_question = bq.raw_question AND bq2.batch_id = ${batchId})
            ORDER BY random() LIMIT ${aiRemaining - aiStored}
          `;
          for (const q of catQs) {
            // Skip questions already answered in previous batches (cross-batch dedup)
            if (await isQuestionUsed(q.raw_question)) continue;
            await sql`INSERT INTO batch_questions (batch_id, raw_question, source_url, platform, category) VALUES (${batchId}, ${q.raw_question}, '', 'ai-generated', ${q.category})`;
            aiStored++;
          }
        }
        if (aiStored > 0) {
          results.questions += aiStored;
          log.push(`Sourced ${aiStored} questions from AI pool (weighted priority)`);
        }
      }
      
      // Fill remaining slots with curated fallback questions
      const remaining = 10 - results.questions;
      if (remaining > 0) {
        const fallback = getFallbackQuestions(remaining).map(q => ({ question: q, url: '', category: 'general' as const }));
        let fbStored = 0;
        for (const q of fallback) {
          await sql`INSERT INTO batch_questions (batch_id, raw_question, source_url, platform, category) VALUES (${batchId}, ${q.question}, ${q.url}, 'curated', ${q.category})`;
          fbStored++;
        }
        results.questions += fbStored;
        log.push(`Sourced ${fbStored} fallback questions`);
      }
      
      await sql`UPDATE batches SET status = 'interviewing' WHERE id = ${batchId}`;
      log.push(`Total sourced: ${results.questions} questions`);
    }

    // Step 2: Generate interviews — process 6 at a time to clear backlog faster
    const qs = await sql`
      SELECT bq.id, bq.raw_question FROM batch_questions bq
      WHERE bq.batch_id = ${batchId}
        AND NOT EXISTS (SELECT 1 FROM batch_interviews bi WHERE bi.source_question_id = bq.id)
      LIMIT 6
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
        const errMsg = e?.message || String(e) || 'unknown error';
        log.push(`  ❌ Answer ${iv.id.slice(0, 8)}: ${errMsg.slice(0, 200)}`);
      }
    }
    log.push(`${results.answered} answered`);

    // Step 4: Generate 1 post per run (each post takes 2-3 min of DeepSeek calls)
    // Pipeline runs every 6h at 08:00, 14:00, 20:00, 02:00 UTC → 1 post/run = 4/day
    const answered = await sql`
      SELECT bi.id, bi.transcript, bq.raw_question FROM batch_interviews bi
      JOIN batch_questions bq ON bq.id = bi.source_question_id
      WHERE bi.batch_id = ${batchId} AND bi.status = 'answered' AND bi.transcript IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM blog_posts bp WHERE bp.interview_id = bi.id)
      ORDER BY bi.created_at DESC
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
        // Enforce question-title format for QAPage schema + SEO featured snippets
        const title = enforceQuestionTitle(article.title, iv.raw_question);
        const slug = slugify(title) + '-' + Date.now().toString(36);
        // Use primary keyword for image search if available — more specific = more variety
        const imageQuery = article.image_suggestions?.[0]?.description 
          || article.primary_keyword 
          || 'music promotion';
        const featuredImage = await fetchBlogImage(imageQuery.slice(0, 100));

        // Generate direct answer block — first thing AI crawlers + readers see
        let directAnswerHtml = '';
        let directAnswerText = '';
        if (iv.raw_question) {
          try {
            const da = await generateDirectAnswer(iv.raw_question);
            if (da) {
              directAnswerHtml = da.answer_html;
              directAnswerText = da.answer_text;
            }
          } catch { /* non-blocking */ }
        }

        const fullHtml = directAnswerHtml + (directAnswerHtml ? '<hr>' : '') + (article.content_html || '');
        const cleanHtml = cleanMarkdown(fullHtml);

        const [post] = await sql`
          INSERT INTO blog_posts (
            interview_id, title, slug, content_html, excerpt, featured_image,
            meta_title, meta_description, tags,
            primary_keyword, internal_links, faq_schema, word_count,
            status, author_id, author_name, author_url
          ) VALUES (
            ${iv.id}, ${title}, ${slug}, ${cleanHtml}, ${article.excerpt}, ${featuredImage},
            ${title}, ${article.meta_description || article.excerpt}, ${article.tags || []},
            ${article.primary_keyword || null},
            ${JSON.stringify(article.internal_links || [])},
            ${JSON.stringify(article.faq_schema || null)},
            ${article.word_count_estimate || null},
            'draft',
            (SELECT id FROM users WHERE email = 'info@selah.fm' LIMIT 1),
            'Selah.fm Music Team',
            'https://selah.fm/about'
          )
          RETURNING id
        `;

        // Link the downloaded image to this post
        await attachImageToPost(featuredImage, post.id);

        // Add triple schema: NewsArticle + Article + QAPage
        const schema = {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': ['NewsArticle', 'Article'],
              headline: article.title,
              description: article.meta_description || article.excerpt,
              image: featuredImage,
              datePublished: new Date().toISOString(),
              dateModified: new Date().toISOString(),
              author: { '@type': 'Person', name: 'Selah.fm Music Team', url: 'https://selah.fm/about' },
              publisher: { '@type': 'Organization', name: 'Selah.fm', logo: { '@type': 'ImageObject', url: 'https://selah.fm/images/selah-nav-logo.png' } },
              mainEntityOfPage: { '@type': 'WebPage', '@id': `https://selah.fm/blog/${slug}` },
              articleSection: (article.tags?.[0]) || 'music-promotion',
              backstory: article.meta_description || article.excerpt || 'Music promotion tips and creator insights',
            },
            ...(directAnswerText ? [{
              '@type': 'QAPage',
              mainEntity: {
                '@type': 'Question',
                name: iv.raw_question || article.title,
                answerCount: 1,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: directAnswerText,
                  url: `https://selah.fm/blog/${slug}`,
                },
              },
            }] : []),
          ],
        };
        await sql`UPDATE blog_posts SET schema_markup = ${JSON.stringify(schema)} WHERE id = ${post.id}`;

        // Track question as used (cross-batch dedup)
        if (iv.raw_question) {
          await markQuestionUsed(iv.raw_question, post.id);
        }

        // Add to voice library
        const chunks = iv.transcript.match(/.{1,500}/g) || [];
        for (const chunk of chunks.slice(0, 3)) {
          await sql`INSERT INTO voice_chunks (interview_id, chunk_text) VALUES (${iv.id}, ${chunk})`;
        }

        // ── Quality score & vocabulary logging ──────────────────
        try {
          const blogScore = scoreBlogPost(article.title, article.content_html, article.excerpt, article.faq_schema);
          const plainText = article.content_html.replace(/<[^>]*>/g, ' ');
          const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;
          
          await sql`
            INSERT INTO blog_quality_scores (blog_post_id, score, word_count,
              sentence_variety_score, paragraph_variety_score,
              banned_word_penalty, generic_phrase_penalty,
              personal_voice_count, contraction_ratio,
              emotional_shifts, has_faq, has_key_takeaways)
            VALUES (${post.id}, ${blogScore.score}, ${wordCount},
              ${blogScore.checks[1]?.points || 0},
              ${blogScore.checks[6]?.points || 0},
              ${15 - (blogScore.checks[2]?.points || 15)},
              ${10 - (blogScore.checks[3]?.points || 10)},
              ${blogScore.checks[4]?.points || 0},
              ${(blogScore.checks[5]?.detail?.match(/\(([\d.]+) per/)?.[1] || '0')},
              ${blogScore.checks[12]?.points || 0},
              ${!!article.faq_schema?.length},
              ${article.content_html.includes('Key Takeaways')}
            )
            ON CONFLICT (blog_post_id) DO UPDATE SET
              score = EXCLUDED.score, checked_at = NOW()
          `;

          if (blogScore.passed) {
            log.push(`  📊 Score: ${blogScore.score}/100 [PASS]`);
          } else {
            log.push(`  ⚠️ Score: ${blogScore.score}/100 [FLAGGED] — ${blogScore.checks.filter(c => !c.passed).map(c => c.name).join(', ')}`);
          }
        } catch (e: any) {
          log.push(`  📊 Score: error — ${e.message.slice(0, 100)}`);
        }

        results.posts++;
        log.push(`  ✅ Post: ${article.title?.slice(0, 60)}`);
      } catch (e: any) {
        const errMsg = e?.message || String(e) || 'unknown';
        const errStack = e?.stack ? e.stack.split('\n').slice(0, 2).join(' ') : '';
        log.push(`  ❌ Post err: ${errMsg.slice(0, 200)}${errStack ? ' | ' + errStack.slice(0, 150) : ''}`);
      }
    }
    log.push(`${results.posts} posts`);

    // Step 5: Schedule 2 posts per day (09:00 and 15:00 UTC slots)
    if (results.posts > 0) {
      const drafts = await sql`SELECT id FROM blog_posts WHERE status = 'draft' ORDER BY created_at DESC LIMIT ${results.posts}`;
      
      // Track which date+hour slots are already taken
      const existingSlots = await sql`
        SELECT publish_at::date as d, EXTRACT(HOUR FROM publish_at)::int as h
        FROM blog_posts WHERE status = 'scheduled' AND publish_at::date >= CURRENT_DATE
      `;
      const takenSlots = new Set(
        existingSlots.map((r: any) => {
          const dateStr = typeof r.d === 'string' ? r.d : new Date(r.d).toISOString().slice(0, 10);
          return `${dateStr}-${r.h}`;
        })
      );
      
      const DAY_SLOTS = [9, 15]; // 09:00 UTC and 15:00 UTC — 2 posts per day
      
      for (const draft of drafts) {
        // Find next available date+slot (must be in the future)
        let scheduleDay = new Date();
        let found = false;
        
        while (!found) {
          for (const hour of DAY_SLOTS) {
            const slotKey = `${scheduleDay.toISOString().slice(0, 10)}-${hour}`;
            if (!takenSlots.has(slotKey)) {
              const publishAt = new Date(scheduleDay);
              publishAt.setUTCHours(hour, 0, 0, 0);
              // Skip past slots — don't schedule at 09:00 when it's already 10:00
              if (publishAt <= new Date()) continue;
              await sql`UPDATE blog_posts SET status = 'scheduled', publish_at = ${publishAt.toISOString()} WHERE id = ${draft.id}`;
              takenSlots.add(slotKey);
              results.scheduled++;
              log.push(`Scheduled: ${publishAt.toISOString().slice(0, 16)}Z`);
              found = true;
              break;
            }
          }
          if (!found) scheduleDay.setDate(scheduleDay.getDate() + 1);
        }
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

    // ── Periodic vocabulary decay ──────────────────────────────
    // Every ~50 posts, decay the vocabulary to create a sliding window
    if (results.posts > 0) {
      try {
        const stats = await getVocabStats();
        if (stats.totalWords > 500) {
          const removed = await decayVocabulary();
          log.push(`  🧹 Decayed vocabulary: ${removed} stale entries removed (${stats.totalWords} → ${stats.totalWords - removed} words)`);
        }
      } catch { /* non-blocking */ }
    }

    log.push(`Done: ${results.questions}Q ${results.interviews}I ${results.answered}A ${results.posts}P ${results.scheduled}S`);
    return NextResponse.json({ results, log });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, results, log }, { status: 500 });
  }
}