import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mocks
vi.mock('framer-motion', () => ({
  motion: {
    div: (props: any) => React.createElement('div', { ...props, 'data-motion': 'div' }, props.children),
  },
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => React.createElement('a', { href, ...props }, children),
}));

import ArtistCard from '@/components/ArtistCard';

const baseArtist = {
  id: '123',
  artist_name: 'Test Artist',
  genres: '["electronic", "pop"]',
  slug: 'test-artist',
  spotify_image_url: 'https://example.com/image.jpg',
  track_count: 10,
  monthly_listeners: 50000,
  total_followers: 1000,
};

describe('ArtistCard', () => {
  it('renders artist name', () => {
    render(<ArtistCard artist={baseArtist} />);
    expect(screen.getByText('Test Artist')).toBeTruthy();
  });

  it('renders genre badge for known genre', () => {
    render(<ArtistCard artist={baseArtist} />);
    expect(screen.getByText('electronic')).toBeTruthy();
  });

  it('renders monthly listeners count (formatted)', () => {
    render(<ArtistCard artist={baseArtist} />);
    expect(screen.getByText(/50\.0K/)).toBeTruthy();
  });

  it('renders track count with singular/plural', () => {
    render(<ArtistCard artist={baseArtist} />);
    expect(screen.getByText('10 tracks')).toBeTruthy();

    const singleTrack = { ...baseArtist, track_count: 1 };
    const { container } = render(<ArtistCard artist={singleTrack} />);
    expect(container.textContent).toContain('1 track');
  });

  it('renders gradient fallback when no image URL', () => {
    const noImage = { ...baseArtist, spotify_image_url: '' };
    render(<ArtistCard artist={noImage} />);
    // Gradient fallback shows the initial letter
    expect(screen.getByText('T')).toBeTruthy();
  });

  it('rejects tiny Bandcamp thumbnail (16px) with gradient fallback', () => {
    const tinyImage = { ...baseArtist, spotify_image_url: 'https://bandcamp.com/image_16.jpg' };
    render(<ArtistCard artist={tinyImage} />);
    // Initial letter from fallback gradient should be present
    expect(screen.getByText('T')).toBeTruthy();
  });

  it('links to artist page via slug', () => {
    render(<ArtistCard artist={baseArtist} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/artist/test-artist');
  });

  it('handles missing optional fields gracefully', () => {
    const sparse = {
      id: '456',
      artist_name: 'Minimal Artist',
    };
    const { container } = render(<ArtistCard artist={sparse as any} />);
    expect(screen.getByText('Minimal Artist')).toBeTruthy();
    // No genre, no track count, no listener count should be shown
    expect(container.textContent).not.toContain('track');
    expect(container.textContent).not.toContain('ML');
  });

  it('handles PostgreSQL array format for genres', () => {
    const pgArtist = { ...baseArtist, genres: '{rock,indie}' };
    render(<ArtistCard artist={pgArtist} />);
    expect(screen.getByText('rock')).toBeTruthy();
  });

  it('handles quoted genre string', () => {
    const quoted = { ...baseArtist, genres: 'BLISTER["pop"]' };
    render(<ArtistCard artist={quoted} />);
    expect(screen.getByText('pop')).toBeTruthy();
  });

  it('renders "View →" call to action', () => {
    render(<ArtistCard artist={baseArtist} />);
    expect(screen.getByText('View →')).toBeTruthy();
  });

  it('renders image with alt text when URL provided', () => {
    render(<ArtistCard artist={baseArtist} />);
    const img = screen.getByAltText('Test Artist');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/image.jpg');
  });
});
