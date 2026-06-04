import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateCaption, generateDMTemplate } from '@/lib/video-generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * POST /api/mpt/generate
 * 
 * Local-only endpoint — generates outreach video via MPT and uploads to Supabase Storage.
 * Called from the browser dashboard when MPT is detected locally.
 * 
 * Body: { artistName, trackName, genre, coverArtUrl, campaignSlug, instagramHandle }
 * Returns: { videoUrl, caption, dmTemplate }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = {
      artistName: body.artistName,
      trackName: body.trackName,
      genre: body.genre || 'indie',
      coverArtUrl: body.coverArtUrl,
      campaignSlug: body.campaignSlug,
      instagramHandle: body.instagramHandle,
    };

    // Step 1: Generate script via DeepSeek
    const script = await generateScript(input);

    // Step 2: Submit to MPT
    console.log(`[mpt/generate] Submitting to MPT for ${input.artistName}...`);
    const mptRes = await fetch('http://localhost:8080/api/v1/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_subject: `${input.artistName} — "${input.trackName}" | Selah.fm`,
        video_script: script,
        video_aspect: 'portrait',
        voice_name: 'en-US-EmmaMultilingualNeural',
        bgm_name: 'random',
        font_name: 'STHeitiMedium 黑体-中',
        text_color: '#FFFFFF',
        font_size: 60,
        stroke_color: '#000000',
        stroke_width: 1.5,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!mptRes.ok) {
      console.error(`[mpt/generate] MPT returned ${mptRes.status}`);
      return NextResponse.json({ error: `MPT returned ${mptRes.status}` }, { status: 502 });
    }

    const mptData = await mptRes.json();
    const taskId = mptData.data?.task_id;
    if (!taskId) {
      return NextResponse.json({ error: 'No task_id from MPT' }, { status: 502 });
    }

    // Step 3: Poll MPT for completion
    console.log(`[mpt/generate] Polling task ${taskId.slice(0, 8)}...`);
    let videoUrl: string | null = null;
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const pollRes = await fetch(`http://localhost:8080/api/v1/tasks/${taskId}`, {
          signal: AbortSignal.timeout(10000),
        });
        if (!pollRes.ok) continue;

        const pollData = await pollRes.json();
        const task = pollData.data || pollData;
        const state = task.state || task.status;

        if (state === 'completed' || state === 'success') {
          const videos = task.videos || task.combined_videos || [];
          if (videos.length > 0) {
            videoUrl = typeof videos[0] === 'string' ? videos[0] : videos[0].url || videos[0].uri;
          }
          break;
        }

        if (state === 'failed' || state === 'error') {
          console.error(`[mpt/generate] Task failed:`, task.error);
          return NextResponse.json({ error: 'MPT render failed' }, { status: 502 });
        }
      } catch (e: any) { console.error('Unhandled error in api/mpt/generate/route.ts:', e); }
    }

    if (!videoUrl) {
      return NextResponse.json({ error: 'MPT render timed out' }, { status: 504 });
    }

    // Step 4: Download video from MPT and upload to Supabase Storage
    console.log(`[mpt/generate] Downloading video from MPT...`);
    const videoRes = await fetch(videoUrl, { signal: AbortSignal.timeout(30000) });
    if (!videoRes.ok) {
      return NextResponse.json({ error: 'Failed to download video from MPT' }, { status: 502 });
    }

    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
    const videoId = `${input.campaignSlug.slice(0, 40)}-${Date.now().toString(36)}.mp4`;

    // Upload to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Ensure bucket exists
    await supabase.storage.createBucket('outreach-videos', { public: true, fileSizeLimit: 52428800 }).catch(e => console.error('Async error in api/mpt/generate/route.ts:', e));

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('outreach-videos')
      .upload(videoId, videoBuffer, { contentType: 'video/mp4', upsert: true });

    if (uploadError) {
      console.error('[mpt/generate] Upload error:', uploadError.message);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage.from('outreach-videos').getPublicUrl(videoId);
    console.log(`[mpt/generate] ✅ Uploaded: ${publicUrl.publicUrl.slice(0, 60)}...`);

    // Step 5: Generate caption + DM
    const caption = generateCaption(input);
    const dmTemplate = await generateDMTemplate(input);

    return NextResponse.json({
      videoUrl: publicUrl.publicUrl,
      caption,
      dmTemplate,
      script,
    });
  } catch (e: any) {
    console.error('[mpt/generate] Error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function generateScript(input: any): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return `Independent artist ${input.artistName} just dropped "${input.trackName}". We built a campaign page — creators earn per view making TikToks. Zero upfront cost. Link in bio.`;

  try {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Write a 15-25 second video script for music promotion. Return ONLY the script.' },
          { role: 'user', content: `Artist: ${input.artistName}\nTrack: "${input.trackName}"\nHook then explain: campaign page exists, creators earn per view, artist pays only for verified views.` },
        ],
        temperature: 0.85, max_tokens: 200,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim() || '';
    }
  } catch (e: any) { console.error('Unhandled error in api/mpt/generate/route.ts:', e); }

  return `This is ${input.artistName}. "${input.trackName}" deserves more ears. Campaign page built — creators earn per view. Zero upfront cost. Link in bio.`;
}
