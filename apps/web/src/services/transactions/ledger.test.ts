import { describe, it, expect, vi } from 'vitest';
import { applyLedgerEffect, reconcileLedgerEffect } from './ledger';

function mockTx() {
  return {
    financialAccount: {
      update: vi.fn(),
    },
    creditCard: {
      update: vi.fn(),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe('applyLedgerEffect', () => {
  it('debits the account for an EXPENSE', async () => {
    const tx = mockTx();
    await applyLedgerEffect(
      tx,
      { type: 'EXPENSE', amount: 100, accountId: 'acc_1', toAccountId: null },
      1
    );
    expect(tx.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_1' },
      data: { balance: { increment: -100 } },
    });
  });

  it('credits the account for an INCOME', async () => {
    const tx = mockTx();
    await applyLedgerEffect(
      tx,
      { type: 'INCOME', amount: 100, accountId: 'acc_1', toAccountId: null },
      1
    );
    expect(tx.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_1' },
      data: { balance: { increment: 100 } },
    });
  });

  it('credits the account for a SAVING', async () => {
    const tx = mockTx();
    await applyLedgerEffect(
      tx,
      { type: 'SAVING', amount: 50, accountId: 'acc_1', toAccountId: null },
      1
    );
    expect(tx.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_1' },
      data: { balance: { increment: 50 } },
    });
  });

  it('does nothing when no accountId is set', async () => {
    const tx = mockTx();
    await applyLedgerEffect(
      tx,
      { type: 'EXPENSE', amount: 100, accountId: null, toAccountId: null },
      1
    );
    expect(tx.financialAccount.update).not.toHaveBeenCalled();
  });

  it('reverses the effect when sign is -1', async () => {
    const tx = mockTx();
    await applyLedgerEffect(
      tx,
      { type: 'EXPENSE', amount: 100, accountId: 'acc_1', toAccountId: null },
      -1
    );
    expect(tx.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_1' },
      data: { balance: { increment: 100 } },
    });
  });

  it('debits the source and credits the destination for a TRANSFER', async () => {
    const tx = mockTx();
    await applyLedgerEffect(
      tx,
      {
        type: 'TRANSFER',
        amount: 100,
        accountId: 'acc_1',
        toAccountId: 'acc_2',
      },
      1
    );
    expect(tx.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_1' },
      data: { balance: { decrement: 100 } },
    });
    expect(tx.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_2' },
      data: { balance: { increment: 100 } },
    });
  });

  it('reverses a TRANSFER symmetrically', async () => {
    const tx = mockTx();
    await applyLedgerEffect(
      tx,
      {
        type: 'TRANSFER',
        amount: 100,
        accountId: 'acc_1',
        toAccountId: 'acc_2',
      },
      -1
    );
    expect(tx.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_1' },
      data: { balance: { decrement: -100 } },
    });
    expect(tx.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_2' },
      data: { balance: { increment: -100 } },
    });
  });

  it('increments the card balance when an EXPENSE is funded by a credit card', async () => {
    const tx = mockTx();
    await applyLedgerEffect(
      tx,
      {
        type: 'EXPENSE',
        amount: 100,
        accountId: null,
        toAccountId: null,
        creditCardId: 'card_1',
      },
      1
    );
    expect(tx.creditCard.update).toHaveBeenCalledWith({
      where: { id: 'card_1' },
      data: { balance: { increment: 100 } },
    });
    expect(tx.financialAccount.update).not.toHaveBeenCalled();
  });

  it('reverses a card-funded EXPENSE by decrementing the card balance', async () => {
    const tx = mockTx();
    await applyLedgerEffect(
      tx,
      {
        type: 'EXPENSE',
        amount: 100,
        accountId: null,
        toAccountId: null,
        creditCardId: 'card_1',
      },
      -1
    );
    expect(tx.creditCard.update).toHaveBeenCalledWith({
      where: { id: 'card_1' },
      data: { balance: { increment: -100 } },
    });
  });

  it('decrements the card balance on a TRANSFER payoff (account to card)', async () => {
    const tx = mockTx();
    await applyLedgerEffect(
      tx,
      {
        type: 'TRANSFER',
        amount: 100,
        accountId: 'acc_1',
        toAccountId: null,
        creditCardId: 'card_1',
      },
      1
    );
    expect(tx.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_1' },
      data: { balance: { decrement: 100 } },
    });
    expect(tx.creditCard.update).toHaveBeenCalledWith({
      where: { id: 'card_1' },
      data: { balance: { decrement: 100 } },
    });
  });
});

describe('reconcileLedgerEffect', () => {
  it('reverses the before effect and applies the after effect', async () => {
    const tx = mockTx();
    await reconcileLedgerEffect(
      tx,
      { type: 'EXPENSE', amount: 100, accountId: 'acc_1', toAccountId: null },
      { type: 'EXPENSE', amount: 150, accountId: 'acc_1', toAccountId: null }
    );

    expect(tx.financialAccount.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'acc_1' },
      data: { balance: { increment: 100 } },
    });
    expect(tx.financialAccount.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'acc_1' },
      data: { balance: { increment: -150 } },
    });
  });

  it('only applies the after effect when before is null (create)', async () => {
    const tx = mockTx();
    await reconcileLedgerEffect(tx, null, {
      type: 'EXPENSE',
      amount: 100,
      accountId: 'acc_1',
      toAccountId: null,
    });

    expect(tx.financialAccount.update).toHaveBeenCalledTimes(1);
    expect(tx.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_1' },
      data: { balance: { increment: -100 } },
    });
  });

  it('only reverses the before effect when after is null (delete)', async () => {
    const tx = mockTx();
    await reconcileLedgerEffect(
      tx,
      { type: 'EXPENSE', amount: 100, accountId: 'acc_1', toAccountId: null },
      null
    );

    expect(tx.financialAccount.update).toHaveBeenCalledTimes(1);
    expect(tx.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_1' },
      data: { balance: { increment: 100 } },
    });
  });

  it('does nothing when both before and after are null', async () => {
    const tx = mockTx();
    await reconcileLedgerEffect(tx, null, null);
    expect(tx.financialAccount.update).not.toHaveBeenCalled();
  });
});
