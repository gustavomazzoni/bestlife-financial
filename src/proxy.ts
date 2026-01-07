import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

export default auth(req => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  console.log('isAuthenticated?', isAuthenticated);

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/verify-request', '/error'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  console.log('isPublicRoute? and pathname', isPublicRoute, pathname);

  // API routes (will handle auth internally)
  const isApiRoute = pathname.startsWith('/api/');

  // If trying to access protected route without auth, redirect to login
  if (!isAuthenticated && !isPublicRoute && !isApiRoute) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access login, redirect to dashboard
  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

// Configure which routes to run proxy on
export const config = {
  // runtime: 'nodejs', // it was necessary before migrating from middleware to proxy.ts
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
