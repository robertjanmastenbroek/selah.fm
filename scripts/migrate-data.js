// Migrate data from Neon to Supabase
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const NEON_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_DATABASE_URL;

if (!NEON_URL || !SUPABASE_URL) {
  console.error('Missing connection strings');
  process.exit(1);
}

const neon = new Pool({ connectionString: NEON_URL, ssl: { rejectUnauthorized: false }, max: 2 });
const sb = new Pool({ connectionString: SUPABASE_URL, ssl: { rejectUnauthorized: false }, max: 2 });

async function migrate() {
  // Step 1: Drop FK constraint on users (temporarily)
  console.log('Dropping users FK constraint...');
  await sb.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey`);

  // Step 2: Migrate users (skip password_hash — Supabase Auth handles passwords)
  console.log('\nMigrating users...');
  const { rows: neonUsers } = await neon.query(`SELECT COUNT(*) as cnt FROM users`);
  const userCount = parseInt(neonUsers[0].cnt);
  console.log(`Neon has ${userCount} users`);

  const { rows: sbUserCount } = await sb.query(`SELECT COUNT(*) as cnt FROM users`);
  const existingUsers = parseInt(sbUserCount[0].cnt);
  console.log(`Supabase has ${existingUsers} users`);

  if (existingUsers === 0 && userCount > 0) {
    // Get all users from Neon
    const { rows: users } = await neon.query(`SELECT * FROM users`);
    
    // Columns in Supabase users table (no password_hash)
    const userCols = ['id', 'email', 'user_type', 'is_artist', 'is_creator', 'display_name',
      'tiktok_handle', 'instagram_handle', 'youtube_handle', 'facebook_handle',
      'bio', 'genres', 'preferred_cpm_cents', 'profile_image_url', 'acceptance_rate',
      'stripe_customer_id', 'stripe_connect_id', 'created_at', 'updated_at'];
    
    let inserted = 0;
    for (const u of users) {
      try {
        const vals = userCols.map(c => u[c] || null);
        const ph = vals.map((_, i) => `$${i + 1}`).join(', ');
        await sb.query(`INSERT INTO users (${userCols.join(',')}) VALUES (${ph}) ON CONFLICT (id) DO NOTHING`, vals);
        inserted++;
      } catch (e) {
        // skip
      }
    }
    console.log(`Users: ${inserted}/${userCount} ✓`);
  } else {
    console.log('Users: skipped (already exists)');
  }

  // Step 3: Migrate all other tables
  const TABLES = [
    'campaigns', 'submissions', 'view_snapshots', 'payouts', 'referrals',
    'campaign_donations', 'notifications', 'messages', 'ratings', 'bugs',
    'live_ticker_events', 'email_logs', 'inbound_emails', 'support_chats',
    'keyword_buckets', 'discovered_artists', 'artist_audits', 'outreach_log',
    'campaign_claims', 'campaign_images', 'batches', 'batch_questions',
    'batch_interviews', 'voice_chunks', 'blog_posts', 'used_questions',
  ];

  for (const table of TABLES) {
    try {
      const { rows: cntRows } = await neon.query(`SELECT COUNT(*) as cnt FROM ${table}`);
      const count = parseInt(cntRows[0].cnt);
      if (count === 0) { console.log(`${table}: 0 rows`); continue; }

      const { rows: sbCnt } = await sb.query(`SELECT COUNT(*) as cnt FROM ${table}`);
      if (parseInt(sbCnt[0].cnt) > 0) { console.log(`${table}: already populated`); continue; }

      const { rows: data } = await neon.query(`SELECT * FROM ${table}`);
      if (data.length === 0) continue;

      const columns = Object.keys(data[0]);
      const ph = columns.map((_, i) => `$${i + 1}`).join(', ');
      const colStr = columns.join(', ');

      let inserted = 0;
      for (const row of data) {
        try {
          const vals = columns.map(c => row[c]);
          await sb.query(`INSERT INTO ${table} (${colStr}) VALUES (${ph}) ON CONFLICT DO NOTHING`, vals);
          inserted++;
        } catch {}
      }
      console.log(`${table}: ${inserted}/${count} ✓`);
    } catch (e) {
      console.log(`${table}: ${e.message}`);
    }
  }

  // Step 4: Re-add FK constraint
  console.log('\nRe-adding users FK...');
  try {
    await sb.query(`ALTER TABLE users ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID`);
  } catch {}

  await neon.end();
  await sb.end();
  console.log('Done.');
}

migrate().catch(e => { console.error(e); process.exit(1); });
