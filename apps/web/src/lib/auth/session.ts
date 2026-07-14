import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './config';
import { decodeMobileToken } from './mobile-token';
import { UnauthorizedError } from '../api/response';

/**
 * Mobile clients have no cookie jar shared with the API's domain, so they
 * authenticate via `Authorization: Bearer <mobile token>` instead of the
 * session cookie. Checked only when there's no cookie session, so this
 * never runs on the (cookie-based) web request path.
 */
async function getBearerUserId(): Promise<string | null> {
  let hdrs: Awaited<ReturnType<typeof headers>>;
  try {
    hdrs = await headers();
  } catch {
    // headers() throws when called outside a real Next.js request context
    // (e.g. a test invoking a route handler directly) — no request means
    // no bearer token, not an error.
    return null;
  }

  const authHeader = hdrs.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;

  const payload = await decodeMobileToken(token);
  return payload?.sub ?? null;
}

/**
 * Server-side function to require authentication
 * Throws error if user is not authenticated
 */
export async function requireAuth(): Promise<{ user: { id: string } }> {
  const session = await auth();
  if (session?.user?.id) return session;

  const bearerUserId = await getBearerUserId();
  if (bearerUserId) return { user: { id: bearerUserId } };

  throw new UnauthorizedError();
}

/**
 * Server-side function to get current user ID
 * Throws error if user is not authenticated
 */
export async function getUserId(): Promise<string> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  const bearerUserId = await getBearerUserId();
  if (bearerUserId) return bearerUserId;

  throw new UnauthorizedError();
}

/**
 * Client-side function to get current user ID
 * Redirects to login if not authenticated
 */
export async function getUserIdOrRedirect(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  return session.user.id;
}

/**
 * Server-side function to get optional session
 * Returns null if not authenticated
 */
export async function getOptionalSession() {
  return await auth();
}

/**
 * Check if user is authenticated (boolean)
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await auth();
  return !!session?.user?.id;
}
