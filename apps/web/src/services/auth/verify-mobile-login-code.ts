import { prisma } from '@/lib/db';
import { hashOtpCode, OTP_MAX_ATTEMPTS } from '@/lib/auth/otp';
import { encodeMobileToken } from '@/lib/auth/mobile-token';

export async function verifyMobileLoginCode(
  email: string,
  code: string
): Promise<{ token: string }> {
  const pending = await prisma.mobileLoginCode.findFirst({
    where: { email, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!pending) {
    throw new Error('No pending code. Request a new one.');
  }

  if (pending.expiresAt < new Date()) {
    throw new Error('Code expired. Request a new one.');
  }

  if (pending.attempts >= OTP_MAX_ATTEMPTS) {
    throw new Error('Too many attempts. Request a new one.');
  }

  if (hashOtpCode(code) !== pending.codeHash) {
    await prisma.mobileLoginCode.update({
      where: { id: pending.id },
      data: { attempts: { increment: 1 } },
    });
    throw new Error('Invalid code');
  }

  await prisma.mobileLoginCode.update({
    where: { id: pending.id },
    data: { consumedAt: new Date() },
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: { emailVerified: new Date() },
    create: { email, emailVerified: new Date() },
  });

  const token = await encodeMobileToken({
    sub: user.id,
    email: user.email ?? undefined,
  });

  return { token };
}
