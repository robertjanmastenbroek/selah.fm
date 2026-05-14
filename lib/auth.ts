import crypto from 'crypto';
import { NextResponse, NextRequest } from 'next/server';
import { ADMIN_EMAILS } from './constants';

// ── Session secret ───────────────────────────────────────────────
// In production: MUST be set via NEXTAUTH_SECRET env var.
// Changing this value invalidates ALL existing sessions.
let _cachedSecret: string | null = null;

function getSecret(): string {
  // Production: require the env var
  if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT === 'production') {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error(
        'NEXTAUTH_SECRET environment variable is required in production. ' +
        'Generate one: openssl rand -base64 32'
      );
    }
    return secret;
  }

  // Development: use env var if set, otherwise generate a random one (won't persist across restarts)
  if (process.env.NEXTAUTH_SECRET) return process.env.NEXTAUTH_SECRET;

  if (!_cachedSecret) {
    _cachedSecret = crypto.randomBytes(32).toString('hex');
    console.warn(
      '⚠ NEXTAUTH_SECRET not set — using a randomly generated secret for this session. ' +
      'Sessions will not persist across server restarts. Set NEXTAUTH_SECRET in your .env.local.'
    );
  }
  return _cachedSecret!;
}

// ── Session user type ────────────────────────────────────────────
export interface SessionUser {
  id?: string;      // Database user UUID (present in new sessions, may be absent in old ones)
  email: string;
  type: 'artist' | 'creator';
  name: string;
  is_artist?: boolean;  // dual-role support (may be absent in old sessions)
  is_creator?: boolean; // dual-role support (may be absent in old sessions)
}

// ── Core: parse + verify session cookie value ────────────────────
function parseSessionCookie(cookieValue: string): SessionUser | null {
  try {
    const parts = cookieValue.split('.');
    if (parts.length !== 2) return null;
    const [payload, sig] = parts;
    if (!payload || !sig) return null;

    const expected = crypto
      .createHmac('sha256', getSecret())
      .update(payload)
      .digest('hex');

    if (sig !== expected) return null;

    const user = JSON.parse(Buffer.from(payload, 'base64').toString());

    // Validate required fields (id is optional for backward compat with old sessions)
    if (!user.email || !user.type || !user.name) return null;
    if (!['artist', 'creator'].includes(user.type)) return null;

    return user as SessionUser;
  } catch {
    return null;
  }
}

// ── Public: get session from request ─────────────────────────────
// Uses NextRequest.cookies (Edge-compatible, same API the middleware uses
// successfully) then falls back to raw Cookie header parsing.
export function getSession(request?: Request): SessionUser | null {
  let cookieValue: string | undefined;

  // Primary: NextRequest.cookies — same API middleware uses (works on Railway edge)
  if (request) {
    try {
      const nextReq = request as NextRequest;
      cookieValue = nextReq.cookies.get('session')?.value;
    } catch {
      // Not a NextRequest — fall through to raw header
    }
  }

  // Fallback: parse raw Cookie header from the request object
  if (!cookieValue && request) {
    const header = request.headers.get('cookie') || '';
    // Match session cookie at start (^) or after a semicolon (;\s*)
    const match = header.match(/(?:^|;\s*)session=([^;]+)/);
    cookieValue = match ? match[1] : undefined;
  }

  return cookieValue ? parseSessionCookie(cookieValue) : null;
}

// ── Public: check if request is from an admin ────────────────────
export function isAdminRequest(request: Request): boolean {
  const session = getSession(request);
  if (!session) return false;
  return ADMIN_EMAILS.includes(session.email);
}

// Re-export for convenience (used by server-side admin routes)
export { ADMIN_EMAILS };

// ── Helper: resolve user ID from session (handles old sessions without id) ──
export async function resolveUserId(session: SessionUser): Promise<string> {
  if (session.id) return session.id;
  // Old session without id — look up from DB
  const { default: sql } = await import('@/lib/db');
  const users = await sql`SELECT id FROM users WHERE email = ${session.email}`;
  if (users.length === 0) throw new Error('User not found');
  return users[0].id;
}

// ── Cookie configuration ─────────────────────────────────────────
const PUBLIC_URL = process.env.NEXT_PUBLIC_URL || 'https://selah.fm';
const IS_HTTPS = PUBLIC_URL.startsWith('https://');
const IS_PROD = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT === 'production';

// Extract domain from public URL for cookie (e.g. "selah.fm" from "https://selah.fm")
// Leading dot makes it work on subdomains too (e.g. www.selah.fm)
function getCookieDomain(): string | undefined {
  try {
    const hostname = new URL(PUBLIC_URL).hostname;
    // Don't set domain on localhost (browsers ignore it)
    if (hostname === 'localhost') return undefined;
    return '.' + hostname;
  } catch {
    return undefined;
  }
}

const COOKIE_DOMAIN = getCookieDomain();

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: IS_PROD && IS_HTTPS,
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  };
}

export function setSessionCookie(res: NextResponse, user: SessionUser): void {
  const payload = Buffer.from(JSON.stringify(user)).toString('base64');
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  res.cookies.set('session', `${payload}.${sig}`, cookieOptions(60 * 60 * 24 * 7));
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set('session', '', cookieOptions(0));
}
