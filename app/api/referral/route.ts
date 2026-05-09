import { NextResponse } from 'next/server';
import sql from '@/lib/db';

// Referral system: existing users get a shareable link
// New users who sign up via referral get a bonus
// Referring user earns commission on their first campaign

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    // Track referral click
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_URL || 'https://selah.fm'}/login?ref=${code}`);
  }

  return NextResponse.json({ error: 'Missing referral code' }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const { referrerId, referredEmail } = await request.json();
    
    if (!referrerId || !referredEmail) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Check if referral already exists
    const existing = await sql`
      SELECT id FROM referrals 
      WHERE referred_email = ${referredEmail}
    `;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Already referred' }, { status: 409 });
    }

    // Create referral record
    await sql`
      INSERT INTO referrals (referrer_id, referred_email, status)
      VALUES (${referrerId}, ${referredEmail}, 'pending')
    `;

    // Bonus: add $5 credit to referrer's campaign budget
    await sql`
      UPDATE campaigns 
      SET total_budget_cents = total_budget_cents + 500,
          budget_remaining_cents = budget_remaining_cents + 500
      WHERE artist_id = ${referrerId}
      LIMIT 1
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Referral tracked. $5 bonus added to your active campaign.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
