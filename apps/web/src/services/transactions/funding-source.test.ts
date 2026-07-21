import { describe, it, expect } from 'vitest';
import { assertValidFundingSource } from './funding-source';

describe('assertValidFundingSource', () => {
  it('allows a non-transfer with an accountId and no toAccountId', () => {
    expect(() =>
      assertValidFundingSource({ type: 'EXPENSE', accountId: 'acc_1' })
    ).not.toThrow();
  });

  it('allows a non-transfer with no account at all', () => {
    expect(() => assertValidFundingSource({ type: 'EXPENSE' })).not.toThrow();
  });

  it('rejects a non-transfer carrying a toAccountId', () => {
    expect(() =>
      assertValidFundingSource({
        type: 'EXPENSE',
        accountId: 'acc_1',
        toAccountId: 'acc_2',
      })
    ).toThrow('toAccountId is only valid for TRANSFER');
  });

  it('allows a TRANSFER with distinct source and destination', () => {
    expect(() =>
      assertValidFundingSource({
        type: 'TRANSFER',
        accountId: 'acc_1',
        toAccountId: 'acc_2',
      })
    ).not.toThrow();
  });

  it('rejects a TRANSFER missing a source accountId', () => {
    expect(() =>
      assertValidFundingSource({ type: 'TRANSFER', toAccountId: 'acc_2' })
    ).toThrow('Transfer requires a source accountId');
  });

  it('rejects a TRANSFER missing a destination toAccountId', () => {
    expect(() =>
      assertValidFundingSource({ type: 'TRANSFER', accountId: 'acc_1' })
    ).toThrow('Transfer requires a destination toAccountId');
  });

  it('rejects a TRANSFER where source and destination are the same account', () => {
    expect(() =>
      assertValidFundingSource({
        type: 'TRANSFER',
        accountId: 'acc_1',
        toAccountId: 'acc_1',
      })
    ).toThrow('Transfer accounts must differ');
  });
});
