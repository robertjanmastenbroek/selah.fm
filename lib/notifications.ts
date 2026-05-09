import { NextResponse } from 'next/server';
import sql from '@/lib/db';

/**
 * Create a notification for a user.
 * Called internally by other API routes (submissions, review, payouts).
 */
export async function createNotification(params: {
  userId: string;
  type: 'submission' | 'approval' | 'rejection' | 'earning' | 'payout' | 'system';
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}) {
  try {
    await sql`
      INSERT INTO notifications (user_id, type, message, link, metadata)
      VALUES (${params.userId}, ${params.type}, ${params.message}, ${params.link || null}, ${JSON.stringify(params.metadata || {})})
    `;
  } catch (e: any) {
    console.error('Failed to create notification:', e.message);
  }
}
