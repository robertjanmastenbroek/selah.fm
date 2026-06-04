import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Admin migration endpoint.
 * - Without ?file=: runs essential inline migrations (legacy)
 * - With ?file=NAME: runs a specific migration file
 * - With ?list=true: lists all migration files
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Auth: admin session OR CRON_SECRET
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  const cronSecret = process.env.CRON_SECRET;
  if (!(await isAdminRequest(request)) && !(cronSecret && secret === cronSecret)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const fileFilter = searchParams.get('file') || '';
  const listOnly = searchParams.get('list') === 'true';

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

  // List mode
  if (listOnly) {
    try {
      const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
      return NextResponse.json({ migrations: files, total: files.length });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // Run a specific file-based migration
  if (fileFilter) {
    try {
      const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
      const match = files.find(f => f.includes(fileFilter));
      if (!match) return NextResponse.json({ error: `Migration "${fileFilter}" not found` }, { status: 404 });

      const sqlContent = readFileSync(path.join(migrationsDir, match), 'utf-8');
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      let executed = 0;
      const errors: string[] = [];
      for (const stmt of statements) {
        try { await sql.raw(stmt); executed++; }
        catch (e: any) { errors.push(`${stmt.slice(0, 60)}...: ${e.message}`); }
      }

      return NextResponse.json({ migration: match, statements: statements.length, executed, errors: errors.length > 0 ? errors : undefined });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // Default: run essential inline migrations (legacy tables)
  const results: string[] = [];

  // ── Core platform tables (idempotent, IF NOT EXISTS) ──
  const coreMigrations = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook_handle TEXT`,
    `CREATE TABLE IF NOT EXISTS notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id), type TEXT NOT NULL CHECK (type IN ('submission','approval','rejection','earning','payout','system')), message TEXT NOT NULL, read BOOLEAN NOT NULL DEFAULT false, link TEXT, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE read = false`,
    `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS required_hashtags TEXT`,
    `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ`,
    `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'`,
    `ALTER TABLE submissions ADD COLUMN IF NOT EXISTS rejection_feedback TEXT`,
    `CREATE TABLE IF NOT EXISTS bugs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE SET NULL, description TEXT NOT NULL, steps_to_reproduce TEXT, severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')), status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','fixed','closed')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
    `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_unclaimed BOOLEAN DEFAULT false`,
    `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS claimed_by_user_id UUID REFERENCES users(id)`,
    `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ`,
    `ALTER TABLE artist_profiles ADD COLUMN IF NOT EXISTS balance_cents INTEGER DEFAULT 0`,
  ];

  for (const sql_stmt of coreMigrations) {
    try { await sql.raw(sql_stmt); results.push(`✅ ${sql_stmt.slice(0, 50)}...`); }
    catch (e: any) { results.push(`❌ ${sql_stmt.slice(0, 50)}...: ${e.message}`); }
  }

  return NextResponse.json({ migrated: true, results });
}
