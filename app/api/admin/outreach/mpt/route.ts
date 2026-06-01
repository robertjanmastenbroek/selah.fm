import { NextResponse } from 'next/server';
import { pollMptTask } from '@/lib/video-generator';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/outreach/mpt?action=status&task_id=...
 * Polls MPT task status and updates instagram_posts when complete.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('task_id');
  const postId = searchParams.get('post_id');

  if (!taskId) {
    return NextResponse.json({ error: 'task_id required' }, { status: 400 });
  }

  try {
    const result = await pollMptTask(taskId);

    // If video completed and we have a post_id, update the DB
    if (result.status === 'completed' && result.videoUrl && postId) {
      await sql`
        UPDATE instagram_posts 
        SET status = 'pending_review', video_url = ${result.videoUrl}, error_message = NULL
        WHERE id = ${postId}
      `;
    }

    if (result.status === 'failed' && postId) {
      await sql`
        UPDATE instagram_posts 
        SET status = 'failed', error_message = ${result.error || 'MPT render failed'}
        WHERE id = ${postId}
      `;
    }

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
