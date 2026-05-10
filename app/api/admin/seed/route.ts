import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: Request) {
  try {
    // ── Ensure schema exists (create tables and columns if missing) ──
    await sql`CREATE TABLE IF NOT EXISTS notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, type TEXT NOT NULL, message TEXT NOT NULL, read BOOLEAN NOT NULL DEFAULT false, link TEXT, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`;
    // Add facebook_handle column if missing on live DB
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook_handle TEXT`;

    // ── Always clean up: fix NULL artist_ids first ───────────
    const artists = await sql`SELECT id FROM users WHERE user_type = 'artist' LIMIT 3`;
    if (artists.length > 0) {
      // Assign orphaned campaigns to artists round-robin
      const orphaned = await sql`SELECT id FROM campaigns WHERE artist_id IS NULL`;
      for (let i = 0; i < orphaned.length; i++) {
        await sql`UPDATE campaigns SET artist_id = ${artists[i % artists.length].id} WHERE id = ${orphaned[i].id}`;
      }
    }

    // ── Clean demo submissions ───────────────────────────────
    await sql`DELETE FROM submissions WHERE content_url LIKE '%tiktok.com%' OR content_url LIKE '%youtube.com%' OR content_url LIKE '%instagram.com%'`;
    await sql`DELETE FROM users WHERE email LIKE '%@selah-demo.fm'`;

    // ── Seed Artists ──────────────────────────────────────────
    await sql`
      INSERT INTO users (id, email, password_hash, user_type, display_name)
      VALUES 
        ('dd000000-0000-0000-0000-000000000001', 'luna@selah-demo.fm', 'demo', 'artist', 'Luna Park'),
        ('dd000000-0000-0000-0000-000000000002', 'synth@selah-demo.fm', 'demo', 'artist', 'Synth Priest'),
        ('dd000000-0000-0000-0000-000000000003', 'holy@selah-demo.fm', 'demo', 'artist', 'Holy Frequencies')
      ON CONFLICT (id) DO NOTHING
    `;

    // ── Seed Creators ─────────────────────────────────────────
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

    // ── Seed Campaigns (linked to artists) ────────────────────
    const ARTIST1 = 'dd000000-0000-0000-0000-000000000001';
    const ARTIST2 = 'dd000000-0000-0000-0000-000000000002';
    const ARTIST3 = 'dd000000-0000-0000-0000-000000000003';

    await sql`
      INSERT INTO campaigns (id, artist_id, track_title, track_url, cpm_rate_cents, total_budget_cents, max_payout_per_submission_cents, budget_remaining_cents, platforms, status, cover_art_url, requirements, recommended_hashtags)
      VALUES 
        ('dd000000-1000-4000-8000-000000000001', ${ARTIST1}, 'Midnight Frequencies', 'https://open.spotify.com/track/demo1', 300, 50000, 10000, 50000, ARRAY['tiktok','instagram','youtube'], 'active', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80', '15+ sec video. Use the track as background audio.', '#electronicmusic #indieartist'),
        ('dd000000-1000-4000-8000-000000000002', ${ARTIST2}, 'Desert Wind', 'https://open.spotify.com/track/demo2', 250, 30000, 7500, 30000, ARRAY['tiktok','instagram'], 'active', 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&q=80', 'Dance, lifestyle, or aesthetic content.', '#edm #techno'),
        ('dd000000-1000-4000-8000-000000000003', ${ARTIST3}, 'Summer Nights', 'https://open.spotify.com/track/demo3', 350, 40000, 8000, 40000, ARRAY['tiktok','youtube'], 'active', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80', 'Sunset, road trip, beach vibes.', '#pop #summervibes'),
        ('dd000000-1000-4000-8000-000000000004', ${ARTIST1}, 'Neon Cathedral', 'https://open.spotify.com/track/demo4', 400, 75000, 15000, 60000, ARRAY['tiktok','youtube'], 'active', 'https://images.unsplash.com/photo-1598653222000-6b9b7a042652?w=800&q=80', 'Dark, moody aesthetic. 30+ seconds.', '#darkelectronic'),
        ('dd000000-1000-4000-8000-000000000005', ${ARTIST2}, 'Crystal Dawn', 'https://open.spotify.com/track/demo5', 200, 20000, 5000, 20000, ARRAY['tiktok','instagram','youtube'], 'active', 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80', 'Morning vibes, coffee, sunrise.', '#organichouse'),
        ('dd000000-1000-4000-8000-000000000006', ${ARTIST3}, 'Bass Cathedral', 'https://open.spotify.com/track/demo6', 500, 100000, 20000, 100000, ARRAY['tiktok','instagram'], 'active', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80', 'High energy. Festival vibes.', '#bassmusic #christianedm')
      ON CONFLICT (id) DO UPDATE SET cover_art_url = EXCLUDED.cover_art_url, artist_id = EXCLUDED.artist_id
    `;

    // ── Seed Submissions ──────────────────────────────────────
    const subCount = await sql`SELECT count(*) FROM submissions`;
    if (parseInt(subCount[0].count) === 0) {
      const campaigns = await sql`SELECT id FROM campaigns ORDER BY created_at DESC LIMIT 3`;
      const creators = await sql`SELECT id FROM users WHERE user_type = 'creator' LIMIT 5`;
      
      if (campaigns.length >= 3 && creators.length >= 3) {
        const [c1, c2, c3] = campaigns.map((c: any) => c.id);
        const [cr1, cr2, cr3, cr4, cr5] = [...creators.map((c: any) => c.id), null, null, null, null, null].slice(0, 5);

        const insert = async (cid: any, crid: any, url: string, plat: string, rs: string, ps: string, views: number, paCents: number | null = null) => {
          if (!cid || !crid) return;
          if (paCents !== null) {
            await sql`
              INSERT INTO submissions (campaign_id, creator_id, content_url, platform, review_status, payout_status, views_verified, payout_amount_cents, views_at_submit, submitted_at, reviewed_at)
              VALUES (${cid}, ${crid}, ${url}, ${plat}, ${rs}, ${ps}, ${views}, ${paCents}, ${views}, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '2 days')
              ON CONFLICT DO NOTHING
            `;
          } else {
            await sql`
              INSERT INTO submissions (campaign_id, creator_id, content_url, platform, review_status, payout_status, views_verified, views_at_submit, submitted_at)
              VALUES (${cid}, ${crid}, ${url}, ${plat}, ${rs}, ${ps}, ${views}, ${views}, NOW() - INTERVAL '1 hour')
              ON CONFLICT DO NOTHING
            `;
          }
        };

        await insert(c1, cr1, 'https://tiktok.com/@creator/video1', 'tiktok', 'pending', 'pending', 3200);
        await insert(c1, cr2, 'https://tiktok.com/@creator/video2', 'tiktok', 'pending', 'pending', 8900);
        await insert(c1, cr3, 'https://instagram.com/reel/demo3', 'instagram', 'approved', 'processing', 12400, 2976);
        await insert(c1, cr1, 'https://tiktok.com/@creator/video4', 'tiktok', 'approved', 'paid', 28500, 6840);
        await insert(c2, cr2, 'https://tiktok.com/@creator/video7', 'tiktok', 'pending', 'pending', 5600);
        await insert(c2, cr4, 'https://youtube.com/shorts/demo8', 'youtube', 'approved', 'paid', 22300, 4460);
        await insert(c3, cr3, 'https://tiktok.com/@creator/video10', 'tiktok', 'approved', 'paid', 45100, 12628);
        await insert(c3, cr5, 'https://tiktok.com/@creator/video11', 'tiktok', 'approved', 'paid', 18300, 5124);
      }
    }

    const users = await sql`SELECT count(*) FROM users`;
    const campaigns = await sql`SELECT count(*) FROM campaigns`;
    const submissions = await sql`SELECT count(*) FROM submissions`;
    return NextResponse.json({ seeded: true, users: users[0].count, campaigns: campaigns[0].count, submissions: submissions[0].count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
