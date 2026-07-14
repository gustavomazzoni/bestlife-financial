import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { getTransaction } from './get';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    transaction: { findFirst: vi.fn() },
  },
}));

describe('getTransaction', () => {
  const userId = 'user_test_123';
  const transactionId = 'txn_123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get transaction by ID', async () => {
    const mockTransaction = {
      id: transactionId,
      userId,
      amount: 100,
      description: 'Test',
      type: 'EXPENSE',
      categoryId: 'cat_123',
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.transaction.findFirst as Mock).mockResolvedValue(
      mockTransaction
    );

    const result = await getTransaction(userId, transactionId);

    expect(result).toEqual(mockTransaction);
    expect(prisma.transaction.findFirst).toHaveBeenCalledWith({
      where: { id: transactionId, userId },
    });
  });

  it('should throw error when transaction not found', async () => {
    vi.mocked(prisma.transaction.findFirst).mockResolvedValue(null);

    await expect(getTransaction(userId, transactionId)).rejects.toThrow(
      'Transaction not found'
    );
  });

  it('should not return transaction from different user', async () => {
    vi.mocked(prisma.transaction.findFirst).mockResolvedValue(null);

    await expect(getTransaction(userId, transactionId)).rejects.toThrow();
  });
});
