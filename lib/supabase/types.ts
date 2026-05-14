/**
 * Type definitions for @supabase/ssr cookie options.
 * These match the CookieOptions interface from @supabase/ssr.
 */
export interface CookieOptions {
  domain?: string;
  path?: string;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
}

export interface CookieOptionWithName {
  name: string;
  value: string;
  options: CookieOptions;
}
