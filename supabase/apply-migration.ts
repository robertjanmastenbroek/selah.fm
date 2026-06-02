/**
 * One-time script to apply RLS migration 20260602120000_rls_auto_enable.sql
 * Run with: npx ts-node --compiler-options '{"module":"commonjs"}' supabase/apply-migration.ts
 * 
 * Or more simply: read the SQL and execute via sql.raw
 */

import sql from '../lib/db';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const migrationPath = path.join(__dirname, 'migrations', '20260602120000_rls_auto_enable.sql');
  const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

  console.log('Applying migration: 20260602120000_rls_auto_enable.sql');
  console.log(`SQL length: ${sqlContent.length} chars`);

  try {
    // Split by semicolons but respect dollar-quoted strings ($$...$$)
    // Simple approach: execute the whole thing — pg Pool handles multi-statement queries
    await sql.raw(sqlContent);
    console.log('Migration applied successfully.');
  } catch (err: any) {
    // Event triggers may error if they already exist — that's OK
    if (err.message?.includes('already exists')) {
      console.log('Some objects already exist (idempotent — this is OK).');
    } else if (err.message?.includes('must be superuser')) {
      console.error('ERROR: Need superuser privileges to create event triggers.');
      console.error('Run this SQL in the Supabase Dashboard SQL Editor instead.');
      console.error('File:', migrationPath);
    } else {
      console.error('Migration error:', err.message);
      throw err;
    }
  }

  // Verify the trigger was created
  const triggers = await sql`SELECT evtname FROM pg_event_trigger WHERE evtname = 'auto_enable_rls_trigger'`;
  if (triggers.length > 0) {
    console.log('✅ auto_enable_rls_trigger is active.');
  } else {
    console.log('⚠️  auto_enable_rls_trigger was NOT created. You may need to run this in the Supabase Dashboard.');
  }

  // Count tables with RLS enabled vs total
  const rlsStatus = await sql`
    SELECT 
      COUNT(*) FILTER (WHERE relrowsecurity = true) as rls_enabled,
      COUNT(*) as total_tables
    FROM pg_class 
    WHERE relnamespace = 'public'::regnamespace 
      AND relkind = 'r'
  `;
  console.log(`RLS status: ${rlsStatus[0].rls_enabled}/${rlsStatus[0].total_tables} tables have RLS enabled.`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
