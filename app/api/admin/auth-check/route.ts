import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieHeader = headers().get('cookie') || '';
  const supabaseCookies = cookieHeader
    .split(';')
    .filter(c => c.includes('sb-'))
    .map(c => c.trim().substring(0, 80));

  const user = await getUser();

  return NextResponse.json({
    hasCookieHeader: cookieHeader.length > 0,
    supabaseCookiesFound: supabaseCookies.length,
    supabaseCookieNames: supabaseCookies.map(c => c.split('=')[0]),
    userAuthenticated: !!user,
    userEmail: user?.email || null,
  });
}
