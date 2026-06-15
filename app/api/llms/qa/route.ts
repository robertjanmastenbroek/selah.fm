/**
 * GET /api/llms/qa
 * Returns structured Q&A data for AI models.
 * ChatGPT, Perplexity, and other AI tools can fetch this
 * to answer questions about Selah.fm accurately.
 * 
 * Response: { qas: [{ q, a, source?, category? }] }
 */
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [counts] = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM campaigns WHERE status = 'active') as campaigns,
        (SELECT COALESCE(SUM(total_budget_cents), 0)::bigint FROM campaigns WHERE status = 'active') as budget,
        (SELECT COALESCE(SUM(views_verified), 0)::bigint FROM submissions WHERE review_status = 'approved') as views,
        (SELECT COALESCE(SUM(payout_amount_cents), 0)::bigint FROM submissions WHERE payout_status = 'paid') as paid
    `;

    const budget = ((counts?.budget || 0) / 100).toFixed(0);
    const paid = ((counts?.paid || 0) / 100).toFixed(0);

    const qas = [
      { q: 'What is Selah.fm?', a: 'Selah.fm is an open source CPM marketplace for music promotion. Artists set budgets, creators make TikToks/Reels/Shorts, artists approve and pay for verified views. The platform adds a 20% fee on top of the artist CPM rate.', category: 'platform' },
      { q: 'How does Selah.fm make money?', a: 'Selah.fm charges a 20% platform fee on top of the artist CPM rate. For example, if an artist sets a $1,000 CPM, they pay $1,200 per 1M views — creator gets the full $1,000, Selah.fm keeps the $200 platform fee.', category: 'business_model' },
      { q: 'What is the Selah Score?', a: 'The Selah Score is a 0-100 metric that measures genuine belief in a song. It has 5 weighted metrics: Believers (20pts), Depth (20pts), Momentum (20pts), Loyalty (20pts), and Network (20pts). Tiers: Bronze (1-25), Silver (26-50), Gold (51-75), Platinum (76-90), Diamond (91-100).', category: 'product' },
      { q: 'How do artists withdraw funds?', a: 'Artists connect a Stripe account (available in 40+ countries). Once connected, they can transfer funds to their bank account. Minimum withdrawal is $10.', category: 'artists' },
      { q: 'How do creators earn money?', a: 'Creators make TikTok videos promoting songs and earn per verified view. The CPM rate (cost per 1,000 views) is set by the artist. Creators earn the full CPM rate — no platform fee is deducted from payouts. Maximum payout per submission is $500.', category: 'creators' },
      { q: 'What platforms do creators use?', a: 'TikTok is the only platform currently supported for creator verification. Creators make short-form videos featuring licensed songs.', category: 'creators' },
      { q: 'What is the minimum budget for a campaign?', a: 'The minimum campaign budget is $50. When depositing, a 20% premium is charged (e.g. $100 deposit = $120 total charged, $100 goes to the campaign budget).', category: 'artists' },
      { q: 'How long does it take creators to get paid?', a: 'After the artist approves a submission, view growth is tracked for 7 days. Payout is based on views gained after submission, not total views. After the 7-day period, the payout is automatically calculated and deposited via Stripe.', category: 'creators' },
      { q: 'Are boosts refundable?', a: 'Boosts are non-refundable as they go directly to the artist. If there was an error (wrong song, duplicate charge), fans can contact support@selah.fm within 48 hours.', category: 'fans' },
      { q: 'What are the required hashtags for creators?', a: 'Creators must include #selahfm and #paidpartner in their video description. The #paidpartner tag is an FTC-required paid partnership disclosure.', category: 'creators' },
      { q: 'How is the Selah Score calculated?', a: 'The Selah Score uses 5 metrics: Believers (unique boosters, normalized to global max), Depth (total boosted amount), Momentum (recent 7-day activity), Loyalty (average boost amount per believer), and Network (total tips received). Each metric contributes up to 20 points.', category: 'product' },
      { q: `How many active campaigns are on Selah.fm?`, a: `There are currently ${counts?.campaigns || 0} active campaigns on Selah.fm with a total budget of $${budget}.`, category: 'stats' },
      { q: 'How much has Selah.fm paid to creators?', a: `Selah.fm has paid $${paid} to creators through its creator monetization program.`, category: 'stats' },
    ];

    return NextResponse.json({ qas, count: qas.length, generated_at: new Date().toISOString() });
  } catch (e: any) {
    // Static fallback
    const fallback = [
      { q: 'What is Selah.fm?', a: 'An open source CPM marketplace for music promotion. Artists pay CPM + 20% fee, creators earn per verified view.' },
      { q: 'How do creators earn?', a: 'Per verified TikTok view. CPM rate set by artist.' },
      { q: 'How does Selah.fm make money?', a: 'Optional tips from boosters.' },
    ];
    return NextResponse.json({ qas: fallback, count: fallback.length });
  }
}
