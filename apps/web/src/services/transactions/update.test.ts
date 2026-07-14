import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { updateTransaction } from './update';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    transaction: {
      findFirst: vi.fn(),
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
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

  // it('should throw error when transaction not found', async () => {
  //   vi.mocked(prisma.transaction.findFirst).mockResolvedValue(null)

  //   await expect(
  //     updateTransaction(userId, transactionId, { amount: 150 })
  //   ).rejects.toThrow('Transaction not found')
  // })

  // it('should throw error for negative amount', async () => {
  //   vi.mocked(prisma.transaction.findFirst as Mock).mockResolvedValue(existingTransaction)

  //   await expect(
  //     updateTransaction(userId, transactionId, { amount: -100 })
  //   ).rejects.toThrow('Amount must be positive')
  // })

  // it('should throw error for future date', async () => {
  //   vi.mocked(prisma.transaction.findFirst as Mock).mockResolvedValue(existingTransaction)

  //   await expect(
  //     updateTransaction(userId, transactionId, { date: new Date('2030-01-01') })
  //   ).rejects.toThrow('Date cannot be in the future')
  // })

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
});
