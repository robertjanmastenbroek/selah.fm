import { NextRequest } from 'next/server';
import { adminMiddleware } from '@/lib/admin';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return adminMiddleware(request);
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
