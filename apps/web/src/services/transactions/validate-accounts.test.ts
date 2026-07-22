import { describe, it, expect, vi } from 'vitest';
import { assertAccountsOwnedByUser } from './validate-accounts';

function mockTx(accounts: { id: string; type: string }[]) {
  return {
    financialAccount: {
      findMany: vi.fn().mockResolvedValue(accounts),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe('assertAccountsOwnedByUser', () => {
  it('does not query when all ids are null/undefined', async () => {
    const tx = mockTx([]);
    await assertAccountsOwnedByUser(tx, 'user_1', [null, undefined]);
    expect(tx.financialAccount.findMany).not.toHaveBeenCalled();
  });

  it('dedupes ids before querying', async () => {
    const tx = mockTx([{ id: 'acc_1', type: 'CHECKING' }]);
    await assertAccountsOwnedByUser(tx, 'user_1', ['acc_1', 'acc_1']);
    expect(tx.financialAccount.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['acc_1'] }, userId: 'user_1' },
      select: { id: true, type: true },
    });
  });

  it('resolves a map of id to type when every id belongs to the user', async () => {
    const tx = mockTx([
      { id: 'acc_1', type: 'CHECKING' },
      { id: 'card_1', type: 'CREDIT_CARD' },
    ]);
    const types = await assertAccountsOwnedByUser(tx, 'user_1', [
      'acc_1',
      'card_1',
    ]);
    expect(types.get('acc_1')).toBe('CHECKING');
    expect(types.get('card_1')).toBe('CREDIT_CARD');
  });

  it('throws when at least one id does not belong to the user', async () => {
    const tx = mockTx([{ id: 'acc_1', type: 'CHECKING' }]);
    await expect(
      assertAccountsOwnedByUser(tx, 'user_1', ['acc_1', 'acc_2'])
    ).rejects.toThrow('Account not found');
  });
});
