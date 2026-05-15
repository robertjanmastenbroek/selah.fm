import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
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
