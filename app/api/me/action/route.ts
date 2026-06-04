import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { recordUserAction } from '@/lib/engagement';

/**
 * POST /api/me/action — record a user action (claim, submit, browse, etc).
 * Used by the re-engagement system to detect active users.
 * Fire-and-forget. Always returns 200.
 */
export async function POST() {
  try {
    const user = await getUser();
    if (user) {
      await recordUserAction(user.id);
    }
  } catch (e: any) { console.error('Unhandled error in api/me/action/route.ts:', e); }
  
  return NextResponse.json({ ok: true });
}
