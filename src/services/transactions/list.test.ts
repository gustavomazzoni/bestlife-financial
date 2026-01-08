import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { listTransactions } from './list';
import { ListTransactionsQuerySchema } from '@/lib/validations/transaction';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    transaction: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('listTransactions', () => {
  const userId = 'user_test_123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list transactions with pagination', async () => {
    const mockTransactions = [
      { id: 'txn_1', amount: 100, type: 'EXPENSE' },
      { id: 'txn_2', amount: 200, type: 'INCOME' },
    ];

    vi.mocked(prisma.transaction.findMany as Mock).mockResolvedValue(
      mockTransactions
    );
    vi.mocked(prisma.transaction.count).mockResolvedValue(50);

    const result = await listTransactions(
      userId,
      ListTransactionsQuerySchema.parse({ page: 1, limit: 20 })
    );

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(50);
    expect(result.totalPages).toBe(3);
  });

  it('should filter by type', async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([]);
    vi.mocked(prisma.transaction.count).mockResolvedValue(0);

    await listTransactions(
      userId,
      ListTransactionsQuerySchema.parse({ type: 'EXPENSE', page: 1, limit: 20 })
    );

    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'EXPENSE' }),
      })
    );
  });

  it('should filter by date range', async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([]);
    vi.mocked(prisma.transaction.count).mockResolvedValue(0);

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    await listTransactions(
      userId,
      ListTransactionsQuerySchema.parse({
        startDate,
        endDate,
        page: 1,
        limit: 20,
      })
    );

    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          date: { gte: startDate, lte: endDate },
        }),
      })
    );
  });
});
