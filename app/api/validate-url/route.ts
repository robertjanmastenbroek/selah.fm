import { NextResponse } from 'next/server';
import { isValidSubmissionUrl } from '@/lib/validation';

/**
 * POST /api/validate-url
 * Check if a URL is from an approved platform.
 * Called client-side before form submission for instant feedback.
 */
export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    const result = isValidSubmissionUrl(url);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ valid: false, error: 'Invalid request' });
  }
}
