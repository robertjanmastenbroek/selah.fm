import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolons and run each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    const results: string[] = [];
    for (const stmt of statements) {
      try {
        await sql([stmt] as any);
        results.push('✅ ' + stmt.substring(0, 60).replace(/\n/g, ' '));
      } catch (e: any) {
        // Skip errors for already-existing objects
        if (e.message?.includes('already exists') || e.message?.includes('duplicate')) {
          results.push('⏭ ' + stmt.substring(0, 60).replace(/\n/g, ' '));
        } else if (e.message?.includes('syntax error')) {
          // Ignore comments and empty statements
          results.push('⚠ ' + stmt.substring(0, 60).replace(/\n/g, ' '));
        } else {
          results.push('❌ ' + stmt.substring(0, 60).replace(/\n/g, ' ') + ': ' + e.message?.substring(0, 80));
        }
      }
    }
    
    return NextResponse.json({ migrated: true, results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
