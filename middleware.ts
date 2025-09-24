import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Apply aggressive caching headers for static assets
  const pathname = request.nextUrl.pathname;

  // Cache static assets like images, fonts, etc.
  if (
    pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|ico|woff|woff2|ttf|otf|eot)$/)
  ) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    response.headers.set('X-Content-Type-Options', 'nosniff');
  }

  // Cache Next.js static files
  if (pathname.startsWith('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // Cache uploaded media from blob storage with shorter cache for user content
  if (
    pathname.includes('blob.core.windows.net') || 
    pathname.includes('vercel-storage.com') ||
    pathname.startsWith('/api/upload')
  ) {
    response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=2592000');
    response.headers.set('X-Content-Type-Options', 'nosniff');
  }

  // Add performance and security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};