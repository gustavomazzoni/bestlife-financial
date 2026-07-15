import { describe, it, expect } from 'vitest';
import { generateOtpCode, hashOtpCode } from './otp';

describe('generateOtpCode', () => {
  it('generates a 6-digit numeric string', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateOtpCode();
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it('zero-pads codes below 100000', () => {
    // Statistically near-certain across enough draws; guards the padding
    // path specifically (crypto.randomInt can return small values).
    const codes = Array.from({ length: 200 }, () => generateOtpCode());
    expect(codes.every(c => c.length === 6)).toBe(true);
  });
});

describe('hashOtpCode', () => {
  it('is deterministic for the same code', () => {
    expect(hashOtpCode('123456')).toBe(hashOtpCode('123456'));
  });

  it('differs for different codes', () => {
    expect(hashOtpCode('123456')).not.toBe(hashOtpCode('654321'));
  });

  it('never returns the plaintext code', () => {
    expect(hashOtpCode('123456')).not.toBe('123456');
  });
});
