#!/usr/bin/env node
/**
 * Database Migration Runner for Selah.fm
 *
 * Reads SQL migration files from lib/db/migrations/ and applies them in order.
 * Tracks which migrations have been applied in a `_migrations` tracking table.
 *
 * Usage:
 *   node scripts/migrate.mjs           # runs all pending migrations
 *   node scripts/migrate.mjs --seed    # runs migrations + seed data
 *   node scripts/migrate.mjs --dry-run # shows what would run without executing
 *   node scripts/migrate.mjs --fresh   # drops all tables and re-runs everything
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// ── Configuration ──────────────────────────────────────────────
const MIGRATIONS_DIR = join(projectRoot, 'lib', 'db', 'migrations');
const SEED_FILE = join(projectRoot, 'lib', 'db', 'seed.sql');
const SEED_SUBMISSIONS_FILE = join(projectRoot, 'lib', 'db', 'seed_submissions.sql');
const SCHEMA_FILE = join(projectRoot, 'lib', 'db', 'schema.sql');

// ── CLI Args ───────────────────────────────────────────────────
const args = process.argv.slice(2);
const SEED_MODE = args.includes('--seed');
const DRY_RUN = args.includes('--dry-run');
const FRESH = args.includes('--fresh');
const VERBOSE = args.includes('--verbose');

// ── Database Connection ────────────────────────────────────────
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required.');
  console.error('   Set it in .env.local or export it before running.');
  console.error('   Example:');
  console.error('   export DATABASE_URL="postgresql://..."');
  console.error('   node scripts/migrate.mjs');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  max: 1, // run migrations sequentially
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 10_000,
});

// ── Helpers ────────────────────────────────────────────────────
function info(msg) {
  console.log(`  ℹ️  ${msg}`);
}

function success(msg) {
  console.log(`  ✅ ${msg}`);
}

function warn(msg) {
  console.log(`  ⚠️  ${msg}`);
}

function error(msg) {
  console.log(`  ❌ ${msg}`);
}

function divider() {
  console.log('');
}

// ── Migration Functions ────────────────────────────────────────

async function ensureTrackingTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      checksum VARCHAR(64) NOT NULL,
      duration_ms INTEGER NOT NULL DEFAULT 0
    );
  `);
}

async function getAppliedMigrations() {
  const result = await pool.query('SELECT name, checksum FROM _migrations ORDER BY name');
  return result.rows;
}

async function applyMigration(filePath) {
  const sql = readFileSync(filePath, 'utf8');
  const name = filePath.split('/').pop() || filePath.split('\\').pop();

  // Remove single-line comments and normalize
  const cleanSql = sql.replace(/--.*$/gm, '').trim();

  if (!cleanSql) {
    warn(`Migration "${name}" is empty. Skipping.`);
    return null;
  }

  const start = Date.now();

  if (DRY_RUN) {
    info(`[DRY RUN] Would apply "${name}" (${cleanSql.split(';').filter(s => s.trim()).length} statements)`);
    return { name, checksum: 'dry-run', duration_ms: 0 };
  }

  try {
    await pool.query('BEGIN');
    await pool.query(cleanSql);
    await pool.query('COMMIT');
    const duration_ms = Date.now() - start;
    success(`Applied "${name}" in ${duration_ms}ms`);
    return { name, duration_ms };
  } catch (err) {
    await pool.query('ROLLBACK');
    throw new Error(`Migration "${name}" failed: ${err.message}`);
  }
}

async function recordMigration({ name, duration_ms }) {
  if (DRY_RUN) return;

  const checksum = `${name}-${new Date().toISOString().slice(0, 10)}`;
  await pool.query(
    'INSERT INTO _migrations (name, checksum, duration_ms) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
    [name, checksum, duration_ms]
  );
}

async function applySeed(filePath, label) {
  const sql = readFileSync(filePath, 'utf8');
  const cleanSql = sql.replace(/--.*$/gm, '').trim();

  if (!cleanSql) {
    warn(`Seed file "${label}" is empty. Skipping.`);
    return;
  }

  if (DRY_RUN) {
    info(`[DRY RUN] Would apply seed: "${label}"`);
    return;
  }

  const start = Date.now();

  try {
    // Seed runs outside migration tracking — it's data, not schema
    await pool.query('BEGIN');
    await pool.query(cleanSql);
    await pool.query('COMMIT');
    success(`Applied seed data: "${label}" in ${Date.now() - start}ms`);
  } catch (err) {
    await pool.query('ROLLBACK');
    // Seed failures are non-fatal (data may already exist)
    warn(`Seed "${label}" had issues: ${err.message}`);
    warn('This is often fine if data already exists. Continuing...');
  }
}

async function verifyTables() {
  divider();
  info('Verifying database tables...');

  const result = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE '_%'
    ORDER BY table_name
  `);

  if (result.rows.length === 0) {
    warn('No user tables found.');
    return;
  }

  success(`${result.rows.length} tables exist:`);
  const tableNames = result.rows.map(r => r.table_name);
  // Print in columns
  const cols = 4;
  for (let i = 0; i < tableNames.length; i += cols) {
    const chunk = tableNames.slice(i, i + cols);
    console.log('    ' + chunk.map(t => t.padEnd(22)).join(''));
  }

  return tableNames;
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║    Selah.fm — Database Migration Runner     ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  // 1. Connect
  info('Connecting to database...');
  try {
    const client = await pool.connect();
    const dbInfo = await client.query('SELECT version()');
    success(`Connected: ${dbInfo.rows[0].version.split(',')[0]}`);
    client.release();
  } catch (err) {
    error(`Failed to connect: ${err.message}`);
    process.exit(1);
  }

  divider();

  // 2. Fresh mode: drop everything
  if (FRESH) {
    warn('FRESH MODE: Dropping ALL tables...');
    if (!DRY_RUN) {
      const dropResult = await pool.query(`
        DO $$ DECLARE
          r RECORD;
        BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
        END $$;
      `);
      success('All tables dropped.');
    } else {
      info('[DRY RUN] Would drop all tables');
    }
    divider();
  }

  // 3. Ensure tracking table
  info('Ensuring migration tracking table...');
  await ensureTrackingTable();
  success('Tracking table ready.');
  divider();

  // 4. Get applied migrations
  let applied = [];
  try {
    applied = await getAppliedMigrations();
    const appliedNames = applied.map(a => a.name);
    if (appliedNames.length > 0) {
      info(`Previously applied: ${appliedNames.join(', ')}`);
    } else {
      info('No previous migrations found. Starting fresh.');
    }
  } catch (err) {
    warn(`Could not read applied migrations: ${err.message}`);
    info('Starting from scratch.');
    applied = [];
  }

  divider();

  // 5. List and apply migrations
  const migrationFiles = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    warn('No migration files found!');
    process.exit(1);
  }

  info(`Found ${migrationFiles.length} migration files`);

  const appliedNames = applied.map(a => a.name);
  const pending = migrationFiles.filter(f => !appliedNames.includes(f));
  const alreadyApplied = migrationFiles.filter(f => appliedNames.includes(f));

  if (alreadyApplied.length > 0) {
    info(`${alreadyApplied.length} already applied: ${alreadyApplied.join(', ')}`);
  }

  if (pending.length === 0) {
    success('All migrations are already applied!');
  } else {
    info(`Pending: ${pending.join(', ')}`);
    divider();

    for (const file of pending) {
      const filePath = join(MIGRATIONS_DIR, file);

      try {
        const result = await applyMigration(filePath);
        if (result) {
          await recordMigration(result);
        }
      } catch (err) {
        error(err.message);
        error('Migration aborted. Fix the issue and re-run.');
        await pool.end();
        process.exit(1);
      }
    }

    divider();
    success(`All ${pending.length} pending migrations applied successfully!`);
  }

  // 6. Seed data (if --seed flag)
  if (SEED_MODE) {
    divider();
    info('Seeding database...');
    divider();

    await applySeed(SEED_FILE, 'seed.sql');
    await applySeed(SEED_SUBMISSIONS_FILE, 'seed_submissions.sql');
    divider();
    success('Seed data applied.');
  }

  // 7. Verify
  divider();
  const tables = await verifyTables();

  // 8. Summary
  divider();
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║               Migration Complete            ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  if (tables) {
    // Check for key tables
    const keyTables = ['users', 'campaigns', 'artists', 'submissions', 'discovered_artists', 'outreach_log'];
    const missing = keyTables.filter(t => !tables.includes(t));
    if (missing.length > 0) {
      warn(`Key tables missing: ${missing.join(', ')}`);
    } else {
      success('All key tables present!');
    }
  }

  await pool.end();
  process.exit(0);
}

main().catch(err => {
  error(`Unexpected error: ${err.message}`);
  console.error(err);
  pool.end().finally(() => process.exit(1));
});
