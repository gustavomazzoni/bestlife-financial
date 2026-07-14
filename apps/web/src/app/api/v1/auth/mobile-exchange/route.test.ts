import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

vi.mock('@/lib/auth/session', () => ({
  getOptionalSession: vi.fn(),
}));

vi.mock('@/lib/auth/mobile-token', () => ({
  encodeMobileToken: vi.fn(),
}));

import { getOptionalSession } from '@/lib/auth/session';
import { encodeMobileToken } from '@/lib/auth/mobile-token';

const returnUrl = 'lifeos://auth';

describe('GET /api/v1/auth/mobile-exchange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /login?error=mobile when returnUrl is missing', async () => {
    const request = new NextRequest(
      'http://localhost/api/v1/auth/mobile-exchange'
    );
    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost/login?error=mobile'
    );
    expect(getOptionalSession).not.toHaveBeenCalled();
  });

  it('rejects an http(s) returnUrl (would be an open redirect)', async () => {
    const request = new NextRequest(
      `http://localhost/api/v1/auth/mobile-exchange?returnUrl=${encodeURIComponent('https://evil.example.com')}`
    );
    const response = await GET(request);
    expect(response.headers.get('location')).toBe(
      'http://localhost/login?error=mobile'
    );
    expect(getOptionalSession).not.toHaveBeenCalled();
  });

  it('redirects to returnUrl with an error when there is no session', async () => {
    vi.mocked(getOptionalSession).mockResolvedValue(null);
    const request = new NextRequest(
      `http://localhost/api/v1/auth/mobile-exchange?returnUrl=${encodeURIComponent(returnUrl)}`
    );
    const response = await GET(request);
    expect(response.headers.get('location')).toBe(
      `${returnUrl}?error=unauthenticated`
    );
    expect(encodeMobileToken).not.toHaveBeenCalled();
  });

  it('redirects to returnUrl with a minted token when authenticated', async () => {
    vi.mocked(getOptionalSession).mockResolvedValue({
      user: { id: 'user_123', email: 'test@example.com' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    vi.mocked(encodeMobileToken).mockResolvedValue('signed.mobile.token');

    const request = new NextRequest(
      `http://localhost/api/v1/auth/mobile-exchange?returnUrl=${encodeURIComponent(returnUrl)}`
    );
    const response = await GET(request);

    expect(encodeMobileToken).toHaveBeenCalledWith({
      sub: 'user_123',
      email: 'test@example.com',
    });
    expect(response.headers.get('location')).toBe(
      `${returnUrl}?token=signed.mobile.token`
    );
  });
});
