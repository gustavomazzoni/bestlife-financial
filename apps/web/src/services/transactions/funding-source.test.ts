import { describe, it, expect } from 'vitest';
import { assertValidFundingSource } from './funding-source';

describe('assertValidFundingSource', () => {
  it('allows a non-transfer with an accountId and no toAccountId', () => {
    expect(() =>
      assertValidFundingSource({
        type: 'EXPENSE',
        accountId: 'acc_1',
        accountType: 'CHECKING',
      })
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
        accountType: 'CHECKING',
        toAccountId: 'acc_2',
      })
    ).toThrow('toAccountId is only valid for TRANSFER');
  });

  it('allows a TRANSFER with distinct source and destination', () => {
    expect(() =>
      assertValidFundingSource({
        type: 'TRANSFER',
        accountId: 'acc_1',
        accountType: 'CHECKING',
        toAccountId: 'acc_2',
        toAccountType: 'SAVINGS',
      })
    ).not.toThrow();
  });

  it('rejects a TRANSFER missing a source accountId', () => {
    expect(() =>
      assertValidFundingSource({ type: 'TRANSFER', toAccountId: 'acc_2' })
    ).toThrow('Transfer requires a source accountId');
  });

  it('rejects a TRANSFER whose source is a credit card', () => {
    expect(() =>
      assertValidFundingSource({
        type: 'TRANSFER',
        accountId: 'card_1',
        accountType: 'CREDIT_CARD',
        toAccountId: 'acc_2',
      })
    ).toThrow('A credit card cannot be a transfer source');
  });

  it('rejects a TRANSFER missing a destination toAccountId', () => {
    expect(() =>
      assertValidFundingSource({
        type: 'TRANSFER',
        accountId: 'acc_1',
        accountType: 'CHECKING',
      })
    ).toThrow('Transfer requires a destination toAccountId');
  });

  it('rejects a TRANSFER where source and destination are the same account', () => {
    expect(() =>
      assertValidFundingSource({
        type: 'TRANSFER',
        accountId: 'acc_1',
        accountType: 'CHECKING',
        toAccountId: 'acc_1',
      })
    ).toThrow('Transfer accounts must differ');
  });

  it('allows an EXPENSE funded by a credit-card-type account', () => {
    expect(() =>
      assertValidFundingSource({
        type: 'EXPENSE',
        accountId: 'card_1',
        accountType: 'CREDIT_CARD',
      })
    ).not.toThrow();
  });

  it('rejects a credit card funding anything other than an EXPENSE', () => {
    expect(() =>
      assertValidFundingSource({
        type: 'INCOME',
        accountId: 'card_1',
        accountType: 'CREDIT_CARD',
      })
    ).toThrow('A credit card can only fund an EXPENSE');
  });

  it('allows a TRANSFER whose destination resolves as a credit card (payoff)', () => {
    expect(() =>
      assertValidFundingSource({
        type: 'TRANSFER',
        accountId: 'acc_1',
        accountType: 'CHECKING',
        toAccountId: 'card_1',
        toAccountType: 'CREDIT_CARD',
      })
    ).not.toThrow();
  });
});
