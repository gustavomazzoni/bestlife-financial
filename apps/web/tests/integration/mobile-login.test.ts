import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as REQUEST } from '@/app/api/v1/auth/mobile-login/request/route';
import { POST as VERIFY } from '@/app/api/v1/auth/mobile-login/verify/route';
import { createMockPostRequest, parseResponse } from '@tests-helpers/api';
import { prisma } from './setup';
import { hashOtpCode } from '@/lib/auth/otp';
import { decodeMobileToken } from '@/lib/auth/mobile-token';

vi.mock('@/lib/email/send-otp-email', () => ({
  sendOtpEmail: vi.fn(),
}));

import { sendOtpEmail } from '@/lib/email/send-otp-email';

describe('Mobile OTP Login Integration Tests', () => {
  const email = `otp-test-${Date.now()}@example.com`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/auth/mobile-login/request', () => {
    it('creates a code row and sends an email', async () => {
      const request = createMockPostRequest(
        'api/v1/auth/mobile-login/request',
        { email }
      );

      const response = await REQUEST(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(json.data.sent).toBe(true);
      expect(sendOtpEmail).toHaveBeenCalledWith(
        email,
        expect.stringMatching(/^\d{6}$/)
      );

      const row = await prisma.mobileLoginCode.findFirst({ where: { email } });
      expect(row).not.toBeNull();
    });

    it('returns 400 for an invalid email', async () => {
      const request = createMockPostRequest(
        'api/v1/auth/mobile-login/request',
        { email: 'not-an-email' }
      );

      const response = await REQUEST(request);
      expect(response.status).toBe(400);
    });

    it('returns 400 when requested again within the cooldown window', async () => {
      const cooldownEmail = `otp-cooldown-${Date.now()}@example.com`;
      await prisma.mobileLoginCode.create({
        data: {
          email: cooldownEmail,
          codeHash: hashOtpCode('000000'),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      const request = createMockPostRequest(
        'api/v1/auth/mobile-login/request',
        { email: cooldownEmail }
      );
      const response = await REQUEST(request);

      expect(response.status).toBe(400);
      expect(sendOtpEmail).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/auth/mobile-login/verify', () => {
    it('mints a bearer token for the correct code and creates the user', async () => {
      const verifyEmail = `otp-verify-${Date.now()}@example.com`;
      const code = '482913';
      await prisma.mobileLoginCode.create({
        data: {
          email: verifyEmail,
          codeHash: hashOtpCode(code),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      const request = createMockPostRequest('api/v1/auth/mobile-login/verify', {
        email: verifyEmail,
        code,
      });
      const response = await VERIFY(request);
      const json = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(typeof json.data.token).toBe('string');

      const decoded = await decodeMobileToken(json.data.token);
      expect(decoded?.email).toBe(verifyEmail);

      const user = await prisma.user.findUnique({
        where: { email: verifyEmail },
      });
      expect(user).not.toBeNull();
      expect(user?.emailVerified).not.toBeNull();
    });

    it('returns 400 for a wrong code', async () => {
      const wrongEmail = `otp-wrong-${Date.now()}@example.com`;
      await prisma.mobileLoginCode.create({
        data: {
          email: wrongEmail,
          codeHash: hashOtpCode('111111'),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      const request = createMockPostRequest('api/v1/auth/mobile-login/verify', {
        email: wrongEmail,
        code: '999999',
      });
      const response = await VERIFY(request);

      expect(response.status).toBe(400);
    });

    it('returns 400 for an expired code', async () => {
      const expiredEmail = `otp-expired-${Date.now()}@example.com`;
      const code = '222222';
      await prisma.mobileLoginCode.create({
        data: {
          email: expiredEmail,
          codeHash: hashOtpCode(code),
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      const request = createMockPostRequest('api/v1/auth/mobile-login/verify', {
        email: expiredEmail,
        code,
      });
      const response = await VERIFY(request);

      expect(response.status).toBe(400);
    });

    it('returns 400 when there is no pending code', async () => {
      const request = createMockPostRequest('api/v1/auth/mobile-login/verify', {
        email: `no-code-${Date.now()}@example.com`,
        code: '123456',
      });
      const response = await VERIFY(request);

      expect(response.status).toBe(400);
    });

    it('returns 400 for a malformed code', async () => {
      const request = createMockPostRequest('api/v1/auth/mobile-login/verify', {
        email,
        code: 'abc',
      });
      const response = await VERIFY(request);

      expect(response.status).toBe(400);
    });
  });
});
