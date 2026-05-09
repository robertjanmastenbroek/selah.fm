import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    // Seed demo creators with profile images
    await sql`
      INSERT INTO users (id, email, password_hash, user_type, display_name, bio, genres, preferred_cpm_cents, tiktok_handle, instagram_handle, profile_image_url)
      VALUES 
        ('d0000000-0000-0000-0000-000000000001', 'mia@selah-demo.fm', 'demo', 'creator', 'Mia Johnson', 'Music + lifestyle creator. 28K on TikTok.', 'pop,electronic', 200, '@creatormia', '@mia.reels', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face'),
        ('d0000000-0000-0000-0000-000000000002', 'jake@selah-demo.fm', 'demo', 'creator', 'Jake Miller', 'Dance creator. 45K followers on TikTok.', 'edm,techno,house', 300, '@dancewithjake', '@jakemoves', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face'),
        ('d0000000-0000-0000-0000-000000000003', 'rachel@selah-demo.fm', 'demo', 'creator', 'Rachel T', 'Reels creator. 35K on Instagram.', 'pop,hiphop', 350, '@viralqueen', '@rachelcreates', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face'),
        ('d0000000-0000-0000-0000-000000000004', 'tom@selah-demo.fm', 'demo', 'creator', 'Tom Wells', 'YouTube Shorts creator. Music promo niche.', 'edm,techno', 250, '@shortsguy', '@tomwells', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face'),
        ('d0000000-0000-0000-0000-000000000005', 'alex@selah-demo.fm', 'demo', 'creator', 'Alex + Sam', 'Couple creators. Brand partnerships.', 'pop,electronic,indie', 400, '@reelmasters', '@alexsamcreates', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop&crop=face')
      ON CONFLICT (id) DO UPDATE SET profile_image_url = EXCLUDED.profile_image_url
    `;

    // Seed demo campaigns with cover art
    await sql`
      INSERT INTO campaigns (id, artist_id, track_title, track_url, cpm_rate_cents, total_budget_cents, max_payout_per_submission_cents, budget_remaining_cents, platforms, status, cover_art_url, requirements, recommended_hashtags)
      VALUES 
        ('d0000000-1000-4000-8000-000000000001', NULL, 'Midnight Frequencies', 'https://open.spotify.com/track/demo1', 300, 50000, 10000, 50000, ARRAY['tiktok','instagram','youtube'], 'active', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80', '15+ sec video. Use the track as background audio.', '#electronicmusic #indieartist'),
        ('d0000000-1000-4000-8000-000000000002', NULL, 'Desert Wind', 'https://open.spotify.com/track/demo2', 250, 30000, 7500, 30000, ARRAY['tiktok','instagram'], 'active', 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&q=80', 'Dance, lifestyle, or aesthetic content.', '#edm #techno'),
        ('d0000000-1000-4000-8000-000000000003', NULL, 'Summer Nights', 'https://open.spotify.com/track/demo3', 350, 40000, 8000, 40000, ARRAY['tiktok','youtube'], 'active', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80', 'Sunset, road trip, beach vibes.', '#pop #summervibes'),
        ('d0000000-1000-4000-8000-000000000004', NULL, 'Neon Cathedral', 'https://open.spotify.com/track/demo4', 400, 75000, 15000, 60000, ARRAY['tiktok','youtube'], 'active', 'https://images.unsplash.com/photo-1598653222000-6b9b7a042652?w=800&q=80', 'Dark, moody aesthetic. 30+ seconds.', '#darkelectronic'),
        ('d0000000-1000-4000-8000-000000000005', NULL, 'Crystal Dawn', 'https://open.spotify.com/track/demo5', 200, 20000, 5000, 20000, ARRAY['tiktok','instagram','youtube'], 'active', 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80', 'Morning vibes, coffee, sunrise.', '#organichouse'),
        ('d0000000-1000-4000-8000-000000000006', NULL, 'Bass Cathedral', 'https://open.spotify.com/track/demo6', 500, 100000, 20000, 100000, ARRAY['tiktok','instagram'], 'active', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80', 'High energy. Festival vibes.', '#bassmusic #christianedm')
      ON CONFLICT (id) DO UPDATE SET cover_art_url = EXCLUDED.cover_art_url
    `;

    // Ensure all demo campaigns have cover art (patch any that don't)
    await sql`
      UPDATE campaigns SET cover_art_url = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80' WHERE track_title = 'Midnight Frequencies' AND (cover_art_url IS NULL OR cover_art_url = '')
    `;
    await sql`
      UPDATE campaigns SET cover_art_url = 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&q=80' WHERE track_title = 'Desert Wind' AND (cover_art_url IS NULL OR cover_art_url = '')
    `;
    await sql`
      UPDATE campaigns SET cover_art_url = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80' WHERE track_title = 'Summer Nights' AND (cover_art_url IS NULL OR cover_art_url = '')
    `;

    const users = await sql`SELECT count(*) FROM users`;
    const campaigns = await sql`SELECT count(*) FROM campaigns`;
    return NextResponse.json({ seeded: true, users: users[0].count, campaigns: campaigns[0].count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
