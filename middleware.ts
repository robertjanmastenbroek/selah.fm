import { NextRequest } from 'next/server';

// Admin is managed client-side in the layout. Middleware just passes through.
export function middleware(request: NextRequest) {}

export const config = { matcher: ['/admin/:path*'] };
