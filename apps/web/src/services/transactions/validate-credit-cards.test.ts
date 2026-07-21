import { describe, it, expect, vi } from 'vitest';
import { assertCreditCardsOwnedByUser } from './validate-credit-cards';

function mockTx(count: number) {
  return {
    creditCard: {
      count: vi.fn().mockResolvedValue(count),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe('assertCreditCardsOwnedByUser', () => {
  it('does not query when all ids are null/undefined', async () => {
    const tx = mockTx(0);
    await assertCreditCardsOwnedByUser(tx, 'user_1', [null, undefined]);
    expect(tx.creditCard.count).not.toHaveBeenCalled();
  });

  it('passes when the card belongs to the user', async () => {
    const tx = mockTx(1);
    await expect(
      assertCreditCardsOwnedByUser(tx, 'user_1', ['card_1'])
    ).resolves.toBeUndefined();
  });

  it('throws when the card does not belong to the user', async () => {
    const tx = mockTx(0);
    await expect(
      assertCreditCardsOwnedByUser(tx, 'user_1', ['card_1'])
    ).rejects.toThrow('Credit card not found');
  });
});
