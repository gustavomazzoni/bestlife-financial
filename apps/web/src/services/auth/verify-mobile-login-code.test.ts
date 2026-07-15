import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { prisma } from '@/lib/db';
import { hashOtpCode, OTP_MAX_ATTEMPTS } from '@/lib/auth/otp';
import { encodeMobileToken } from '@/lib/auth/mobile-token';
import { verifyMobileLoginCode } from './verify-mobile-login-code';

vi.mock('@/lib/db', () => ({
  prisma: {
    mobileLoginCode: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    user: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth/mobile-token', () => ({
  encodeMobileToken: vi.fn().mockResolvedValue('mock.jwt.token'),
}));

describe('verifyMobileLoginCode', () => {
  const email = 'user@example.com';
  const code = '123456';

  function mockCodeRow(overrides = {}) {
    return {
      id: 'code_1',
      email,
      codeHash: hashOtpCode(code),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
      consumedAt: null,
      createdAt: new Date(),
      ...overrides,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.upsert as Mock).mockResolvedValue({
      id: 'user_1',
      email,
    });
  });

  it('mints a token and upserts the user on a correct code', async () => {
    vi.mocked(prisma.mobileLoginCode.findFirst as Mock).mockResolvedValue(
      mockCodeRow()
    );

    const result = await verifyMobileLoginCode(email, code);

    expect(result.token).toBe('mock.jwt.token');
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email } })
    );
    expect(encodeMobileToken).toHaveBeenCalledWith({
      sub: 'user_1',
      email,
    });
    expect(prisma.mobileLoginCode.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'code_1' },
        data: expect.objectContaining({ consumedAt: expect.any(Date) }),
      })
    );
  });

  it('throws when there is no pending code', async () => {
    vi.mocked(prisma.mobileLoginCode.findFirst as Mock).mockResolvedValue(null);

    await expect(verifyMobileLoginCode(email, code)).rejects.toThrow(
      'No pending code'
    );
  });

  it('throws when the code has expired', async () => {
    vi.mocked(prisma.mobileLoginCode.findFirst as Mock).mockResolvedValue(
      mockCodeRow({ expiresAt: new Date(Date.now() - 1000) })
    );

    await expect(verifyMobileLoginCode(email, code)).rejects.toThrow(
      'Code expired'
    );
  });

  it('throws when attempts are exhausted', async () => {
    vi.mocked(prisma.mobileLoginCode.findFirst as Mock).mockResolvedValue(
      mockCodeRow({ attempts: OTP_MAX_ATTEMPTS })
    );

    await expect(verifyMobileLoginCode(email, code)).rejects.toThrow(
      'Too many attempts'
    );
  });

  it('increments attempts and throws on a wrong code', async () => {
    vi.mocked(prisma.mobileLoginCode.findFirst as Mock).mockResolvedValue(
      mockCodeRow()
    );

    await expect(verifyMobileLoginCode(email, '000000')).rejects.toThrow(
      'Invalid code'
    );
    expect(prisma.mobileLoginCode.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'code_1' },
        data: { attempts: { increment: 1 } },
      })
    );
    expect(encodeMobileToken).not.toHaveBeenCalled();
  });
});
