import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { submissionId, status } = await request.json();
    
    // If approving, calculate payout
    if (status === 'approved') {
      // Get submission + campaign CPM
      const subs = await sql`
        SELECT s.views_verified, c.cpm_rate_cents, c.max_payout_per_submission_cents
        FROM submissions s
        JOIN campaigns c ON c.id = s.campaign_id
        WHERE s.id = ${submissionId}
      `;
      if (subs.length > 0) {
        const { views_verified, cpm_rate_cents, max_payout_per_submission_cents } = subs[0];
        const views = parseInt(views_verified || '0');
        let grossCents = Math.round((views / 1000) * cpm_rate_cents);
        
        // Apply max payout cap
        if (max_payout_per_submission_cents && grossCents > max_payout_per_submission_cents) {
          grossCents = max_payout_per_submission_cents;
        }
        
        // Deduct 20% platform fee
        const platformFeeCents = Math.round(grossCents * 0.20);
        const netCents = grossCents - platformFeeCents;
        
        const result = await sql`
          UPDATE submissions
          SET review_status = 'approved', reviewed_at = NOW(),
              payout_amount_cents = ${netCents}
          WHERE id = ${submissionId}
          RETURNING *
        `;
        return NextResponse.json(result[0]);
      }
    }

    // Rejection or fallback
    const result = await sql`
      UPDATE submissions
      SET review_status = ${status}, reviewed_at = NOW()
      WHERE id = ${submissionId}
      RETURNING *
    `;
    return NextResponse.json(result[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
