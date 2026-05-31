const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.SUPABASE_DATABASE_URL, ssl: { rejectUnauthorized: false } });
(async () => {
  const r = await pool.query("SELECT id, questions, answers, status FROM batch_interviews WHERE questions IS NOT NULL LIMIT 3");
  console.log("Interviews with questions:");
  for (const row of r.rows) {
    console.log("ID:", row.id, "Status:", row.status);
    console.log("Questions:", JSON.stringify(row.questions).slice(0, 300));
    console.log("---");
  }
  await pool.end();
})();
