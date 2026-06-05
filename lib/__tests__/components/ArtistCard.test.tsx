import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock framer-motion to avoid animation dependencies
vi.mock('framer-motion', () => {
  const R = require('react');
  return {
    motion: {
      div: (props: any) => R.createElement('div', props, props.children),
      span: (props: any) => R.createElement('span', props, props.children),
    },
  };
});

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => {
    const R = require('react');
    return R.createElement('a', { href, ...props }, children);
  },
}));

import ArtistCard from '@/components/ArtistCard';

const mockArtist = {
  id: 'test-id-123',
  artist_name: 'Test Artist',
  genres: ['electronic'],
  slug: 'test-artist',
  spotify_image_url: 'https://example.com/image.jpg',
  track_count: 5,
  monthly_listeners: 150000,
};

describe('ArtistCard', () => {
  it('renders artist name', () => {
    render(<ArtistCard artist={mockArtist} />);
    expect(screen.getByText('Test Artist')).toBeTruthy();
  });

  it('renders genre badge', () => {
    render(<ArtistCard artist={mockArtist} />);
    expect(screen.getByText('electronic')).toBeTruthy();
  });

  it('renders track count', () => {
    render(<ArtistCard artist={mockArtist} />);
    expect(screen.getByText(/5 tracks/)).toBeTruthy();
  });

  it('renders monthly listeners', () => {
    render(<ArtistCard artist={mockArtist} />);
    expect(screen.getByText(/150\.\dK/)).toBeTruthy();
  });

  it('links to artist page', () => {
    render(<ArtistCard artist={mockArtist} />);
    const link = screen.getByText('Test Artist').closest('a');
    expect(link?.getAttribute('href')).toBe('/artist/test-artist');
  });

  it('renders image when spotify_image_url is provided', () => {
    render(<ArtistCard artist={mockArtist} />);
    const img = screen.getByAltText('Test Artist');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/image.jpg');
  });

  it('shows gradient fallback when no image', () => {
    const artist = { ...mockArtist, spotify_image_url: '' };
    render(<ArtistCard artist={artist} />);
    const img = screen.queryByAltText('Test Artist');
    expect(img).toBeFalsy();
    expect(screen.getByText('T')).toBeTruthy();
  });

  it('shows singular track count for 1 track', () => {
    const artist = { ...mockArtist, track_count: 1 };
    render(<ArtistCard artist={artist} />);
    expect(screen.getByText(/1 track/)).toBeTruthy();
  });

  it('handles null/undefined optional fields gracefully', () => {
    const artist = { ...mockArtist, genres: null as any, track_count: null as any, monthly_listeners: null as any };
    render(<ArtistCard artist={artist} />);
    expect(screen.getByText('Test Artist')).toBeTruthy();
    expect(screen.queryByText('tracks')).toBeFalsy();
    expect(screen.queryByText('ML')).toBeFalsy();
  });

  it('handles PostgreSQL array format genres', () => {
    const artist = { ...mockArtist, genres: '{punk,rock}' };
    render(<ArtistCard artist={artist} />);
    expect(screen.getByText('punk')).toBeTruthy();
  });

  it('handles string genres without array', () => {
    const artist = { ...mockArtist, genres: 'pop' };
    render(<ArtistCard artist={artist} />);
    expect(screen.getByText('pop')).toBeTruthy();
  });
});
