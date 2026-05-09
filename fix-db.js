#!/usr/bin/env node
/**
 * Selah.fm — Database Fix Utility
 * Usage: node fix-db.js [DATABASE_URL]
 * 
 * DO NOT hardcode credentials here.
 * Set DATABASE_URL in your environment or pass as argument.
 */
const { Pool } = require('pg');

const DB_URL = process.argv[2] || process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('Usage: node fix-db.js <DATABASE_URL>');
  console.error('   or: DATABASE_URL=postgresql://... node fix-db.js');
  process.exit(1);
}

const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  const client = await pool.connect();
  try {
    await client.query("INSERT INTO users (id, email, password_hash, user_type, display_name) VALUES (gen_random_uuid(), 'demo@sendmusic.io', 'hash', 'artist', 'Demo Artist') ON CONFLICT (email) DO NOTHING");
    await client.query('ALTER TABLE campaigns ALTER COLUMN artist_id DROP NOT NULL');
    console.log('✅ Fixed — demo user created, artist_id nullable');
  } catch (e) {
    console.error('❌', e.message);
  } finally {
    client.release();
    await pool.end();
  }
})();
