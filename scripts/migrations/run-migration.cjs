const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.SUPABASE_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    // Run schema migration
    console.log('=== Running 001_social_tables.sql ===');
    const schemaSql = fs.readFileSync(path.join(__dirname, '001_social_tables.sql'), 'utf-8');
    await pool.query(schemaSql);
    console.log('Schema migration complete.\n');

    // Verify tables exist
    const tables = ['page_comments', 'comment_likes', 'submission_reactions', 'activity_events'];
    for (const t of tables) {
      const { rows } = await pool.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
        [t]
      );
      console.log(`  ${t}: ${rows[0].exists ? '✅' : '❌'}`);
    }

    // Run data migration
    console.log('\n=== Running 002_artist_backfill.sql ===');
    const dataSql = fs.readFileSync(path.join(__dirname, '002_artist_backfill.sql'), 'utf-8');
    await pool.query(dataSql);
    console.log('Data migration complete.\n');

    // Verify backfill
    const { rows: missing } = await pool.query(`
      SELECT COUNT(*)::int as count FROM discovered_artists da
      LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
      WHERE ap.artist_id IS NULL
    `);
    console.log(`Artists without profiles after backfill: ${missing[0].count}`);

    // Check for slug collisions
    const { rows: collisions } = await pool.query(`
      SELECT slug, COUNT(*) as count FROM artist_profiles
      GROUP BY slug HAVING COUNT(*) > 1
    `);
    console.log(`Slug collisions: ${collisions.length}`);
    if (collisions.length > 0) {
      console.log('Collisions:', collisions.slice(0, 5).map(r => `${r.slug} (${r.count})`).join(', '));
    }

    // Count stats
    const { rows: counts } = await pool.query(`
      SELECT 'page_comments' as tbl, COUNT(*)::int as cnt FROM page_comments
      UNION ALL SELECT 'comment_likes', COUNT(*) FROM comment_likes
      UNION ALL SELECT 'submission_reactions', COUNT(*) FROM submission_reactions
      UNION ALL SELECT 'activity_events', COUNT(*) FROM activity_events
      UNION ALL SELECT 'artist_profiles', COUNT(*) FROM artist_profiles
    `);
    console.log('\n=== Final Counts ===');
    counts.forEach(r => console.log(`  ${r.tbl}: ${r.cnt}`));

    await pool.end();
    console.log('\n✅ Phase 0 complete');
  } catch (e) {
    console.error('Migration error:', e.message);
    process.exit(1);
  }
}

run();
