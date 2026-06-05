import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { isAdminRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  const cookieHeader = headers().get('cookie') || '';
  const supabaseCookies = cookieHeader
    .split(';')
    .filter(c => c.includes('sb-') || c.includes('supabase') || c.includes('auth'))
    .map(c => c.trim());

  return NextResponse.json({
    hasCookies: cookieHeader.length > 0,
    totalCookies: cookieHeader.split(';').filter(Boolean).length,
    supabaseCookies,
    allCookieNames: cookieHeader
      .split(';')
      .filter(Boolean)
      .map(c => c.trim().split('=')[0]),
  });
}
