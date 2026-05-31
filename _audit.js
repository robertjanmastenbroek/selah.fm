const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.SUPABASE_DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  console.log("CURRENT UTC TIME:", new Date().toISOString());
  console.log();

  // Each cron: check the most relevant evidence table
  const checks = [
    ["email-outreach", "SELECT MAX(created_at)::text, COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::int AS last_24h FROM outreach_log WHERE channel = 'email'"],
    ["creator-outreach", "SELECT MAX(created_at)::text, COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::int AS last_24h FROM creator_outreach_log"],
    ["outreach-pipeline (discovered)", "SELECT MAX(created_at)::text, COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::int AS last_24h FROM discovered_artists"],
    ["outreach-pipeline (audits)", "SELECT MAX(audited_at)::text, COUNT(*) FILTER (WHERE audited_at > NOW() - INTERVAL '24 hours')::int AS last_24h FROM artist_audits WHERE audited_at IS NOT NULL"],
    ["outreach-pipeline (campaigns)", "SELECT MAX(claimed_at)::text, COUNT(*) FILTER (WHERE claimed_at > NOW() - INTERVAL '24 hours')::int AS last_24h FROM campaign_claims WHERE claimed_at IS NOT NULL"],
    ["creator-discovery", "SELECT MAX(created_at)::text, COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::int AS last_24h FROM discovered_creators"],
    ["outreach-followup", "SELECT MAX(created_at)::text, COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS last_7d FROM outreach_log WHERE message_type = 'followup'"],
    ["welcome-sequence", "SELECT MAX(created_at)::text, COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::int AS last_24h FROM outreach_log WHERE message_type = 'welcome'"],
    ["reengage", "SELECT MAX(created_at)::text, COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::int AS last_24h FROM outreach_log WHERE message_type = 'reengage'"],
    ["blog-pipeline (posts)", "SELECT MAX(created_at)::text, COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::int AS last_24h FROM blog_posts"],
    ["blog-publish", "SELECT MAX(published_at)::text, COUNT(*) FILTER (WHERE published_at > NOW() - INTERVAL '7 days')::int AS last_7d FROM blog_posts WHERE status = 'published'"],
    ["reaudit_emails", "SELECT MAX(audited_at)::text FROM artist_audits WHERE audited_at > NOW() - INTERVAL '3 hours'"],
  ];

  for (const [name, sql] of checks) {
    try {
      const r = await pool.query(sql);
      const row = r.rows[0];
      console.log(name + ":");
      console.log("  Last activity:", row.max || 'NULL');
      const recent = row.last_24h !== undefined ? row.last_24h : row.last_7d !== undefined ? row.last_7d : '?';
      console.log("  Recent count:", recent);
      console.log("");
    } catch(e) { console.log(name + ": ERROR - " + e.message.slice(0,80) + "\n"); }
  }

  await pool.end();
})();
