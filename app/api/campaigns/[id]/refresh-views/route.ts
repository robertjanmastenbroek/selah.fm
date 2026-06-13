/**
 * POST /api/campaigns/[id]/refresh-views
 * Artist-triggered: re-checks all approved submissions for a campaign's
 * current TikTok views and finalizes any that are past 7 days.
 */
import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  // Verify ownership
  const [campaign] = await sql`SELECT id, artist_id, track_title FROM campaigns WHERE id = ${params.id}`;
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  if (campaign.artist_id !== user.id) return NextResponse.json({ error: 'Not your campaign' }, { status: 403 });

  try {
    // Get all approved submissions for this campaign
    const submissions = await sql`
      SELECT id, views_at_submit, views_verified, reviewed_at, payout_status
      FROM submissions
      WHERE campaign_id = ${params.id}
        AND review_status = 'approved'
        AND (payout_status IS NULL OR payout_status = 'pending')
      ORDER BY reviewed_at
    `;

    let refreshed = 0;
    let finalized = 0;
    let totalGrowth = 0;

    for (const sub of submissions) {
      // Try to fetch current views via TikTok API if the creator has connected
      let currentViews = sub.views_verified || 0;
      
      try {
        // Look up the creator's TikTok connection
        const creatorSub = await sql`
          SELECT pc.access_token, pc.token_expires_at
          FROM platform_connections pc
          JOIN submissions s ON s.creator_id = pc.user_id
          WHERE s.id = ${sub.id} AND pc.platform = 'tiktok'
          LIMIT 1
        `;
        
        if (creatorSub.length > 0) {
          const conn = creatorSub[0];
          let token = conn.access_token;

          // Refresh if expired
          if (conn.token_expires_at && new Date(conn.token_expires_at) < new Date()) {
            try {
              const refreshRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                  client_key: process.env.TIKTOK_CLIENT_KEY || '',
                  client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
                  grant_type: 'refresh_token',
                  refresh_token: conn.refresh_token,
                }),
              });
              const d = await refreshRes.json();
              if (d.access_token) token = d.access_token;
            } catch {}
          }

          // Fetch video info from TikTok
          const videoRes = await fetch('https://open.tiktokapis.com/v2/video/query/', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filters: { video_ids: [sub.id] },
              fields: ['id', 'view_count'],
            }),
          });
          
          if (videoRes.ok) {
            const videoData = await videoRes.json();
            const tiktokViews = parseInt(videoData?.data?.videos?.[0]?.view_count || '0');
            if (tiktokViews > 0) currentViews = tiktokViews;
          }
        }
      } catch {} // Non-blocking — use stored views if TikTok fails

      // Update current views
      await sql`
        UPDATE submissions SET 
          views_verified = ${currentViews},
          views_last_checked = NOW(),
          views_check_count = views_check_count + 1
        WHERE id = ${sub.id}
      `;
      refreshed++;

      // If 7+ days since approval, finalize payout
      const sevenDaysAgo = Date.now() - 7 * 86400000;
      if (sub.reviewed_at && new Date(sub.reviewed_at).getTime() <= sevenDaysAgo) {
        const growth = Math.max(0, currentViews - (sub.views_at_submit || 0));
        const [campaignData] = await sql`SELECT cpm_rate_cents FROM campaigns WHERE id = ${params.id}`;
        const cpmDollars = (campaignData?.cpm_rate_cents || 0) / 100;
        
        if (growth >= 5000) {
          const rawPayout = Math.round((growth / 1000) * cpmDollars * 100);
          const payoutCents = Math.min(rawPayout, 50000);
          
          await sql`
            UPDATE submissions SET 
              payout_status = 'paid',
              payout_finalized_at = NOW(),
              payout_eligible_views = ${growth},
              payout_amount_cents = ${payoutCents}
            WHERE id = ${sub.id}
          `;
          finalized++;
          totalGrowth += growth;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      refreshed,
      finalized,
      totalGrowth,
      message: `Refreshed ${refreshed} submission${refreshed !== 1 ? 's' : ''}, finalized ${finalized}`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
