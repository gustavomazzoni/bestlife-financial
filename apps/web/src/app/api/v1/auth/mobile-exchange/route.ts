import { NextRequest, NextResponse } from 'next/server';
import { getOptionalSession } from '@/lib/auth/session';
import { encodeMobileToken } from '@/lib/auth/mobile-token';

/**
 * Bridges the web-based NextAuth email magic-link flow into a mobile
 * bearer token. Unlike the rest of /api/v1/*, this is a redirect-issuing
 * endpoint, not a JSON API — it's the `callbackUrl` the mobile app's
 * sign-in request points at, so it runs in the browser context right
 * after NextAuth verifies the magic link and sets the session cookie.
 *
 * `returnUrl` must be the mobile app's own deep link (computed via
 * `Linking.createURL()` on device, which varies between Expo Go and a
 * standalone build) — never a plain http(s) URL, to avoid this endpoint
 * being usable as an open redirect.
 */
export async function GET(request: NextRequest) {
  const returnUrl = request.nextUrl.searchParams.get('returnUrl');

  if (!returnUrl || !isAllowedMobileReturnUrl(returnUrl)) {
    return NextResponse.redirect(new URL('/login?error=mobile', request.url));
  }

  const session = await getOptionalSession();
  if (!session?.user?.id) {
    return NextResponse.redirect(
      appendParam(returnUrl, 'error', 'unauthenticated')
    );
  }

  const token = await encodeMobileToken({
    sub: session.user.id,
    email: session.user.email,
  });

  return NextResponse.redirect(appendParam(returnUrl, 'token', token));
}

function isAllowedMobileReturnUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Must be a native app deep link, not a web URL — blocks using this
    // endpoint to redirect to an arbitrary attacker-controlled website.
    return parsed.protocol !== 'http:' && parsed.protocol !== 'https:';
  } catch {
    return false;
  }
}

function appendParam(url: string, key: string, value: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${key}=${encodeURIComponent(value)}`;
}
