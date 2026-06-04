import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/c/[slug]/stream
 * SSE endpoint — pushes live campaign updates (donations, submissions).
 * Polls DB every 3 seconds, sends events when data changes.
 */
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;

  // Get initial state
  const [campaign] = await sql`
    SELECT id, total_budget_cents, budget_remaining_cents,
           (SELECT COUNT(*)::int FROM submissions s WHERE s.campaign_id = campaigns.id AND s.review_status = 'approved') as submission_count
    FROM campaigns WHERE slug = ${slug} OR id = ${slug}
    LIMIT 1
  `;

  if (!campaign) {
    return new Response('Not found', { status: 404 });
  }

  const campaignId = campaign.id;
  let lastDonationCount = 0;
  let lastSubmissionCount = campaign.submission_count || 0;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', campaignId })}\n\n`));

      const poll = async () => {
        try {
          // Check for new donations
          const [donationStats] = await sql`
            SELECT COUNT(*)::int as count, COALESCE(SUM(amount_cents), 0)::int as total_cents
            FROM campaign_donations
            WHERE campaign_id = ${campaignId} AND created_at > NOW() - INTERVAL '5 seconds'
          `;

          if (donationStats && donationStats.count > 0) {
            lastDonationCount += donationStats.count;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'donation',
              count: donationStats.count,
              total_cents: donationStats.total_cents,
              total_donations: lastDonationCount,
            })}\n\n`));
          }

          // Check for new submissions
          const [subStats] = await sql`
            SELECT COUNT(*)::int as count
            FROM submissions
            WHERE campaign_id = ${campaignId}
              AND review_status = 'approved'
              AND created_at > NOW() - INTERVAL '5 seconds'
          `;

          if (subStats && subStats.count > 0) {
            lastSubmissionCount += subStats.count;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'submission',
              count: subStats.count,
              total_submissions: lastSubmissionCount,
            })}\n\n`));
          }

          // Keepalive every 10s
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch (err) {
          // Stream error — connection will be retried by client
        }
      };

      // Poll every 3 seconds
      const interval = setInterval(poll, 3000);
      poll(); // Initial poll

      // Cleanup on cancel
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
