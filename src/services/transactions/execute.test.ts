import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { Prisma } from '@/types';
import { executeTransaction } from './execute';
import { startOfDay } from 'date-fns';

vi.mock('@/lib/db', () => ({
  prisma: {
    transaction: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('executeTransaction', () => {
  const userId = 'user_test_123';
  const transactionId = 'txn_pending_123';
  const today = startOfDay(new Date());

  const mockPendingTransaction = {
    id: transactionId,
    userId,
    date: new Date(Date.now() + 86400000), // tomorrow
    amount: new Prisma.Decimal(150),
    description: 'Salário',
    type: 'INCOME' as const,
    status: 'PENDING' as const,
    categoryId: 'cat_income_123',
    necessityLevel: null,
    valueAlignment: null,
    isRecurring: false,
    recurringId: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(today);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should mark a PENDING transaction as EXECUTED', async () => {
    const executedTransaction = {
      ...mockPendingTransaction,
      status: 'EXECUTED' as const,
      date: today,
    };

    vi.mocked(prisma.transaction.findFirst).mockResolvedValue(
      mockPendingTransaction
    );
    vi.mocked(prisma.transaction.update).mockResolvedValue(executedTransaction);

    const result = await executeTransaction(userId, transactionId);

    expect(result.status).toBe('EXECUTED');
    expect(prisma.transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: transactionId },
        data: expect.objectContaining({ status: 'EXECUTED', date: today }),
      })
    );
  });

  it('should throw if transaction not found', async () => {
    vi.mocked(prisma.transaction.findFirst).mockResolvedValue(null);

    await expect(executeTransaction(userId, transactionId)).rejects.toThrow(
      'Transaction not found'
    );
  });

  it('should throw if transaction is already EXECUTED', async () => {
    vi.mocked(prisma.transaction.findFirst).mockResolvedValue({
      ...mockPendingTransaction,
      status: 'EXECUTED' as const,
    });

    await expect(executeTransaction(userId, transactionId)).rejects.toThrow(
      'Transaction is already executed'
    );
  });

  it('should only find transactions belonging to the given userId', async () => {
    vi.mocked(prisma.transaction.findFirst).mockResolvedValue(null);

    await expect(
      executeTransaction('other_user', transactionId)
    ).rejects.toThrow('Transaction not found');

    expect(prisma.transaction.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: transactionId, userId: 'other_user' },
      })
    );
  });
});
