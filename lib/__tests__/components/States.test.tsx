import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock framer-motion with React.createElement to avoid JSX scope issues
vi.mock('framer-motion', () => {
  const ReactMock = require('react');
  return {
    motion: {
      div: (props: any) => ReactMock.createElement('div', props, props.children),
      h3: (props: any) => ReactMock.createElement('h3', props, props.children),
      p: (props: any) => ReactMock.createElement('p', props, props.children),
    },
    AnimatePresence: ({ children }: any) => ReactMock.createElement(ReactMock.Fragment, null, children),
  };
});

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

import { EmptyState, ErrorState } from '@/components/States';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No items found" description="Try a different search" />);
    expect(screen.getByText('No items found')).toBeTruthy();
    expect(screen.getByText('Try a different search')).toBeTruthy();
  });

  it('renders action button with href', () => {
    render(
      <EmptyState
        title="No campaigns"
        description="Create your first campaign"
        action={{ label: 'Create campaign', href: '/dashboard' }}
      />
    );
    const link = screen.getByText('Create campaign');
    expect(link).toBeTruthy();
    expect(link.closest('a')?.getAttribute('href')).toBe('/dashboard');
  });

  it('renders custom icon', () => {
    render(
      <EmptyState
        title="Test"
        description="Description"
        icon={<span data-testid="custom-icon">🔍</span>}
      />
    );
    expect(screen.getByTestId('custom-icon')).toBeTruthy();
  });
});

describe('ErrorState', () => {
  it('renders default error message', () => {
    render(<ErrorState />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText(/couldn't load this right now/)).toBeTruthy();
  });

  it('renders custom title and message', () => {
    render(<ErrorState title="Custom Error" message="Custom message" />);
    expect(screen.getByText('Custom Error')).toBeTruthy();
    expect(screen.getByText('Custom message')).toBeTruthy();
  });

  it('renders retry button when onRetry provided', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    const button = screen.getByText('Try again');
    expect(button).toBeTruthy();
    button.click();
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
