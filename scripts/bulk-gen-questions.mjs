/**
 * Bulk question generation via DeepSeek API — generates 500+ real, high-traffic
 * questions that musicians and creators ask online, organized by content pillar.
 *
 * Usage: node --env-file=.env.local scripts/bulk-gen-questions.mjs
 * Requires DEEPSEEK_API_KEY and DATABASE_URL in .env.local
 */

import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE = 'https://api.deepseek.com/v1';

// ── Content pillars with target keywords (weighted by traffic potential) ──
const PILLARS = [
  // PRIORITY 1: Creator Income — highest traffic, ChatGPT-friendly, we have unique data
  {
    category: 'creator_income',
    keywords: ['get paid for TikTok views', 'creator CPM rates', 'earn making short videos', 'content creator income', 'monetize short form video', 'how much does TikTok pay'],
    description: 'How content creators earn money from short-form video. TikTok Creator Fund vs Creativity Program, CPM rates, platform fund comparisons, making a living as a creator without millions of followers.',
    count: 150,
  },
  // PRIORITY 2: Music Promotion — core product, high long-tail volume
  {
    category: 'music_promotion',
    keywords: ['promote music without label', 'independent artist promotion', 'music marketing strategy', 'get music heard', 'promote song on budget'],
    description: 'How independent artists promote music without a record label. Budget-friendly strategies, getting heard from zero, finding your first fans.',
    count: 140,
  },
  // PRIORITY 3: Platform Strategy — growing, low competition on specific questions
  {
    category: 'platform_strategy',
    keywords: ['TikTok vs Reels for music', 'YouTube Shorts monetization', 'best platform for musicians', 'social media algorithm music', 'why do my TikTok videos stop getting views', 'shadowban music'],
    description: 'Platform strategy for musicians and creators. TikTok vs Instagram vs YouTube, algorithm behavior, shadowbanning, cross-platform promotion, posting strategies.',
    count: 110,
  },
  // PRIORITY 4: Creator Marketplace — direct product alignment, zero competition
  {
    category: 'creator_marketplace',
    keywords: ['UGC music promotion', 'hire content creators', 'creator marketplace music', 'find TikTok creators music', 'cost to hire UGC creator'],
    description: 'Creator marketplace model. How artists find and hire creators, UGC vs influencer marketing, campaign management, pricing, vetting creators, briefing.',
    count: 90,
  },
  // PRIORITY 5: CPM Mechanics — high commercial intent, calculator tie-in
  {
    category: 'cpm_mechanics',
    keywords: ['CPM music promotion', 'cost per view marketing', 'pay per view promotion', 'campaign budget CPM', 'ROI music promotion', 'how CPM works'],
    description: 'How CPM-based music promotion works. Setting rates, calculating ROI, comparing CPM to traditional advertising, budgeting strategies.',
    count: 70,
  },
  // PRIORITY 6: Artist Business — high intent but competitive
  {
    category: 'artist_business',
    keywords: ['make money as musician', 'music business independent', 'artist revenue streams', 'music royalties explained', 'build music career', 'Spotify royalties'],
    description: 'The business side of being an independent artist. Revenue streams, royalties, publishing, building a sustainable career, sync licensing.',
    count: 60,
  },
  // NEW: AI Music Tools — exploding search volume in 2025
  {
    category: 'ai_music',
    keywords: ['AI music generator', 'Suno AI music', 'AI music promotion', 'AI tools for musicians', 'Udio AI'],
    description: 'AI tools for music creation and promotion. Suno, Udio, AI mastering, AI lyric generators, AI video creation for music, ethical concerns.',
    count: 60,
  },
  // NEW: YouTube for Musicians (not just Shorts)
  {
    category: 'youtube_musicians',
    keywords: ['YouTube channel for musicians', 'YouTube music promotion', 'YouTube algorithm music', 'YouTube music video strategy', 'grow YouTube music channel'],
    description: 'YouTube strategy for musicians. Channel growth, video SEO, YouTube algorithm for music content, monetization beyond Shorts, building a subscriber base.',
    count: 50,
  },
  // NEW: Fan Engagement & Community Building
  {
    category: 'fan_engagement',
    keywords: ['build fan community', 'Discord for musicians', 'email list musicians', 'fan engagement strategy', 'convert listeners to fans'],
    description: 'Fan engagement and community building. Discord servers, email marketing, converting listeners to superfans, community management for musicians.',
    count: 50,
  },
  // NEW: Paid Ads for Music
  {
    category: 'paid_ads',
    keywords: ['Facebook ads musicians', 'TikTok Spark Ads music', 'Meta ads music promotion', 'best ad platform musicians', 'music ad strategy'],
    description: 'Paid advertising for music promotion. Facebook/Instagram ads, TikTok Spark Ads, YouTube ads, budget optimization, targeting, retargeting.',
    count: 50,
  },
  // NEW: Spotify for Artists
  {
    category: 'spotify_artists',
    keywords: ['Spotify for Artists tips', 'Spotify pitch template', 'Spotify Discovery Mode', 'Spotify playlist pitching', 'Spotify algorithmic playlists'],
    description: 'Spotify for Artists optimization. Pitching to editorial playlists, Discovery Mode, algorithmic playlists (Release Radar, Discover Weekly), profile optimization.',
    count: 40,
  },
  // NEW: Live Streaming
  {
    category: 'live_streaming',
    keywords: ['Twitch for musicians', 'live stream music', 'TikTok Live music', 'streaming concerts', 'virtual concert setup'],
    description: 'Live streaming for musicians. Twitch music, TikTok Live, YouTube Live, virtual concerts, gear setup, monetizing live streams.',
    count: 30,
  },
];

async function chat(messages, options = {}) {
  const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: options.temperature ?? 0.9,
      max_tokens: options.max_tokens ?? 4000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function generateQuestionsForPillar(pillar) {
  const prompt = `You are an SEO expert who knows exactly what questions musicians, content creators, and independent artists ask on Reddit, Google, YouTube, and TikTok.

TOPIC: ${pillar.description}
TARGET KEYWORDS: ${pillar.keywords.join(', ')}

Generate ${pillar.count} real, high-traffic questions that people in this topic area ask. These should be:
- Questions that someone would actually type into Google or ask on Reddit
- Mix of beginner questions, intermediate strategy questions, and advanced/business questions
- At least 40% should be questions someone with NO knowledge would ask, 40% intermediate, 20% advanced
- Include specific numbers, platforms, and tools in questions where natural
- Questions should be 20-160 characters long
- Some questions should reference specific years ("in 2025", "in 2026")
- Some should be comparison questions ("X vs Y", "better than")
- Some should be "how to" questions
- Some should be "what is" questions
- Some should be problem-focused ("why isn't my...", "how do I fix...")

Return ONLY a JSON array of strings. No explanation, no numbering, just the array.

Example format:
["How do I promote my first single with zero budget in 2025?","What's the best platform for music discovery — TikTok or Instagram Reels?","Why do my TikTok videos get 200 views then stop?"]`;

  const response = await chat([
    { role: 'system', content: 'You generate SEO-optimized questions that real people ask online. Return ONLY a JSON array of strings.' },
    { role: 'user', content: prompt },
  ], { temperature: 0.9, max_tokens: 4000 });

  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    }
    // Fallback: extract line by line
    return response.split('\n')
      .map(l => l.replace(/^\d+\.\s*["']?/, '').replace(/["']$/, '').trim())
      .filter(l => l.length > 15 && l.length < 200);
  } catch (e) {
    console.error(`  Parse error: ${e.message}`);
    return [];
  }
}

async function main() {
  console.log('🧠 Generating bulk questions via DeepSeek\n');

  const allQuestions = [];
  const seen = new Set();

  for (const pillar of PILLARS) {
    console.log(`  📋 ${pillar.category}: targeting ${pillar.count} questions...`);
    
    // Generate in batches of ~40 to avoid token limits
    const batchCount = Math.ceil(pillar.count / 40);
    let generated = 0;

    for (let b = 0; b < batchCount; b++) {
      const batchSize = Math.min(40, pillar.count - generated);
      const batchPillar = { ...pillar, count: batchSize };
      
      try {
        const qs = await generateQuestionsForPillar(batchPillar);
        let added = 0;
        for (const q of qs) {
          const key = q.toLowerCase().trim();
          if (!seen.has(key) && key.length > 15 && key.length < 200) {
            seen.add(key);
            allQuestions.push({ question: q, category: pillar.category });
            added++;
          }
        }
        generated += added;
        console.log(`    Batch ${b + 1}: generated ${added} unique (${generated} total for ${pillar.category})`);
      } catch (e) {
        console.error(`    Batch ${b + 1} error: ${e.message}`);
      }
      
      // Small delay between API calls
      if (generated < pillar.count) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
    
    console.log(`    ✅ ${pillar.category}: ${generated} questions stored\n`);
  }

  console.log(`\n📊 Total unique questions: ${allQuestions.length}\n`);

  // ── Category breakdown ──────────────────────────────────────────
  const byCategory = {};
  for (const q of allQuestions) {
    byCategory[q.category] = (byCategory[q.category] || 0) + 1;
  }
  console.log('Category breakdown:');
  for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }

  // ── Sample questions ────────────────────────────────────────────
  console.log('\n📝 Sample questions:');
  const samples = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 15);
  samples.forEach((q, i) => {
    console.log(`  ${i + 1}. [${q.category}] ${q.question}`);
  });

  // ── Store in database ───────────────────────────────────────────
  console.log('\n💾 Storing in database...');

  const batchMonth = new Date().toISOString().slice(0, 7);
  const { rows: [batch] } = await pool.query(
    `INSERT INTO batches (month_year, status) VALUES ($1, 'ai_sourced') RETURNING id`,
    [batchMonth]
  );
  console.log(`  Batch: ${batch.id.slice(0, 8)}`);

  const chunkSize = 50;
  let stored = 0;
  for (let i = 0; i < allQuestions.length; i += chunkSize) {
    const chunk = allQuestions.slice(i, i + chunkSize);
    const values = [];
    const params = [];
    chunk.forEach((q, j) => {
      const base = j * 5;
      values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
      params.push(batch.id, q.question, '', 'deepseek-generated', q.category);
    });
    await pool.query(
      `INSERT INTO batch_questions (batch_id, raw_question, source_url, platform, category) VALUES ${values.join(', ')}`,
      params
    );
    stored += chunk.length;
  }

  console.log(`\n✅ Done! ${stored} questions stored in batch ${batch.id.slice(0, 8)}`);
  console.log(`   Source: deepseek-generated, Category: ${batchMonth}`);

  await pool.end();
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
