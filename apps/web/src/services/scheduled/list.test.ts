import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { listScheduledTransactions } from './list';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    scheduledTransaction: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('listScheduledTransactions', () => {
  const userId = 'user_test_123';
  const defaultQuery = { page: 1, limit: 20 };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.scheduledTransaction.findMany as Mock).mockResolvedValue(
      []
    );
    vi.mocked(prisma.scheduledTransaction.count as Mock).mockResolvedValue(0);
  });

  it('should list scheduled transactions with pagination', async () => {
    vi.mocked(prisma.scheduledTransaction.count as Mock).mockResolvedValue(5);

    const result = await listScheduledTransactions(userId, defaultQuery);

    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(1);
  });

  it('should include the account relation alongside category', async () => {
    await listScheduledTransactions(userId, defaultQuery);

    expect(prisma.scheduledTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { category: true, account: true },
      })
    );
  });

  it('should filter by isActive, type and frequency', async () => {
    await listScheduledTransactions(userId, {
      ...defaultQuery,
      isActive: false,
      type: 'EXPENSE',
      frequency: 'MONTHLY',
    });

    expect(prisma.scheduledTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: false,
          type: 'EXPENSE',
          frequency: 'MONTHLY',
        }),
      })
    );
  });
});
