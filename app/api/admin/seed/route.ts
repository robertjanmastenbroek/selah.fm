import { NextResponse } from 'next/server';

// 🚫 SEED DISABLED — production database is clean for v1.0 launch.
// To re-enable, uncomment the original seed logic below or restore from git history.

export async function GET() {
  return NextResponse.json({ error: 'Seed disabled. Database is clean for launch.' }, { status: 403 });
}
