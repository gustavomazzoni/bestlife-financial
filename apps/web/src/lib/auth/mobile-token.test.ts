// @vitest-environment node
// jose's WebCrypto usage needs Node's real crypto; the project's default
// jsdom environment doesn't implement enough of it (fails encrypting).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encodeMobileToken, decodeMobileToken } from './mobile-token';

describe('mobile token', () => {
  const originalSecret = process.env.AUTH_SECRET;

  beforeEach(() => {
    process.env.AUTH_SECRET = 'test_secret_at_least_32_characters_long';
  });

  afterEach(() => {
    process.env.AUTH_SECRET = originalSecret;
  });

  it('round-trips a payload through encode/decode', async () => {
    const token = await encodeMobileToken({
      sub: 'user_123',
      email: 'test@example.com',
    });

    const payload = await decodeMobileToken(token);
    expect(payload).toEqual({ sub: 'user_123', email: 'test@example.com' });
  });

  it('returns null for a garbage token', async () => {
    expect(await decodeMobileToken('not-a-real-token')).toBeNull();
  });

  it('returns null for a token encoded with a different secret', async () => {
    const token = await encodeMobileToken({ sub: 'user_123' });
    process.env.AUTH_SECRET = 'a_completely_different_secret_value_here';
    expect(await decodeMobileToken(token)).toBeNull();
  });

  it('throws when AUTH_SECRET is not set', async () => {
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    await expect(encodeMobileToken({ sub: 'user_123' })).rejects.toThrow(
      'AUTH_SECRET is not set'
    );
  });
});
