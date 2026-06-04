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

  const fileListFilter = searchParams.get('file') || '';
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
  if (fileListFilter) {
    try {
      const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
      const match = files.find(f => f.includes(fileListFilter));
      if (!match) return NextResponse.json({ error: `Migration "${fileListFilter}" not found` }, { status: 404 });

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

  // Default: run all migration files in order
  const results: string[] = [];
  
  try {
    const files = readdirSync(migrationsDir).filter((f: string) => f.endsWith('.sql')).sort();
    for (const file of files) {
      try {
        const sqlContent = readFileSync(path.join(migrationsDir, file), 'utf-8');
        const statements = sqlContent.split(';').map((s: string) => s.trim()).filter((s: string) => s.length > 0 && !s.startsWith('--'));
        let executed = 0;
        for (const stmt of statements) {
          try { await sql.raw(stmt); executed++; }
          catch (e: any) { results.push(`  ${file}: ${e.message.slice(0, 80)}`); }
        }
        if (executed > 0) results.push(`${file}: ${executed} statements`);
      } catch (e: any) {
        results.push(`  ${file}: ${e.message.slice(0, 80)}`);
      }
    }
  } catch (e: any) {
    results.push(`Migration dir error: ${e.message}`);
  }

  // ── Core platform tables (idempotent, IF NOT EXISTS) ──
    return NextResponse.json({ migrated: true, results });
}
