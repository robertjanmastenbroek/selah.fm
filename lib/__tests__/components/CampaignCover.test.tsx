import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: any) => React.createElement('div', { ...props, 'data-motion': 'div' }, props.children),
  },
}));

import CampaignCover, { campaignGradient } from '@/components/CampaignCover';

describe('campaignGradient', () => {
  it('returns a deterministic gradient string', () => {
    const g1 = campaignGradient('My Song');
    expect(g1).toContain('linear-gradient');
    expect(g1).toContain('135deg');
  });

  it('returns the same gradient for the same title', () => {
    expect(campaignGradient('My Song')).toBe(campaignGradient('My Song'));
  });

  it('returns different gradients for different titles', () => {
    expect(campaignGradient('Song A')).not.toBe(campaignGradient('Song B'));
  });
});

describe('CampaignCover', () => {
  it('renders with image when src provided', () => {
    render(<CampaignCover src="https://example.com/cover.jpg" title="Cool Track" />);
    const img = screen.getByAltText('Cool Track');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/cover.jpg');
  });

  it('renders gradient fallback when no src', () => {
    const { container } = render(<CampaignCover title="My Song" />);
    // Gradient fallback has decorative circles (bg-white/5 divs)
    const circles = container.querySelectorAll('.rounded-full');
    expect(circles.length).toBeGreaterThanOrEqual(3);
  });

  it('renders with null src gracefully', () => {
    const { container } = render(<CampaignCover src={null} title="Null Track" />);
    // Should fall back to gradient (decorative circles present)
    const circles = container.querySelectorAll('.rounded-full');
    expect(circles.length).toBeGreaterThanOrEqual(3);
  });

  it('applies custom className', () => {
    const { container } = render(<CampaignCover title="Test" className="w-40 h-40" />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('w-40');
    expect(root.className).toContain('h-40');
  });

  it('shows sound wave bars in gradient fallback', () => {
    const { container } = render(<CampaignCover title="Test" />);
    // 12 sound wave bars
    const bars = container.querySelectorAll('.rounded-full');
    expect(bars.length).toBeGreaterThanOrEqual(12);
  });

  it('uses src as alt text when title is empty', () => {
    render(<CampaignCover src="https://example.com/cap.jpg" title="" />);
    const img = screen.getByAltText('Campaign cover art');
    expect(img).toBeTruthy();
  });

  it('has gradient overlay on image for readability', () => {
    const { container } = render(<CampaignCover src="https://example.com/cap.jpg" title="Track" />);
    // Gradient overlay is an absolute-inset div with bg-gradient-to-t
    const overlays = container.querySelectorAll('.bg-gradient-to-t');
    expect(overlays.length).toBeGreaterThanOrEqual(1);
  });
});
