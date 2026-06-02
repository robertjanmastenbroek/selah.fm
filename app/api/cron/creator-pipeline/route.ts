import { NextResponse } from 'next/server';
import { discoverTikTokCreators, discoverYouTubeCreators, storeDiscoveredCreators } from '@/lib/creator-discovery';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Creator discovery pipeline cron.
 * Discovers creators from TikTok and YouTube, stores new ones in the database.
 * Runs at UTC 5 and 17 via the dispatcher.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const log: string[] = [];
  let totalStored = 0;

  try {
    // TikTok
    try {
      const tiktokCreators = await discoverTikTokCreators(20);
      if (tiktokCreators.length > 0) {
        const stored = await storeDiscoveredCreators(tiktokCreators);
        totalStored += stored;
        log.push(`TikTok: found ${tiktokCreators.length}, stored ${stored} new`);
      } else {
        log.push('TikTok: no creators found (API may be rate-limiting)');
      }
    } catch (e: any) {
      log.push(`TikTok error: ${e.message?.slice(0, 80)}`);
    }

    // YouTube Shorts
    try {
      const youtubeCreators = await discoverYouTubeCreators(10);
      if (youtubeCreators.length > 0) {
        const stored = await storeDiscoveredCreators(youtubeCreators);
        totalStored += stored;
        log.push(`YouTube: found ${youtubeCreators.length}, stored ${stored} new`);
      } else {
        log.push('YouTube: no creators found');
      }
    } catch (e: any) {
      log.push(`YouTube error: ${e.message?.slice(0, 80)}`);
    }

    return NextResponse.json({
      stored: totalStored,
      log,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, log }, { status: 500 });
  }
}
