import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { Prisma } from '@/types';
import { listRecurringTransactions } from './list';
import { addDays } from 'date-fns';

vi.mock('@/lib/db', () => ({
  prisma: {
    recurringTransaction: { findMany: vi.fn(), count: vi.fn() },
  },
}));

describe('listRecurringTransactions', () => {
  const userId = 'user_test_123';
  const today = new Date();

  const mockCategory = {
    id: 'cat_bills_123',
    name: 'Contas',
    type: 'EXPENSE' as const,
    isSystemDefault: true,
    color: '#EF4444',
    icon: '📄',
    createdAt: new Date(),
  };

  const mockRecurring1 = {
    id: 'rec_1',
    userId,
    amount: new Prisma.Decimal(100),
    description: 'Internet',
    type: 'EXPENSE' as const,
    categoryId: 'cat_bills_123',
    frequency: 'MONTHLY' as const,
    startDate: today,
    endDate: null,
    nextDueDate: addDays(today, 5),
    notificationDaysBefore: 3,
    isActive: true,
    lastCreatedDate: null,
    necessityLevel: null,
    valueAlignment: null,
    createdAt: today,
    updatedAt: today,
    category: mockCategory,
  };

  const mockRecurring2 = {
    id: 'rec_2',
    userId,
    amount: new Prisma.Decimal(50),
    description: 'Streaming',
    type: 'EXPENSE' as const,
    categoryId: 'cat_bills_123',
    frequency: 'MONTHLY' as const,
    startDate: today,
    endDate: null,
    nextDueDate: addDays(today, 10),
    notificationDaysBefore: 3,
    isActive: true,
    lastCreatedDate: null,
    necessityLevel: null,
    valueAlignment: null,
    createdAt: today,
    updatedAt: today,
    category: mockCategory,
  };

  const mockInactiveRecurring = {
    ...mockRecurring1,
    id: 'rec_3',
    isActive: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list active recurring transactions by default', async () => {
    vi.mocked(prisma.recurringTransaction.findMany).mockResolvedValue([
      mockRecurring1,
      mockRecurring2,
    ]);
    vi.mocked(prisma.recurringTransaction.count).mockResolvedValue(2);

    const result = await listRecurringTransactions(userId, {
      page: 1,
      limit: 20,
    });

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(
      vi.mocked(prisma.recurringTransaction.findMany)
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId, isActive: true },
      })
    );
  });

  it('should filter by isActive=false when specified', async () => {
    vi.mocked(prisma.recurringTransaction.findMany).mockResolvedValue([
      mockInactiveRecurring,
    ]);
    vi.mocked(prisma.recurringTransaction.count).mockResolvedValue(1);

    const result = await listRecurringTransactions(userId, {
      page: 1,
      limit: 20,
      isActive: false,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].isActive).toBe(false);
    expect(
      vi.mocked(prisma.recurringTransaction.findMany)
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId, isActive: false },
      })
    );
  });

  it('should sort by nextDueDate ascending by default', async () => {
    vi.mocked(prisma.recurringTransaction.findMany).mockResolvedValue([
      mockRecurring1,
      mockRecurring2,
    ]);
    vi.mocked(prisma.recurringTransaction.count).mockResolvedValue(2);

    await listRecurringTransactions(userId, { page: 1, limit: 20 });

    expect(
      vi.mocked(prisma.recurringTransaction.findMany)
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { nextDueDate: 'asc' },
      })
    );
  });

  it('should include category in results', async () => {
    vi.mocked(prisma.recurringTransaction.findMany).mockResolvedValue([
      mockRecurring1,
    ]);
    vi.mocked(prisma.recurringTransaction.count).mockResolvedValue(1);

    await listRecurringTransactions(userId, { page: 1, limit: 20 });

    expect(
      vi.mocked(prisma.recurringTransaction.findMany)
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { category: true },
      })
    );
  });

  it('should paginate results correctly', async () => {
    vi.mocked(prisma.recurringTransaction.findMany).mockResolvedValue([
      mockRecurring2,
    ]);
    vi.mocked(prisma.recurringTransaction.count).mockResolvedValue(2);

    const result = await listRecurringTransactions(userId, {
      page: 2,
      limit: 1,
    });

    expect(result.page).toBe(2);
    expect(result.limit).toBe(1);
    expect(result.totalPages).toBe(2);
    expect(
      vi.mocked(prisma.recurringTransaction.findMany)
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 1,
        take: 1,
      })
    );
  });

  it('should filter by type when specified', async () => {
    vi.mocked(prisma.recurringTransaction.findMany).mockResolvedValue([
      mockRecurring1,
    ]);
    vi.mocked(prisma.recurringTransaction.count).mockResolvedValue(1);

    await listRecurringTransactions(userId, {
      page: 1,
      limit: 20,
      type: 'EXPENSE',
    });

    expect(
      vi.mocked(prisma.recurringTransaction.findMany)
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId, isActive: true, type: 'EXPENSE' },
      })
    );
  });

  it('should filter by frequency when specified', async () => {
    vi.mocked(prisma.recurringTransaction.findMany).mockResolvedValue([
      mockRecurring1,
    ]);
    vi.mocked(prisma.recurringTransaction.count).mockResolvedValue(1);

    await listRecurringTransactions(userId, {
      page: 1,
      limit: 20,
      frequency: 'MONTHLY',
    });

    expect(
      vi.mocked(prisma.recurringTransaction.findMany)
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId, isActive: true, frequency: 'MONTHLY' },
      })
    );
  });
});
