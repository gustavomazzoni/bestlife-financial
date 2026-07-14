import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { deleteTransaction } from './delete';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    transaction: {
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('deleteTransaction', () => {
  const userId = 'user_test_123';
  const transactionId = 'txn_123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete transaction successfully', async () => {
    vi.mocked(prisma.transaction.findFirst as Mock).mockResolvedValue({
      id: transactionId,
      userId,
    });
    vi.mocked(prisma.transaction.delete as Mock).mockResolvedValue({});

    await deleteTransaction(userId, transactionId);

    expect(prisma.transaction.delete).toHaveBeenCalledWith({
      where: { id: transactionId },
    });
  });

  it('should throw error when transaction not found', async () => {
    vi.mocked(prisma.transaction.findFirst).mockResolvedValue(null);

    await expect(deleteTransaction(userId, transactionId)).rejects.toThrow(
      'Transaction not found'
    );
  });

  it('should not delete transaction from different user', async () => {
    vi.mocked(prisma.transaction.findFirst).mockResolvedValue(null);

    await expect(deleteTransaction(userId, 'other_txn')).rejects.toThrow(
      'Transaction not found'
    );

    expect(prisma.transaction.delete).not.toHaveBeenCalled();
  });
});
