import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    // Seed demo creators
    await sql`
      INSERT INTO users (id, email, password_hash, user_type, display_name, bio, genres, preferred_cpm_cents, tiktok_handle, instagram_handle)
      VALUES 
        ('d0000000-0000-0000-0000-000000000001', 'mia@selah-demo.fm', 'demo', 'creator', 'Mia Johnson', 'Music + lifestyle creator. 28K on TikTok.', 'pop,electronic', 200, '@creatormia', '@mia.reels'),
        ('d0000000-0000-0000-0000-000000000002', 'jake@selah-demo.fm', 'demo', 'creator', 'Jake Miller', 'Dance creator. 45K followers on TikTok.', 'edm,techno,house', 300, '@dancewithjake', '@jakemoves'),
        ('d0000000-0000-0000-0000-000000000003', 'rachel@selah-demo.fm', 'demo', 'creator', 'Rachel T', 'Reels creator. 35K on Instagram.', 'pop,hiphop', 350, '@viralqueen', '@rachelcreates'),
        ('d0000000-0000-0000-0000-000000000004', 'tom@selah-demo.fm', 'demo', 'creator', 'Tom Wells', 'YouTube Shorts creator. Music promo niche.', 'edm,techno', 250, '@shortsguy', '@tomwells'),
        ('d0000000-0000-0000-0000-000000000005', 'alex@selah-demo.fm', 'demo', 'creator', 'Alex + Sam', 'Couple creators. Brand partnerships.', 'pop,electronic,indie', 400, '@reelmasters', '@alexsamcreates')
      ON CONFLICT DO NOTHING
    `;

    // Seed demo campaigns
    await sql`
      INSERT INTO campaigns (id, artist_id, track_title, track_url, cpm_rate_cents, total_budget_cents, max_payout_per_submission_cents, budget_remaining_cents, platforms, status, requirements, recommended_hashtags)
      VALUES 
        ('d0000000-1000-4000-8000-000000000001', NULL, 'Midnight Frequencies', 'https://open.spotify.com/track/demo1', 300, 50000, 10000, 50000, ARRAY['tiktok','instagram','youtube'], 'active', '15+ sec video. Use the track as background audio.', '#electronicmusic #indieartist'),
        ('d0000000-1000-4000-8000-000000000002', NULL, 'Desert Wind', 'https://open.spotify.com/track/demo2', 250, 30000, 7500, 30000, ARRAY['tiktok','instagram'], 'active', 'Dance, lifestyle, or aesthetic content.', '#edm #techno'),
        ('d0000000-1000-4000-8000-000000000003', NULL, 'Summer Nights', 'https://open.spotify.com/track/demo3', 350, 40000, 8000, 40000, ARRAY['tiktok','youtube'], 'active', 'Sunset, road trip, beach vibes.', '#pop #summervibes')
      ON CONFLICT DO NOTHING
    `;

    const users = await sql`SELECT count(*) FROM users`;
    const campaigns = await sql`SELECT count(*) FROM campaigns`;
    return NextResponse.json({ seeded: true, users: users[0].count, campaigns: campaigns[0].count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
