import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { updateTransaction } from './update';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $transaction: vi.fn((callback: any) => callback(prisma)),
    transaction: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    financialAccount: {
      count: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('updateTransaction', () => {
  const userId = 'user_test_123';
  const transactionId = 'txn_123';
  const existingTransaction = {
    id: transactionId,
    userId,
    amount: 100,
    description: 'Old description',
    type: 'EXPENSE',
    categoryId: 'cat_123',
    date: new Date('2024-01-15'),
    accountId: null,
    toAccountId: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.financialAccount.count as Mock).mockResolvedValue(0);
  });

  it('should update transaction successfully', async () => {
    vi.mocked(prisma.transaction.findFirst as Mock).mockResolvedValue(
      existingTransaction
    );
    vi.mocked(prisma.transaction.update as Mock).mockResolvedValue({
      ...existingTransaction,
      amount: 150,
      description: 'New description',
    });

    const result = await updateTransaction(userId, transactionId, {
      amount: 150,
      description: 'New description',
    });

    expect(result.amount).toBe(150);
    expect(result.description).toBe('New description');
  });

  it('should allow partial updates', async () => {
    vi.mocked(prisma.transaction.findFirst as Mock).mockResolvedValue(
      existingTransaction
    );
    vi.mocked(prisma.transaction.update as Mock).mockResolvedValue({
      ...existingTransaction,
      description: 'Only description changed',
    });

    const result = await updateTransaction(userId, transactionId, {
      description: 'Only description changed',
    });

    expect(result.description).toBe('Only description changed');
    expect(result.amount).toBe(100); // Unchanged
  });

  it('should reverse the old balance effect and apply the new one when amount changes', async () => {
    vi.mocked(prisma.transaction.findFirst as Mock).mockResolvedValue({
      ...existingTransaction,
      accountId: 'acc_1',
    });
    vi.mocked(prisma.financialAccount.count as Mock).mockResolvedValue(1);
    vi.mocked(prisma.transaction.update as Mock).mockResolvedValue({
      ...existingTransaction,
      accountId: 'acc_1',
      amount: 150,
    });

    await updateTransaction(userId, transactionId, { amount: 150 });

    // reverse the original -100 debit, then apply the new -150 debit
    expect(prisma.financialAccount.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'acc_1' },
      data: { balance: { increment: 100 } },
    });
    expect(prisma.financialAccount.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'acc_1' },
      data: { balance: { increment: -150 } },
    });
  });

  it('should move the balance effect when the linked account changes', async () => {
    vi.mocked(prisma.transaction.findFirst as Mock).mockResolvedValue({
      ...existingTransaction,
      accountId: 'acc_old',
    });
    vi.mocked(prisma.financialAccount.count as Mock).mockResolvedValue(1);
    vi.mocked(prisma.transaction.update as Mock).mockResolvedValue({
      ...existingTransaction,
      accountId: 'acc_new',
    });

    await updateTransaction(userId, transactionId, { accountId: 'acc_new' });

    expect(prisma.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_old' },
      data: { balance: { increment: 100 } },
    });
    expect(prisma.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_new' },
      data: { balance: { increment: -100 } },
    });
  });

  it('should reject an accountId that does not belong to the user', async () => {
    vi.mocked(prisma.transaction.findFirst as Mock).mockResolvedValue(
      existingTransaction
    );
    vi.mocked(prisma.financialAccount.count as Mock).mockResolvedValue(0);

    await expect(
      updateTransaction(userId, transactionId, { accountId: 'not_mine' })
    ).rejects.toThrow('Account not found');
    expect(prisma.transaction.update).not.toHaveBeenCalled();
  });
});
