import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase browser client — for use in Client Components only.
 * 
 * Uses the singleton pattern to avoid creating multiple instances.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
