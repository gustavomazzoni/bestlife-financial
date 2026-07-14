import { describe, it, expect, vi, type Mock } from 'vitest';
import { requireAuth, getUserId, isAuthenticated } from './session';
import { auth } from './config';

vi.mock('./config', () => ({
  auth: vi.fn(),
}));

const mockedAuth = vi.mocked(auth as Mock); // type auth function to Mock to handle Promise<null> from async function

describe('Auth Helpers', () => {
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
});
