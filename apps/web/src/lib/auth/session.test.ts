import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { requireAuth, getUserId, isAuthenticated } from './session';
import { auth } from './config';
import { headers } from 'next/headers';
import { decodeMobileToken } from './mobile-token';

vi.mock('./config', () => ({
  auth: vi.fn(),
}));

// No cookie session in these tests should fall through to the bearer-token
// check and find nothing, not throw — mock a request with no Authorization
// header (next/headers only works inside a real Next.js request context).
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock('./mobile-token', () => ({
  decodeMobileToken: vi.fn(),
}));

const mockedAuth = vi.mocked(auth as Mock); // type auth function to Mock to handle Promise<null> from async function
const mockedHeaders = vi.mocked(headers);
const mockedDecodeMobileToken = vi.mocked(decodeMobileToken);

describe('Auth Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedHeaders.mockResolvedValue(new Headers());
  });

  it('requireAuth throws when not authenticated', async () => {
    mockedAuth.mockResolvedValue(null);
    await expect(requireAuth()).rejects.toThrow('Unauthorized');
  });

  it('requireAuth returns session when authenticated', async () => {
    const mockSession = { user: { id: 'user_123', email: 'test@example.com' } };
    mockedAuth.mockResolvedValue(mockSession);
    const result = await requireAuth();
    expect(result).toEqual(mockSession);
  });

  it('getUserId redirects when not authenticated', async () => {
    mockedAuth.mockResolvedValue(null);
    // Would redirect in actual usage
    await expect(getUserId()).rejects.toThrow();
  });

  it('isAuthenticated returns boolean', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'user_123' } });
    expect(await isAuthenticated()).toBe(true);

    mockedAuth.mockResolvedValue(null);
    expect(await isAuthenticated()).toBe(false);
  });

  describe('bearer token fallback (mobile clients)', () => {
    it('getUserId falls back to a valid Authorization: Bearer token', async () => {
      mockedAuth.mockResolvedValue(null);
      mockedHeaders.mockResolvedValue(
        new Headers({ authorization: 'Bearer valid.mobile.token' })
      );
      mockedDecodeMobileToken.mockResolvedValue({ sub: 'user_456' });

      expect(await getUserId()).toBe('user_456');
      expect(mockedDecodeMobileToken).toHaveBeenCalledWith(
        'valid.mobile.token'
      );
    });

    it('requireAuth returns a minimal session for a valid bearer token', async () => {
      mockedAuth.mockResolvedValue(null);
      mockedHeaders.mockResolvedValue(
        new Headers({ authorization: 'Bearer valid.mobile.token' })
      );
      mockedDecodeMobileToken.mockResolvedValue({ sub: 'user_456' });

      const result = await requireAuth();
      expect(result).toEqual({ user: { id: 'user_456' } });
    });

    it('getUserId throws when the bearer token fails to decode', async () => {
      mockedAuth.mockResolvedValue(null);
      mockedHeaders.mockResolvedValue(
        new Headers({ authorization: 'Bearer garbage' })
      );
      mockedDecodeMobileToken.mockResolvedValue(null);

      await expect(getUserId()).rejects.toThrow('Unauthorized');
    });

    it('getUserId throws when the Authorization header is not a Bearer token', async () => {
      mockedAuth.mockResolvedValue(null);
      mockedHeaders.mockResolvedValue(
        new Headers({ authorization: 'Basic dXNlcjpwYXNz' })
      );

      await expect(getUserId()).rejects.toThrow('Unauthorized');
      expect(mockedDecodeMobileToken).not.toHaveBeenCalled();
    });

    it('prefers the cookie session over a bearer token when both are present', async () => {
      mockedAuth.mockResolvedValue({ user: { id: 'cookie_user' } });
      mockedHeaders.mockResolvedValue(
        new Headers({ authorization: 'Bearer valid.mobile.token' })
      );

      expect(await getUserId()).toBe('cookie_user');
      expect(mockedDecodeMobileToken).not.toHaveBeenCalled();
    });
  });
});
