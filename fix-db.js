const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:tJAentCEureAxxRpzWdzWEefVRZtBEla@viaduct.proxy.rlwy.net:30489/railway', ssl: { rejectUnauthorized: false } });

(async () => {
  const client = await pool.connect();
  try {
    await client.query("INSERT INTO users (id, email, password_hash, user_type, display_name) VALUES (gen_random_uuid(), 'demo@sendmusic.io', 'hash', 'artist', 'Demo Artist') ON CONFLICT (email) DO NOTHING");
    await client.query('ALTER TABLE campaigns ALTER COLUMN artist_id DROP NOT NULL');
    console.log('✅ Fixed — demo user created, artist_id nullable');
  } finally {
    client.release();
    await pool.end();
  }
})();
