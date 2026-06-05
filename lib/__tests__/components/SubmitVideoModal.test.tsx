import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: any) => React.createElement('div', { ...props, 'data-motion': 'div' }, props.children),
  },
  AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, ...props }: any) =>
    React.createElement('button', { onClick, disabled, className, 'data-testid': 'submit-btn', ...props }, children),
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, className, ...props }: any) =>
    React.createElement('input', { value, onChange, placeholder, className, 'data-testid': 'url-input', ...props }),
}));

// Mock global fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

import SubmitVideoModal from '@/components/SubmitVideoModal';

const baseTracks = [
  { id: 'track-1', track_title: 'Summer Vibes', cpm_rate_cents: 500 },
  { id: 'track-2', track_title: 'Night Drive', cpm_rate_cents: 750 },
];

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  tracks: baseTracks,
  artistSlug: 'test-artist',
  artistName: 'Test Artist',
};

describe('SubmitVideoModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    // Default: artist fetch returns positive balance
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/artists/')) {
        return Promise.resolve(new Response(JSON.stringify({ balance_cents: 1000 }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ id: 'sub-1' }), { status: 200 }));
    });
  });

  it('renders modal with title when open', () => {
    const { container } = render(<SubmitVideoModal {...defaultProps} />);
    expect(container.textContent).toContain('Make a video for');
    expect(container.textContent).toContain('Test Artist');
  });

  it('does not render when open is false', () => {
    const { container } = render(<SubmitVideoModal {...defaultProps} open={false} />);
    expect(container.textContent).not.toContain('Make a video');
  });

  it('renders close button', () => {
    render(<SubmitVideoModal {...defaultProps} />);
    const closeBtn = screen.getByRole('button', { name: '' });
    // The X button has an X icon with size={16}
    expect(closeBtn).toBeTruthy();
  });

  it('shows URL input field with placeholder', () => {
    render(<SubmitVideoModal {...defaultProps} />);
    const input = screen.getByTestId('url-input');
    expect(input).toBeTruthy();
    expect(input.getAttribute('placeholder')).toContain('tiktok.com');
  });

  it('shows artist balance when fetched', async () => {
    render(<SubmitVideoModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/Artist budget:/)).toBeTruthy();
    });
  });

  it('shows submit button disabled when URL is empty', () => {
    render(<SubmitVideoModal {...defaultProps} />);
    const btn = screen.getByTestId('submit-btn');
    expect(btn.hasAttribute('disabled')).toBe(true);
  });

  it('shows submit button disabled when artist balance is zero', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/artists/')) {
        return Promise.resolve(new Response(JSON.stringify({ balance_cents: 0 }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ id: 'sub-1' }), { status: 200 }));
    });
    render(<SubmitVideoModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/hasn't funded their campaign/)).toBeTruthy();
    });
    const btn = screen.getByTestId('submit-btn');
    expect(btn.hasAttribute('disabled')).toBe(true);
  });

  it('shows error state on submission failure', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/artists/')) {
        return Promise.resolve(new Response(JSON.stringify({ balance_cents: 1000 }), { status: 200 }));
      }
      if (url.includes('/api/submissions')) {
        return Promise.resolve(new Response(JSON.stringify({ error: 'Campaign budget is exhausted' }), { status: 400 }));
      }
      return Promise.resolve(new Response('{}', { status: 200 }));
    });

    render(<SubmitVideoModal {...defaultProps} />);
    await waitFor(() => screen.getByTestId('url-input'));

    const input = screen.getByTestId('url-input');
    fireEvent.change(input, { target: { value: 'https://tiktok.com/@user/video/1234567890' } });

    const btn = screen.getByTestId('submit-btn');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText('Campaign budget is exhausted')).toBeTruthy();
    });
  });

  it('shows success state after successful submission', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/artists/')) {
        return Promise.resolve(new Response(JSON.stringify({ balance_cents: 1000 }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ id: 'sub-1' }), { status: 200 }));
    });

    render(<SubmitVideoModal {...defaultProps} />);
    await waitFor(() => screen.getByTestId('url-input'));

    const input = screen.getByTestId('url-input');
    fireEvent.change(input, { target: { value: 'https://tiktok.com/@user/video/1234567890' } });

    const btn = screen.getByTestId('submit-btn');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText(/Video submitted/)).toBeTruthy();
    });
  });

  it('shows track selector when multiple tracks exist', () => {
    render(<SubmitVideoModal {...defaultProps} />);
    // Track names appear in both selector and selected display — use getAllByText
    const vibes = screen.getAllByText('Summer Vibes');
    expect(vibes.length).toBeGreaterThanOrEqual(1);
    const drive = screen.getAllByText('Night Drive');
    expect(drive.length).toBeGreaterThanOrEqual(1);
  });

  it('shows selected track info with CPM rate', () => {
    render(<SubmitVideoModal {...defaultProps} />);
    const cpmLabels = screen.getAllByText(/\$5\.00 CPM/);
    expect(cpmLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<SubmitVideoModal {...defaultProps} onClose={onClose} />);
    // The backdrop (fixed inset-0 z-50) has the onClick handler
    const backdrop = document.querySelector('.fixed.inset-0');
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('detects platform from URL', () => {
    render(<SubmitVideoModal {...defaultProps} />);
    const input = screen.getByTestId('url-input');
    fireEvent.change(input, { target: { value: 'https://youtube.com/watch?v=abc' } });
    expect(screen.getByText('youtube')).toBeTruthy();
  });
});
