import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/outreach/instagram
 * 
 * Returns the Instagram outreach queue: artists with IG handles, campaigns,
 * and no outreach log entry yet. Sorted by random for variety.
 * 
 * Query params:
 *  ?limit=20 — max results
 *  ?status=pending|sent|replied|claimed — filter
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '30');
  const status = searchParams.get('status') || 'pending';

  try {
    if (status === 'pending') {
      // Artists ready for outreach (have IG, have campaign, not yet sent)
      const queue = await sql`
        SELECT 
          da.id as artist_id,
          da.artist_name,
          da.latest_track_name as track_name,
          aa.instagram_handle,
          c.id as campaign_id,
          c.slug as campaign_slug,
          c.cover_art_url,
          c.cpm_rate_cents,
          da.genres,
          COALESCE(aa.instagram_followers, 0) as ig_followers
        FROM artist_audits aa
        JOIN discovered_artists da ON da.id = aa.discovered_artist_id
        JOIN campaign_claims cc ON cc.discovered_artist_id = da.id
        JOIN campaigns c ON c.id = cc.campaign_id
        WHERE aa.instagram_handle IS NOT NULL 
          AND aa.instagram_handle != ''
          AND (aa.email_address IS NULL OR aa.email_address = '')
          AND aa.bounced_at IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM instagram_outreach_log iol 
            WHERE iol.discovered_artist_id = aa.discovered_artist_id
          )
        ORDER BY RANDOM()
        LIMIT ${limit}
      `;
      return NextResponse.json({ queue, total: queue.length });
    }

    // History: already sent/replied/claimed
    const history = await sql`
      SELECT 
        iol.*,
        da.artist_name,
        da.latest_track_name as track_name,
        c.slug as campaign_slug
      FROM instagram_outreach_log iol
      LEFT JOIN discovered_artists da ON da.id = iol.discovered_artist_id
      LEFT JOIN campaigns c ON c.id = iol.campaign_id
      WHERE iol.response_type = ${status}
      ORDER BY iol.created_at DESC
      LIMIT ${limit}
    `;
    return NextResponse.json({ history, total: history.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/outreach/instagram
 * 
 * Actions:
 *  { action: "generate_caption", artist_id } → returns IG caption text
 *  { action: "generate_dm", artist_id } → returns DM message text
 *  { action: "log_sent", artist_id, campaign_id, ig_handle, message } → records sent DM
 *  { action: "log_response", outreach_id, response_type } → updates response
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'generate_caption' || action === 'generate_dm') {
      const [artist] = await sql`
        SELECT da.artist_name, da.latest_track_name as track_name, aa.instagram_handle,
               c.slug as campaign_slug
        FROM artist_audits aa
        JOIN discovered_artists da ON da.id = aa.discovered_artist_id
        JOIN campaign_claims cc ON cc.discovered_artist_id = da.id
        JOIN campaigns c ON c.id = cc.campaign_id
        WHERE aa.discovered_artist_id = ${body.artist_id}
        LIMIT 1
      `;
      if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

      const campaignUrl = `https://selah.fm/c/${artist.campaign_slug}?utm_source=instagram&utm_medium=dm`;

      if (action === 'generate_caption') {
        const caption = `🎵 "${artist.track_name}" by ${artist.artist_name}

We discovered this track and built a campaign page for it — creators can make TikToks & Reels with this song and earn per view.

The artist pays only for verified views. Zero upfront cost.

👉 ${campaignUrl}

#independentartist #musicpromotion #selahfm #newmusic #${(artist.artist_name || '').replace(/\s+/g, '').toLowerCase()}`;

        return NextResponse.json({ caption, campaign_url: campaignUrl, artist_handle: artist.instagram_handle });
      }

      if (action === 'generate_dm') {
        // Use DeepSeek for personalized DM generation
        const apiKey = process.env.DEEPSEEK_API_KEY;
        let dmText = '';

        if (apiKey) {
          try {
            const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                  { role: 'system', content: `You are Robert-Jan Mastenbroek, founder of Selah.fm — a CPM marketplace where artists set budgets and creators earn per verified view. Write a short, warm, personal Instagram DM to an artist. 

VOICE: Warm, direct, a little rough around the edges. Use contractions ALWAYS. Start with And/But/So/Because. Mix 3-word punchy sentences with longer ones. NEVER use: furthermore, moreover, game-changer, revolutionary, leverage, empower.

RULES:
- Mention their track by name in the first sentence
- Tell them you built a campaign page for it
- Explain in 1-2 sentences: creators make TikToks/Reels with their song, artist pays only for verified views
- Include the campaign URL
- Soft close: "no pressure, just claim it when ready"
- Sign as: — Robert-Jan (founder, Selah.fm)
- Under 120 words
- Return ONLY the message text, no JSON, no quotes.` },
                  { role: 'user', content: `Artist: ${artist.artist_name}\nTrack: "${artist.track_name}"\nCampaign: ${campaignUrl}\nInstagram: @${artist.instagram_handle}` },
                ],
                temperature: 0.9,
                max_tokens: 300,
              }),
            });
            if (res.ok) {
              const data = await res.json();
              dmText = data.choices?.[0]?.message?.content?.trim() || '';
            }
          } catch {}
        }

        // Fallback if DeepSeek fails
        if (!dmText) {
          dmText = `Hey ${artist.artist_name} — I came across "${artist.track_name}" and built a campaign page for it on Selah.fm.\n\nHere's the deal: creators can make TikToks or Reels with your song and earn per view. You only pay for verified views. No upfront cost.\n\n👉 ${campaignUrl}\n\nNo pressure at all. Just claim it whenever you want.\n\n— Robert-Jan (founder, Selah.fm)`;
        }

        return NextResponse.json({ dm: dmText, campaign_url: campaignUrl });
      }
    }

    if (action === 'log_sent') {
      const [log] = await sql`
        INSERT INTO instagram_outreach_log (discovered_artist_id, campaign_id, instagram_handle, message_text, dm_sent_at, response_type)
        VALUES (${body.artist_id}, ${body.campaign_id}, ${body.ig_handle}, ${body.message}, NOW(), 'sent')
        RETURNING *
      `;
      
      // Also mark artist status
      await sql`UPDATE discovered_artists SET status = 'ig_outreach_sent', updated_at = NOW() WHERE id = ${body.artist_id}`;
      
      return NextResponse.json({ ok: true, log });
    }

    if (action === 'log_response') {
      await sql`
        UPDATE instagram_outreach_log 
        SET response_type = ${body.response_type}, response_at = NOW()
        WHERE id = ${body.outreach_id}
      `;
      
      if (body.response_type === 'claimed') {
        const [log] = await sql`SELECT discovered_artist_id FROM instagram_outreach_log WHERE id = ${body.outreach_id}`;
        if (log) {
          await sql`UPDATE discovered_artists SET status = 'claimed', updated_at = NOW() WHERE id = ${log.discovered_artist_id}`;
        }
      }
      
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
