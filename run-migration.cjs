// Run migrations against production database
// Usage: railway run "node run-migration.mjs lib/db/migrations/008_dual_roles.sql"
const { Pool } = require('pg');
const fs = require('fs');

const sqlFile = process.argv[2];
if (!sqlFile) { console.error('Usage: node run-migration.mjs <sql-file>'); process.exit(1); }
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

const sql = fs.readFileSync(sqlFile, 'utf8');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`✅ Migration ${sqlFile} applied successfully`);
  } catch (e) {
    await client.query('ROLLBACK');
    // Try individual statements
    console.log('Transaction failed, running statements individually...');
    const stmts = sql.replace(/--.*$/gm, '').split(';').map(s => s.trim()).filter(s => s);
    for (const stmt of stmts) {
      try { await client.query(stmt); console.log('  ✓', stmt.substring(0, 60)); }
      catch (se) {
        if (se.message?.includes('already exists') || se.message?.includes('duplicate')) {
          console.log('  ~ skipped (exists)');
        } else {
          console.error('  ✗', se.message?.substring(0, 100));
        }
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
})();
