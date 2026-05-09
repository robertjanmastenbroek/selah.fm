const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DB_URL = process.argv[2] || process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('Usage: node migrate.js <postgresql://...>');
  process.exit(1);
}

async function main() {
  const pool = new Pool({ connectionString: DB_URL });
  const client = await pool.connect();
  
  const schemaPath = path.join(__dirname, 'lib', 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  console.log('Running schema...\n');

  try {
    await client.query('BEGIN');
    await client.query(schema);
    await client.query('COMMIT');
    console.log('✅ Schema migrated successfully!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.log('Transaction failed, running statements individually...\n');
    
    const statements = schema
      .replace(/--.*$/gm, '')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    let ok = 0, skipped = 0, failed = 0;
    
    for (const stmt of statements) {
      try {
        await client.query(stmt);
        ok++;
      } catch (se) {
        if (se.message?.includes('already exists') || se.message?.includes('duplicate') || se.message?.includes('syntax error')) {
          skipped++;
        } else {
          console.error('❌', stmt.substring(0, 80).replace(/\n/g, ' '), se.message?.substring(0, 100));
          failed++;
        }
      }
    }
    
    console.log(`\nDone: ${ok} created, ${skipped} skipped, ${failed} failed`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
