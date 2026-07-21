import { describe, it, expect } from 'vitest';
import { splitIntoInstallments } from './split-installments';

describe('splitIntoInstallments', () => {
  it('splits evenly when the total divides cleanly', () => {
    expect(splitIntoInstallments(300, 3)).toEqual([100, 100, 100]);
  });

  it('puts the remainder cents on the last installment', () => {
    const result = splitIntoInstallments(100, 3);
    expect(result).toEqual([33.33, 33.33, 33.34]);
  });

  it('returns the full amount for a single installment', () => {
    expect(splitIntoInstallments(150.5, 1)).toEqual([150.5]);
  });

  it('always sums exactly to the input total', () => {
    const total = 999.97;
    const parts = splitIntoInstallments(total, 7);
    const sum = parts.reduce((a, b) => a + b, 0);
    expect(Math.round(sum * 100)).toBe(Math.round(total * 100));
  });
});
