import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getFallbackQuestions } from '@/lib/blog-engine';

export const maxDuration = 120;

/**
 * Source questions — generates hundreds of diverse, keyword-centric questions
 * across ALL content categories. Called manually or by dispatcher when pool runs low.
 * 
 * GET /api/cron/source-questions?secret=...&count=200
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  // Check current pool size
  const [{ count: currentPool }] = await sql`SELECT COUNT(*)::int FROM used_questions WHERE status = 'available'`;
  const [{ count: pendingInterviews }] = await sql`SELECT COUNT(*)::int FROM batch_interviews WHERE status = 'pending' AND batch_id = (SELECT id FROM batches WHERE status NOT IN ('archived', 'completed') ORDER BY created_at DESC LIMIT 1)`;

  // How many new questions we need
  const questionsNeeded = Math.max(0, 300 - currentPool - pendingInterviews);
  if (questionsNeeded <= 0) {
    return NextResponse.json({ pool: currentPool, pending: pendingInterviews, message: 'Pool is full, no sourcing needed' });
  }

  const log: string[] = [];
  let totalSourced = 0;

  // Find or create batch
  let [batch] = await sql`SELECT id, status FROM batches WHERE status NOT IN ('archived', 'completed', 'generated') ORDER BY created_at DESC LIMIT 1`;
  if (!batch) {
    const monthYear = new Date().toISOString().slice(0, 7);
    const [newBatch] = await sql`INSERT INTO batches (month_year, status) VALUES (${monthYear}, 'sourcing') RETURNING id, status`;
    batch = newBatch;
  }

  // ── 1. Source from Reddit (fresh, real questions) ──────────
  try {
    const { sourceQuestionsFromReddit } = await import('@/lib/blog-engine');
    const redditQs = await sourceQuestionsFromReddit();
    let redditStored = 0;
    for (const q of redditQs.slice(0, 30)) {
      const normalized = q.question.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
      const exists = await sql`SELECT id FROM used_questions WHERE normalized_text = ${normalized} LIMIT 1`;
      if (exists.length === 0) {
        await sql`
          INSERT INTO batch_questions (batch_id, raw_question, source_url, platform, category)
          VALUES (${batch.id}, ${q.question}, ${q.url}, 'reddit', ${q.category || 'general'})
        `;
        await sql`INSERT INTO used_questions (question_text, normalized_text, status) VALUES (${q.question.slice(0, 500)}, ${normalized}, 'available') ON CONFLICT (normalized_text) DO NOTHING`;
        redditStored++;
      }
    }
    if (redditStored > 0) {
      totalSourced += redditStored;
      log.push(`Reddit: ${redditStored} fresh questions`);
    }
  } catch (e: any) {
    log.push(`Reddit error: ${e.message.slice(0, 100)}`);
  }

  // ── 2. Generate 200+ DeepSeek questions across ALL categories ──
  // Weighted toward underserved categories
  const CATEGORIES: { name: string; weight: number; keywords: string[]; count: number }[] = [
    // ARTIST-FOCUSED (highest priority — nearly empty)
    { name: 'artist_promotion', weight: 3, keywords: ['promote my music', 'get discovered', 'music marketing tips', 'independent artist', 'promote song', 'music career', 'grow audience', 'music branding', 'promote album', 'music PR', 'music release strategy', 'promote single'], count: 30 },
    { name: 'artist_budget', weight: 3, keywords: ['music promotion budget', 'how much to spend on promotion', 'cheap music promotion', 'promote music on a budget', 'cost effective music promotion', 'music marketing ROI', 'music advertising budget'], count: 20 },
    { name: 'artist_platforms', weight: 2, keywords: ['promote music on TikTok', 'promote music on Instagram', 'promote music on YouTube', 'social media for musicians', 'TikTok for musicians', 'Instagram for artists', 'YouTube for musicians'], count: 20 },
    { name: 'artist_labels', weight: 2, keywords: ['record deal vs independent', 'signing a record contract', 'independent vs label', 'music label contract', 'leave record label', 'start independent label', 'distribution deal'], count: 15 },
    
    // FAN-FOCUSED (second priority — completely empty)
    { name: 'fan_support', weight: 3, keywords: ['support independent artist', 'support musician', 'how to help indie artist', 'crowdfund music', 'donate to musician', 'support music creator', 'fan funding music', 'patreon musician'], count: 15 },
    { name: 'fan_discovery', weight: 2, keywords: ['find new music', 'discover independent artists', 'new music recommendations', 'find underground music', 'discover indie musicians', 'music discovery platforms'], count: 15 },
    
    // FAITH & PURPOSE (empty)
    { name: 'faith_music', weight: 2, keywords: ['Christian musician', 'worship music career', 'faith based music', 'Christian artist promotion', 'gospel music marketing', 'worship music monetization', 'holy rave', 'Christian electronic music'], count: 15 },
    
    // CREATOR ECONOMY (already well-served, lower priority)
    { name: 'creator_income', weight: 1, keywords: ['creator income', 'how much creators earn', 'TikTok pay', 'short form video income', 'content creator salary', 'creator fund payout', 'monetize content'], count: 15 },
    { name: 'cpm_mechanics', weight: 1, keywords: ['what is CPM', 'CPM rate', 'CPM explained', 'cost per mille', 'CPM advertising', 'CPM vs CPC', 'good CPM rate'], count: 10 },
    { name: 'platform_strategy', weight: 1, keywords: ['TikTok algorithm', 'Instagram algorithm', 'YouTube algorithm', 'get more views', 'viral video strategy', 'content strategy', 'posting schedule'], count: 15 },
    { name: 'music_promotion', weight: 1, keywords: ['music promotion', 'promote music online', 'music marketing strategy', 'get music heard', 'promote independent music', 'music promotion tips'], count: 15 },
    
    // BUSINESS & PHILOSOPHY
    { name: 'music_business', weight: 2, keywords: ['music business', 'make money as musician', 'music career advice', 'touring income', 'merchandise sales', 'music royalties', 'streaming revenue', 'sync licensing'], count: 15 },
    { name: 'founder_story', weight: 2, keywords: ['record deal experience', 'leaving record label', 'music startup founder', 'building a music platform', 'open source music', 'faith entrepreneurship', 'starting over after failure'], count: 15 },
  ];

  // Calculate total we need to generate
  const aiNeeded = Math.min(questionsNeeded, 200);
  let aiGenerated = 0;

  // Process categories in order, weighted by need
  for (const cat of CATEGORIES) {
    if (aiGenerated >= aiNeeded) break;

    try {
      const prompt = `You are a keyword research expert for a music promotion platform called Selah.fm. 
Generate ${cat.count} unique, realistic questions that real people would type into Google or ask on Reddit about "${cat.name}".

Topic keywords: ${cat.keywords.join(', ')}

RULES:
- Each question must be a real search query someone would actually type (not a blog title)
- Questions should vary: some short ("How to promote my music?"), some long ("What's the best way to promote my music on a $100 budget?")
- NO duplicate questions, NO slight rewordings of the same question
- Cover different angles within the category
- Each question under 150 characters

Return ONLY a JSON array of strings: ["Question 1?", "Question 2?", ...]`;

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You generate realistic SEO keyword questions for a music promotion platform. Return ONLY valid JSON arrays.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.9,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        log.push(`${cat.name}: API error ${response.status}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) { log.push(`${cat.name}: No JSON in response`); continue; }

      const questions: string[] = JSON.parse(jsonMatch[0]);
      let stored = 0;

      for (const q of questions) {
        if (!q || q.length < 10) continue;
        const normalized = q.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

        // Dedup against existing questions
        const exists = await sql`SELECT id FROM used_questions WHERE normalized_text = ${normalized} LIMIT 1`;
        if (exists.length > 0) continue;

        await sql`
          INSERT INTO batch_questions (batch_id, raw_question, source_url, platform, category)
          VALUES (${batch.id}, ${q}, '', 'deepseek-generated', ${cat.name})
        `;
        await sql`
          INSERT INTO used_questions (question_text, normalized_text, status)
          VALUES (${q.slice(0, 500)}, ${normalized}, 'available')
          ON CONFLICT (normalized_text) DO NOTHING
        `;
        stored++;
      }

      aiGenerated += stored;
      log.push(`  ${cat.name}: ${stored} questions`);
    } catch (e: any) {
      log.push(`${cat.name}: error - ${e.message.slice(0, 100)}`);
    }
  }

  totalSourced += aiGenerated;

  // ── 3. Fill remaining with curated fallback questions ──────
  if (totalSourced < questionsNeeded) {
    const remaining = questionsNeeded - totalSourced;
    const fallback = getFallbackQuestions(remaining);
    let fbStored = 0;
    for (const q of fallback) {
      const normalized = q.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
      const exists = await sql`SELECT id FROM used_questions WHERE normalized_text = ${normalized} LIMIT 1`;
      if (exists.length === 0) {
        await sql`
          INSERT INTO batch_questions (batch_id, raw_question, source_url, platform, category)
          VALUES (${batch.id}, ${q}, '', 'curated', 'general')
        `;
        await sql`INSERT INTO used_questions (question_text, normalized_text, status) VALUES (${q.slice(0, 500)}, ${normalized}, 'available') ON CONFLICT (normalized_text) DO NOTHING`;
        fbStored++;
      }
    }
    totalSourced += fbStored;
    log.push(`Fallback: ${fbStored} questions`);
  }

  return NextResponse.json({
    sourced: totalSourced,
    needed: questionsNeeded,
    pool_before: currentPool,
    pool_after: currentPool + totalSourced,
    categories: CATEGORIES.map(c => ({ name: c.name, requested: c.count })),
    log,
  });
}
