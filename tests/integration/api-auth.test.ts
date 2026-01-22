import { describe, it, expect, vi, Mock } from 'vitest';
import { POST } from '@/app/api/v1/transactions/route';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';

// Mock auth
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
}));

const mockedAuth = vi.mocked(auth as Mock); // type auth function to Mock to handle Promise<null> from async function

describe('API Authentication', () => {
  it('returns 401 for unauthenticated requests', async () => {
    mockedAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/v1/transactions', {
      method: 'POST',
      body: JSON.stringify({ amount: 100 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('allows authenticated requests', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: 'user_123', email: 'test@example.com' },
    });

    const request = new NextRequest('http://localhost/api/v1/transactions', {
      method: 'POST',
      body: JSON.stringify({
        date: new Date().toISOString(),
        amount: 100,
        description: 'Test',
        type: 'EXPENSE',
        category: 'Food',
      }),
    });

    const response = await POST(request);
    expect(response.status).not.toBe(401);
  });
});
