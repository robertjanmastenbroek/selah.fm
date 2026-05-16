/**
 * Email verification utilities.
 * 
 * Layer 1: Syntax validation (basic regex)
 * Layer 2: MX record check (DNS lookup — free, catches invalid domains)
 * Layer 3: Optional API verification (ZeroBounce, Hunter, etc.)
 */

import { promises as dns } from 'dns';

/**
 * Basic email syntax validation.
 * Catches: missing @, invalid characters, double dots.
 */
export function isValidEmailSyntax(email: string): boolean {
  // RFC 5322 simplified
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return re.test(email) && email.length < 255 && !email.includes('..');
}

/**
 * Check if a domain has MX (mail exchange) records.
 * Returns true if the domain can receive email.
 */
export async function hasMxRecord(email: string): Promise<boolean> {
  try {
    const domain = email.split('@')[1];
    if (!domain) return false;

    const records = await dns.resolveMx(domain);
    return records && records.length > 0;
  } catch {
    return false;
  }
}

/**
 * Known disposable email domains — addresses that self-destruct.
 * These are NOT real inboxes and will bounce or disappear.
 */
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'temp-mail.org',
  'yopmail.com', 'throwaway.email', 'sharklasers.com', 'trashmail.com',
  'maildrop.cc', 'harakirimail.com', 'dispostable.com', 'getnada.com',
  'tempmail.net', 'fakeinbox.com', 'guerrillamail.info', 'moakt.com',
  'deadaddress.com', 'discard.email', 'spamgourmet.com', 'mailnesia.com',
  'anonbox.net', 'bumpymail.com', 'centermail.com', 'chewydog.com',
  'mytrashmail.com', 'objectmail.com', 'protestant.com', 'safetymail.info',
  'sweetxxx.de', 'trash2009.com', 'mt2009.com', 'tyldd.com', 'uggsrock.com',
  'wuzup.net', 'zippymail.info', 'temporary-mail.net', 'tmpmail.org',
]);

export function isDisposable(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false;
}

/**
 * Full verification check (no API key needed).
 * Returns verification result with reason.
 */
export interface VerificationResult {
  valid: boolean;
  reason: 'ok' | 'invalid_syntax' | 'no_mx_record' | 'disposable' | 'unknown';
}

export async function verifyEmail(email: string): Promise<VerificationResult> {
  if (!email || !isValidEmailSyntax(email)) {
    return { valid: false, reason: 'invalid_syntax' };
  }

  if (isDisposable(email)) {
    return { valid: false, reason: 'disposable' };
  }

  const hasMx = await hasMxRecord(email);
  if (!hasMx) {
    return { valid: false, reason: 'no_mx_record' };
  }

  return { valid: true, reason: 'ok' };
}

/**
 * Batch verification — run MX checks in parallel.
 */
export async function verifyEmailBatch(emails: string[]): Promise<Map<string, VerificationResult>> {
  const results = new Map<string, VerificationResult>();

  // Run syntax + disposable checks synchronously (fast)
  for (const email of emails) {
    if (!email || !isValidEmailSyntax(email)) {
      results.set(email, { valid: false, reason: 'invalid_syntax' });
    } else if (isDisposable(email)) {
      results.set(email, { valid: false, reason: 'disposable' });
    }
  }

  // Run MX checks in parallel for remaining
  const unchecked = emails.filter(e => !results.has(e));
  const mxResults = await Promise.all(
    unchecked.map(async (email): Promise<[string, VerificationResult]> => {
      const ok = await hasMxRecord(email);
      return [email, { valid: ok, reason: ok ? 'ok' : 'no_mx_record' }];
    })
  );

  for (const [email, result] of mxResults) {
    results.set(email, result);
  }

  return results;
}
