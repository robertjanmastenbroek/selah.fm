import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase browser client — for use in Client Components only.
 * 
 * Uses the singleton pattern to avoid creating multiple instances.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase client initialized without URL or ANON_KEY');
  }
  return createBrowserClient(url, key);
}
