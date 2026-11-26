import { NextResponse, type NextRequest } from 'next/server';

/**
 * Redirects signed-out users away from /student, /teacher and /admin.
 * This is a convenience only — every API call is authorised server-side.
 */
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has('access_token') || req.cookies.has('refresh_token');
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/student/:path*', '/teacher/:path*', '/admin/:path*'],
};
