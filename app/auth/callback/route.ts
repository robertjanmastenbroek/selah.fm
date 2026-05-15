import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/browse';

  // Railway proxy forwards real host in x-forwarded-host header
  const origin = request.headers.get('x-forwarded-host') 
    ? `https://${request.headers.get('x-forwarded-host')}`
    : process.env.NEXT_PUBLIC_URL || new URL(request.url).origin;

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);
    const supabase = createRouteClient(response);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
