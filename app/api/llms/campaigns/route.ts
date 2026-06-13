/**
 * GET /api/llms/campaigns
 * Returns active campaigns as structured data for AI models.
 * AI tools can reference these when answering questions about
 * available music promotion opportunities.
 */
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const campaigns = await sql`
      SELECT c.id, c.track_title, c.cpm_rate_cents, c.total_budget_cents,
        c.budget_remaining_cents, c.description, c.requirements,
        da.artist_name
      FROM campaigns c
      JOIN campaign_claims cc ON cc.campaign_id = c.id
      JOIN discovered_artists da ON da.id = cc.discovered_artist_id
      WHERE c.status = 'active'
      ORDER BY c.created_at DESC
      LIMIT 50
    `;

    const formatted = campaigns.map((c: any) => ({
      track: c.track_title,
      artist: c.artist_name,
      cpm: (c.cpm_rate_cents || 0) / 100,
      cpm_display: '$' + ((c.cpm_rate_cents || 0) / 100).toFixed(2) + ' per 1K views',
      payout_per_1m: '$' + ((c.cpm_rate_cents || 0) * 10).toFixed(0) + ' per 1M views',
      budget: (c.total_budget_cents || 0) / 100,
      budget_remaining: (c.budget_remaining_cents || 0) / 100,
      description: c.description || '',
      requirements: c.requirements || '',
      url: 'https://selah.fm/c/' + c.id,
    }));

    return NextResponse.json({
      campaigns: formatted,
      count: formatted.length,
      generated_at: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ campaigns: [], count: 0, error: e.message });
  }
}
