import { encode, decode } from 'next-auth/jwt';

/**
 * Mobile bearer tokens are Auth.js-issued JWTs (same encrypt/decrypt
 * primitives and AUTH_SECRET as the web session cookie), but under their
 * own salt — a distinct namespace from the cookie session, not an attempt
 * to reproduce Auth.js's internal cookie-name-derived salt.
 */
const MOBILE_TOKEN_SALT = 'lifeos-mobile-token';
const MOBILE_TOKEN_MAX_AGE = 90 * 24 * 60 * 60; // 90 days

export interface MobileTokenPayload {
  sub: string;
  email?: string;
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set');
  return secret;
}

export async function encodeMobileToken(
  payload: MobileTokenPayload
): Promise<string> {
  return encode({
    secret: getSecret(),
    salt: MOBILE_TOKEN_SALT,
    maxAge: MOBILE_TOKEN_MAX_AGE,
    token: payload,
  });
}

export async function decodeMobileToken(
  token: string
): Promise<MobileTokenPayload | null> {
  try {
    const payload = await decode({
      secret: getSecret(),
      salt: MOBILE_TOKEN_SALT,
      token,
    });
    if (!payload?.sub) return null;
    return {
      sub: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
    };
  } catch {
    return null;
  }
}
