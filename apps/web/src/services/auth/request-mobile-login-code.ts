import { prisma } from '@/lib/db';
import { sendOtpEmail } from '@/lib/email/send-otp-email';
import {
  generateOtpCode,
  hashOtpCode,
  OTP_EXPIRY_MINUTES,
  OTP_REQUEST_COOLDOWN_SECONDS,
} from '@/lib/auth/otp';

export async function requestMobileLoginCode(email: string): Promise<void> {
  const mostRecent = await prisma.mobileLoginCode.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
  });

  if (mostRecent) {
    const elapsedSeconds = (Date.now() - mostRecent.createdAt.getTime()) / 1000;
    if (elapsedSeconds < OTP_REQUEST_COOLDOWN_SECONDS) {
      throw new Error('Please wait before requesting another code');
    }
  }

  const code = generateOtpCode();

  await prisma.mobileLoginCode.create({
    data: {
      email,
      codeHash: hashOtpCode(code),
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    },
  });

  await sendOtpEmail(email, code);
}
