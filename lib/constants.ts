/**
 * Admin email allow-list — shared between server and client code.
 * 
 * Configure via ADMIN_EMAILS env var (comma-separated).
 * Falls back to hardcoded list if not set.
 */
const envEmails = typeof process !== 'undefined' && process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim()).filter(Boolean)
  : null;
export const ADMIN_EMAILS: string[] = envEmails ?? ['mastenbroekrobertjan@gmail.com', 'motomotosings@gmail.com'];
