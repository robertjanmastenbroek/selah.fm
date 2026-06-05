import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('utils.ts — cn()', () => {
  it('joins class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('merges Tailwind conflicts properly', () => {
    // twMerge should resolve the conflict (px-4 wins over px-2)
    const result = cn('px-2', 'px-4');
    expect(result).toBe('px-4');
  });

  it('handles undefined and null', () => {
    expect(cn('a', undefined, 'b', null)).toBe('a b');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
  });

  it('handles object syntax', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo');
  });
});
