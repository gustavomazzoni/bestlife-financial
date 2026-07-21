import { describe, it, expect, vi } from 'vitest';
import { assertAccountsOwnedByUser } from './validate-accounts';

function mockTx(count: number) {
  return {
    financialAccount: {
      count: vi.fn().mockResolvedValue(count),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe('assertAccountsOwnedByUser', () => {
  it('does not query when all ids are null/undefined', async () => {
    const tx = mockTx(0);
    await assertAccountsOwnedByUser(tx, 'user_1', [null, undefined]);
    expect(tx.financialAccount.count).not.toHaveBeenCalled();
  });

  it('dedupes ids before counting', async () => {
    const tx = mockTx(1);
    await assertAccountsOwnedByUser(tx, 'user_1', ['acc_1', 'acc_1']);
    expect(tx.financialAccount.count).toHaveBeenCalledWith({
      where: { id: { in: ['acc_1'] }, userId: 'user_1' },
    });
  });

  it('passes when every id belongs to the user', async () => {
    const tx = mockTx(2);
    await expect(
      assertAccountsOwnedByUser(tx, 'user_1', ['acc_1', 'acc_2'])
    ).resolves.toBeUndefined();
  });

  it('throws when at least one id does not belong to the user', async () => {
    const tx = mockTx(1);
    await expect(
      assertAccountsOwnedByUser(tx, 'user_1', ['acc_1', 'acc_2'])
    ).rejects.toThrow('Account not found');
  });
});
