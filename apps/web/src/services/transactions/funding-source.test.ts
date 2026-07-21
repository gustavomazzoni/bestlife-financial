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
    ).toThrow(
      'Transfer requires exactly one destination: toAccountId or creditCardId'
    );
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

  it('allows an EXPENSE funded by a credit card with no accountId', () => {
    expect(() =>
      assertValidFundingSource({ type: 'EXPENSE', creditCardId: 'card_1' })
    ).not.toThrow();
  });

  it('rejects a transaction funded by both an account and a credit card', () => {
    expect(() =>
      assertValidFundingSource({
        type: 'EXPENSE',
        accountId: 'acc_1',
        creditCardId: 'card_1',
      })
    ).toThrow(
      'A transaction cannot be funded by both an account and a credit card'
    );
  });

  it('rejects a credit card funding anything other than an EXPENSE', () => {
    expect(() =>
      assertValidFundingSource({ type: 'INCOME', creditCardId: 'card_1' })
    ).toThrow('A credit card can only fund an EXPENSE');
  });

  it('allows a TRANSFER whose destination is a credit card (payoff)', () => {
    expect(() =>
      assertValidFundingSource({
        type: 'TRANSFER',
        accountId: 'acc_1',
        creditCardId: 'card_1',
      })
    ).not.toThrow();
  });

  it('rejects a TRANSFER with both an account and a credit card as destination', () => {
    expect(() =>
      assertValidFundingSource({
        type: 'TRANSFER',
        accountId: 'acc_1',
        toAccountId: 'acc_2',
        creditCardId: 'card_1',
      })
    ).toThrow(
      'Transfer requires exactly one destination: toAccountId or creditCardId'
    );
  });
});
