import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

/**
 * Middleware for API routes that require authentication
 * Usage in API route:
 *
 * export async function GET(request: NextRequest) {
 *   const session = await requireApiAuth()
 *   // ... your logic
 * }
 */
export async function requireApiAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  return session;
}

/**
 * Helper to return unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json(
    { error: { message, code: 'UNAUTHORIZED' } },
    { status: 401 }
  );
}
