import nodemailer from 'nodemailer';
import { OTP_EXPIRY_MINUTES } from '@/lib/auth/otp';

/**
 * Standalone transport for the mobile OTP code email — deliberately
 * separate from NextAuth's EmailProvider (which owns its own nodemailer
 * instance internally and only sends magic links, not arbitrary emails).
 * Uses the same SMTP_* env vars (Mailpit in dev).
 */
function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const transport = createTransport();
  await transport.sendMail({
    to: email,
    from: process.env.SMTP_FROM,
    subject: `${code} é o seu código de acesso`,
    text: `Seu código de acesso é ${code}. Ele expira em ${OTP_EXPIRY_MINUTES} minutos.`,
    html: `<p>Seu código de acesso é <strong style="font-size: 24px; letter-spacing: 4px;">${code}</strong></p><p>Ele expira em ${OTP_EXPIRY_MINUTES} minutos.</p>`,
  });
}
