import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

export default auth(req => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;
  const onboardingCompleted = req.auth?.user?.onboardingCompleted ?? false;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/verify-request', '/error'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // API routes (will handle auth internally)
  const isApiRoute = pathname.startsWith('/api/');

  // If trying to access protected route without auth, redirect to login
  if (!isAuthenticated && !isPublicRoute && !isApiRoute) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access root or login, redirect to dashboard
  if (isAuthenticated && ['/', '/login'].includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If authenticated but onboarding not complete, redirect to /onboarding
  // Allow /onboarding itself and API routes through
  if (
    isAuthenticated &&
    !onboardingCompleted &&
    !isApiRoute &&
    pathname !== '/onboarding'
  ) {
    return NextResponse.redirect(new URL('/onboarding', req.url));
  }

  // If onboarding completed and trying to access onboarding, redirect to dashboard
  if (onboardingCompleted && pathname === '/onboarding') {
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
