import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import pg from 'pg';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL || '';
  if (!dbUrl) return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 500 });

  const pool = new pg.Pool({ connectionString: dbUrl });
  const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  const results: string[] = [];
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(schema);
    await client.query('COMMIT');
    results.push('✅ Full schema migrated successfully');
  } catch (e: any) {
    await client.query('ROLLBACK');
    const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
    for (const stmt of statements) {
      try {
        await client.query(stmt);
        results.push('✅ ' + stmt.substring(0, 70).replace(/\n/g, ' '));
      } catch (se: any) {
        if (se.message?.includes('already exists') || se.message?.includes('duplicate')) {
          results.push('⏭ ' + stmt.substring(0, 70).replace(/\n/g, ' '));
        } else {
          results.push('❌ ' + stmt.substring(0, 70).replace(/\n/g, ' ') + ': ' + se.message?.substring(0, 80));
        }
      }
    }
  } finally {
    client.release();
    await pool.end();
  }

  return NextResponse.json({ migrated: true, results });
}
