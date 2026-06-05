/**
 * Locale-aware formatting utilities for Selah.fm.
 * Wraps Intl.NumberFormat and Intl.DateTimeFormat for consistent formatting
 * across all locales.
 */

const DEFAULT_LOCALE = 'en';

/**
 * Format a number with locale-aware separators.
 * e.g. formatNumber(1000000, 'de') → '1.000.000'
 */
export function formatNumber(n: number, locale: string = DEFAULT_LOCALE): string {
  try {
    return new Intl.NumberFormat(locale).format(n);
  } catch {
    return n.toLocaleString(DEFAULT_LOCALE);
  }
}

/**
 * Format cents to a locale-aware currency string.
 */
export interface FormatMoneyOptions {
  currency?: 'USD' | 'EUR';
  showCents?: boolean;
}

export function formatMoney(
  cents: number,
  locale: string = DEFAULT_LOCALE,
  options: FormatMoneyOptions = {}
): string {
  const { currency = 'USD', showCents = false } = options;
  const dollars = cents / 100;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: showCents ? 2 : 0,
      maximumFractionDigits: showCents ? 2 : 0,
    }).format(dollars);
  } catch {
    const prefix = currency === 'EUR' ? '€' : '$';
    const value = showCents ? dollars.toFixed(2) : Math.round(dollars).toLocaleString(DEFAULT_LOCALE);
    return `${prefix}${value}`;
  }
}

/**
 * Format a count with locale-aware K/M abbreviations.
 */
export function formatCompact(n: number, locale: string = DEFAULT_LOCALE): string {
  try {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short',
      maximumSignificantDigits: 3,
    }).format(n);
  } catch {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  }
}

/**
 * Format a date with locale-aware formatting.
 */
export function formatDate(
  date: Date | string | number,
  locale: string = DEFAULT_LOCALE,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat(locale, options).format(d);
  } catch {
    return d.toLocaleDateString(DEFAULT_LOCALE);
  }
}

/**
 * Format a date relative to now.
 */
export function formatRelative(date: Date | string | number, locale: string = DEFAULT_LOCALE): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    if (diffMin < 1) return rtf.format(0, 'second');
    if (diffMin < 60) return rtf.format(-diffMin, 'minute');
    if (diffHour < 24) return rtf.format(-diffHour, 'hour');
    if (diffDay < 7) return rtf.format(-diffDay, 'day');
    return formatDate(d, locale);
  } catch {
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return formatDate(d, DEFAULT_LOCALE);
  }
}
