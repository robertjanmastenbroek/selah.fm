import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Auth callback — exchanges OAuth code for session and sets cookies.
 * Supabase redirects here after Google auth completes.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/browse';

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
