import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ── Mocks ──────────────────────────────────────────────────
vi.mock('framer-motion', () => ({
  motion: {
    div: (props: any) => React.createElement('div', props, props.children),
    h3: (props: any) => React.createElement('h3', props, props.children),
    p: (props: any) => React.createElement('p', props, props.children),
    img: (props: any) => React.createElement('img', props),
    span: (props: any) => React.createElement('span', props, props.children),
  },
  AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => React.createElement('a', { href, ...props }, children),
}));

vi.mock('next/image', () => ({
  default: (props: any) => React.createElement('img', { ...props, loading: 'lazy' }),
}));

vi.mock('@/lib/swr-config', () => ({
  fetcher: (url: string) => fetch(url).then(r => r.json()),
  swrConfig: { revalidateOnFocus: false },
}));

// Mock useSWR
vi.mock('swr', () => ({
  default: () => ({ data: undefined, error: null, isLoading: false }),
}));

import { EmptyState, ErrorState } from '@/components/States';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="Nothing here" description="Try adjusting your filters" />);
    expect(screen.getByText('Nothing here')).toBeTruthy();
    expect(screen.getByText('Try adjusting your filters')).toBeTruthy();
  });

  it('renders action button linking to a page', () => {
    render(
      <EmptyState
        title="No campaigns"
        description="Create one to get started"
        action={{ label: 'Create campaign', href: '/dashboard' }}
      />
    );
    const btn = screen.getByText('Create campaign');
    expect(btn).toBeTruthy();
    expect(btn.closest('a')?.getAttribute('href')).toBe('/dashboard');
  });

  it('renders custom icon element', () => {
    render(
      <EmptyState
        title="Test"
        description="Test description"
        icon={<span data-testid="custom-icon">📦</span>}
      />
    );
    expect(screen.getByTestId('custom-icon')).toBeTruthy();
  });
});

describe('ErrorState', () => {
  it('renders default error message', () => {
    render(<ErrorState />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });

  it('renders custom title and message', () => {
    render(<ErrorState title="Failed to load" message="Please try again later" />);
    expect(screen.getByText('Failed to load')).toBeTruthy();
    expect(screen.getByText('Please try again later')).toBeTruthy();
  });

  it('fires onRetry callback when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    screen.getByText('Try again').click();
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('filters falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });

  it('returns empty string for no classes', () => {
    expect(cn()).toBe('');
  });
});
