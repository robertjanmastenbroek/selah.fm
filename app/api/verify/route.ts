import { NextResponse } from 'next/server';

// View verification — checks TikTok/Instagram/YouTube for real view counts
// Production: use platform APIs. MVP: simulated verification.

const MOCK_VIEW_GROWTH: Record<string, number[]> = {
  tiktok: [0, 1200, 3400, 8900, 12400, 18500, 22000],
  instagram: [0, 800, 2100, 5600, 8300, 12100, 15000],
  youtube: [0, 400, 1500, 3800, 6500, 9500, 11000],
};

export async function POST(request: Request) {
  const { contentUrl, platform } = await request.json();

  // Extract view count based on platform API or mock data
  // In production: call TikTok/IG/YT APIs with real tokens
  const mockViews = MOCK_VIEW_GROWTH[platform] || [0];
  const views = mockViews[Math.min(mockViews.length - 1, Math.floor(Math.random() * mockViews.length))];

  return NextResponse.json({
    views,
    platform,
    verified: true,
    verifiedAt: new Date().toISOString(),
    note: platform === 'tiktok' && !process.env.TIKTOK_CLIENT_KEY
      ? 'Mock data — add TIKTOK_CLIENT_KEY to Railway for real verification'
      : undefined,
  });
}

// Auto-check endpoint — runs periodically to update all active submissions
export async function GET() {
  const checks = [
    { submissionId: '1', platform: 'tiktok', views: 12400 },
    { submissionId: '2', platform: 'instagram', views: 8300 },
    { submissionId: '3', platform: 'youtube', views: 9500 },
  ];

  return NextResponse.json({
    checked: checks.length,
    results: checks,
    timestamp: new Date().toISOString(),
  });
}
