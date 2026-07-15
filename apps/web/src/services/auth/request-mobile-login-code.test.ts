import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { prisma } from '@/lib/db';
import { sendOtpEmail } from '@/lib/email/send-otp-email';
import { requestMobileLoginCode } from './request-mobile-login-code';

vi.mock('@/lib/db', () => ({
  prisma: {
    mobileLoginCode: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/email/send-otp-email', () => ({
  sendOtpEmail: vi.fn(),
}));

describe('requestMobileLoginCode', () => {
  const email = 'user@example.com';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.mobileLoginCode.findFirst as Mock).mockResolvedValue(null);
    vi.mocked(prisma.mobileLoginCode.create as Mock).mockResolvedValue({
      id: 'code_1',
      email,
      codeHash: 'hash',
      expiresAt: new Date(),
      attempts: 0,
      consumedAt: null,
      createdAt: new Date(),
    });
  });

  it('creates a code row and sends the email', async () => {
    await requestMobileLoginCode(email);

    expect(prisma.mobileLoginCode.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email }),
      })
    );
    expect(sendOtpEmail).toHaveBeenCalledWith(
      email,
      expect.stringMatching(/^\d{6}$/)
    );
  });

  it('stores a hash, not the plaintext code', async () => {
    await requestMobileLoginCode(email);

    const createCall = vi.mocked(prisma.mobileLoginCode.create as Mock).mock
      .calls[0][0];
    const [, sentCode] = vi.mocked(sendOtpEmail as Mock).mock.calls[0];
    expect(createCall.data.codeHash).not.toBe(sentCode);
  });

  it('rejects a second request within the cooldown window', async () => {
    vi.mocked(prisma.mobileLoginCode.findFirst as Mock).mockResolvedValue({
      id: 'code_recent',
      email,
      createdAt: new Date(),
    });

    await expect(requestMobileLoginCode(email)).rejects.toThrow(
      'Please wait before requesting another code'
    );
    expect(sendOtpEmail).not.toHaveBeenCalled();
  });

  it('allows a new request once the cooldown has elapsed', async () => {
    vi.mocked(prisma.mobileLoginCode.findFirst as Mock).mockResolvedValue({
      id: 'code_old',
      email,
      createdAt: new Date(Date.now() - 61_000),
    });

    await requestMobileLoginCode(email);

    expect(sendOtpEmail).toHaveBeenCalled();
  });
});
