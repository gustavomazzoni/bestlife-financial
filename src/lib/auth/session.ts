import { redirect } from 'next/navigation';
import { auth } from './config';
import { UnauthorizedError } from '../api/response';

/**
 * Server-side function to require authentication
 * Throws error if user is not authenticated
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  return session;
}

/**
 * Server-side function to get current user ID
 * Throws error if user is not authenticated
 */
export async function getUserId(): Promise<string> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  return session.user.id;
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
