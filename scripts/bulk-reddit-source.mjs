/**
 * Bulk Reddit question sourcing — one-time run to seed the database with 500-1000
 * real questions people are asking about music promotion, creator earnings, etc.
 *
 * Usage: node scripts/bulk-reddit-source.mjs
 * Requires DATABASE_URL in .env.local
 */

import pg from 'pg';

// Env loaded via --env-file flag: node --env-file=.env.local scripts/bulk-reddit-source.mjs
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Subreddits to source from ──────────────────────────────────────
const SUBREDDITS = [
  // Music promotion + marketing
  'musicmarketing', 'wearethemusicmakers', 'musicians',
  'makinghiphop', 'edmproduction', 'songwriting',
  'indieheads', 'musicbusiness', 'musicproduction',
  'audioengineering',
  // Creator economy
  'creators', 'tiktokhelp', 'instagrammarketing',
  'newtubers', 'youtubers', 'socialmedia',
  'contentcreation', 'videography',
  // Platforms
  'spotify', 'soundcloud', 'bandcamp',
  // Business side
  'entrepreneur', 'sidehustle', 'passiveincome',
  'digitalnomad', 'smallbusiness',
  // Faith/meaning (pillar 6)
  'christianmusic', 'worshipleaders',
];

// ── Question detection ────────────────────────────────────────────
function isQuestion(title) {
  if (!title || title.length < 20 || title.length > 200) return false;
  if (title.endsWith('?')) return true;
  return /^(how|what|why|where|when|who|can|should|do|does|is|are|has|have|will|would|any|anyone|am i|has anyone|does anyone|which|could)/i.test(title);
}

function normalizeQuestion(title) {
  return title.endsWith('?') ? title : title + '?';
}

function categorizeQuestion(title, subreddit) {
  const t = title.toLowerCase();
  // Creator income / earnings
  if (subreddit === 'tiktokhelp' || subreddit === 'newtubers' || subreddit === 'youtubers' ||
      /earn|income|money|pay|payout|fund|monetiz|revenue|CPM|sponsor|brand deal/.test(t)) {
    return 'creator_income';
  }
  // Music promotion / marketing
  if (/promot|market|advertis|grow audience|get heard|get notice|gain follower|get follower/i.test(t)) {
    return 'music_promotion';
  }
  // Platform strategy
  if (/tiktok|reel|short|youtube|instagram|platform|algorithm|viral/i.test(t)) {
    return 'platform_strategy';
  }
  // CPM / campaign mechanics
  if (/CPM|cost per|budget|rate|per view|per 1000|campaign/i.test(t)) {
    return 'cpm_mechanics';
  }
  // Music production / creation
  if (/produc|mix|master|record|DAW|plugin|sample|synth|beat|chord|melody/i.test(t)) {
    return 'music_production';
  }
  // General artist questions
  if (subreddit === 'wearethemusicmakers' || subreddit === 'musicians' ||
      subreddit === 'makinghiphop' || subreddit === 'edmproduction' ||
      subreddit === 'songwriting' || subreddit === 'indieheads' ||
      subreddit === 'musicbusiness') {
    return 'artist_life';
  }
  return 'general';
}

// ── Reddit scraping with pagination ───────────────────────────────
async function fetchSubreddit(sub, sort, after = null) {
  const timeFilter = sort === 'top' ? '&t=month' : '';
  const afterParam = after ? `&after=${after}` : '';
  const url = `https://www.reddit.com/r/${sub}/${sort}.json?limit=100${timeFilter}${afterParam}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Selah.fm Blog Bot/2.0 (bulk sourcing)' },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const posts = data?.data?.children || [];
  const nextAfter = data?.data?.after || null;

  const questions = [];
  for (const post of posts) {
    const title = post.data?.title || '';
    if (isQuestion(title)) {
      questions.push({
        question: normalizeQuestion(title),
        url: `https://reddit.com${post.data.permalink}`,
        upvotes: post.data?.ups || 0,
        num_comments: post.data?.num_comments || 0,
      });
    }
  }

  return { questions, after: nextAfter };
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log('🔍 Bulk Reddit question sourcing');
  console.log(`   Targeting ${SUBREDDITS.length} subreddits across hot/new/top sorts\n`);

  const allQuestions = [];
  const seen = new Set(); // dedup by normalized question text

  for (const sub of SUBREDDITS) {
    for (const sort of ['hot', 'new', 'top']) {
      try {
        // Small delay to respect Reddit rate limits
        await new Promise(r => setTimeout(r, 1200));

        const { questions, after } = await fetchSubreddit(sub, sort);
        let added = 0;
        for (const q of questions) {
          const key = q.question.toLowerCase().trim();
          if (!seen.has(key)) {
            seen.add(key);
            q.subreddit = sub;
            q.category = categorizeQuestion(q.question, sub);
            allQuestions.push(q);
            added++;
          }
        }
        if (added > 0) {
          console.log(`  r/${sub} (${sort}): +${added} questions (${allQuestions.length} total)`);
        }

        // Paginate: fetch second page for hot/top
        if (after && allQuestions.length < 800) {
          await new Promise(r => setTimeout(r, 1200));
          const page2 = await fetchSubreddit(sub, sort, after);
          let p2added = 0;
          for (const q of page2.questions) {
            const key = q.question.toLowerCase().trim();
            if (!seen.has(key)) {
              seen.add(key);
              q.subreddit = sub;
              q.category = categorizeQuestion(q.question, sub);
              allQuestions.push(q);
              p2added++;
            }
          }
          if (p2added > 0) {
            console.log(`  r/${sub} (${sort} p2): +${p2added} questions (${allQuestions.length} total)`);
          }
        }

        // Stop if we have enough
        if (allQuestions.length >= 800) break;
      } catch (e) {
        // Skip silently — Reddit rate limits some subreddits
      }
    }
    if (allQuestions.length >= 800) {
      console.log(`\n  Target reached (${allQuestions.length} questions). Stopping.`);
      break;
    }
  }

  console.log(`\n📊 Sourced ${allQuestions.length} unique questions\n`);

  // ── Category breakdown ──────────────────────────────────────────
  const byCategory = {};
  for (const q of allQuestions) {
    byCategory[q.category] = (byCategory[q.category] || 0) + 1;
  }
  console.log('Category breakdown:');
  for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count} questions`);
  }

  // ── Top questions by upvotes ────────────────────────────────────
  console.log('\n🔥 Top 20 questions by upvotes:');
  const topByVotes = [...allQuestions].sort((a, b) => b.upvotes - a.upvotes).slice(0, 20);
  topByVotes.forEach((q, i) => {
    console.log(`  ${i + 1}. [${q.upvotes}↑] r/${q.subreddit} — ${q.question.slice(0, 80)}...`);
  });

  // ── Store in database ───────────────────────────────────────────
  console.log('\n💾 Storing in database...');

  // Create a bulk sourcing batch
  const batchMonth = new Date().toISOString().slice(0, 7);
  const { rows: [batch] } = await pool.query(
    `INSERT INTO batches (month_year, status) VALUES ($1, 'bulk_sourced') RETURNING id`,
    [batchMonth]
  );
  console.log(`  Batch: ${batch.id.slice(0, 8)}`);

  // Insert in chunks of 50
  const chunkSize = 50;
  let stored = 0;
  for (let i = 0; i < allQuestions.length; i += chunkSize) {
    const chunk = allQuestions.slice(i, i + chunkSize);
    const values = [];
    const params = [];
    chunk.forEach((q, j) => {
      const base = j * 5;
      values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
      params.push(batch.id, q.question, q.url, q.subreddit, q.category);
    });
    await pool.query(
      `INSERT INTO batch_questions (batch_id, raw_question, source_url, platform, category) VALUES ${values.join(', ')}`,
      params
    );
    stored += chunk.length;
    console.log(`  Stored ${stored}/${allQuestions.length}...`);
  }

  console.log(`\n✅ Done! ${stored} questions stored in batch ${batch.id.slice(0, 8)}`);
  console.log(`   Category: ${batchMonth}, Status: bulk_sourced`);
  console.log(`\n   These questions are now available for the blog pipeline to use.`);
  console.log(`   The pipeline will source from them (platform='reddit' or subreddit name)`);

  await pool.end();
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
