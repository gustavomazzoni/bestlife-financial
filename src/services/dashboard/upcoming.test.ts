import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { Prisma } from '@/types';
import { getUpcomingItems } from './upcoming';
import { addDays, startOfDay } from 'date-fns';

vi.mock('@/lib/db', () => ({
  prisma: {
    transaction: { findMany: vi.fn() },
    recurringTransaction: { findMany: vi.fn() },
  },
}));

describe('getUpcomingItems', () => {
  const userId = 'user_test_123';
  const today = startOfDay(new Date());

  const mockCategory = {
    id: 'cat_1',
    name: 'Contas',
    type: 'EXPENSE' as const,
    isSystemDefault: true,
    color: '#EF4444',
    icon: '📄',
    createdAt: new Date(),
  };

  const mockPendingTransaction = {
    id: 'txn_pending_1',
    userId,
    date: addDays(today, 2),
    amount: new Prisma.Decimal(500),
    description: 'Aluguel',
    type: 'EXPENSE' as const,
    status: 'PENDING' as const,
    categoryId: 'cat_1',
    category: mockCategory,
    necessityLevel: 'NEEDS' as const,
    valueAlignment: null,
    isRecurring: false,
    recurringId: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRecurring = {
    id: 'rec_1',
    userId,
    amount: new Prisma.Decimal(200),
    description: 'Streaming',
    type: 'EXPENSE' as const,
    categoryId: 'cat_1',
    category: mockCategory,
    frequency: 'MONTHLY' as const,
    startDate: addDays(today, -30),
    endDate: null,
    nextDueDate: today, // due today
    notificationDaysBefore: 3,
    isActive: true,
    lastCreatedDate: addDays(today, -30),
    necessityLevel: null,
    valueAlignment: null,
    createdAt: addDays(today, -30),
    updatedAt: today,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(today);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should combine scheduled and recurring items', async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([
      mockPendingTransaction,
    ]);
    vi.mocked(prisma.recurringTransaction.findMany).mockResolvedValue([
      mockRecurring,
    ]);

    const result = await getUpcomingItems(userId);

    expect(result).toHaveLength(2);
    const kinds = result.map(i => i.kind);
    expect(kinds).toContain('scheduled');
    expect(kinds).toContain('recurring');
  });

  it('should mark today items with isToday=true', async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([]);
    vi.mocked(prisma.recurringTransaction.findMany).mockResolvedValue([
      mockRecurring,
    ]);

    const result = await getUpcomingItems(userId);

    expect(result[0].isToday).toBe(true);
  });

  it('should mark future items with isToday=false', async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([
      mockPendingTransaction,
    ]);
    vi.mocked(prisma.recurringTransaction.findMany).mockResolvedValue([]);

    const result = await getUpcomingItems(userId);

    expect(result[0].isToday).toBe(false);
  });

  it('should sort items by date ascending', async () => {
    const laterPending = {
      ...mockPendingTransaction,
      id: 'txn_later',
      date: addDays(today, 5),
    };
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([
      laterPending,
      mockPendingTransaction,
    ]);
    vi.mocked(prisma.recurringTransaction.findMany).mockResolvedValue([]);

    const result = await getUpcomingItems(userId);

    expect(result[0].transactionId).toBe('txn_pending_1');
    expect(result[1].transactionId).toBe('txn_later');
  });

  it('should return empty array when no upcoming items', async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([]);
    vi.mocked(prisma.recurringTransaction.findMany).mockResolvedValue([]);

    const result = await getUpcomingItems(userId);

    expect(result).toHaveLength(0);
  });

  it('should use correct ids for item identification', async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([
      mockPendingTransaction,
    ]);
    vi.mocked(prisma.recurringTransaction.findMany).mockResolvedValue([
      mockRecurring,
    ]);

    const result = await getUpcomingItems(userId);

    const scheduled = result.find(i => i.kind === 'scheduled');
    const recurring = result.find(i => i.kind === 'recurring');

    expect(scheduled?.transactionId).toBe('txn_pending_1');
    expect(scheduled?.id).toBe('scheduled-txn_pending_1');
    expect(recurring?.recurringId).toBe('rec_1');
    expect(recurring?.id).toBe('recurring-rec_1');
  });

  it('should pass userId and date range to both queries', async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([]);
    vi.mocked(prisma.recurringTransaction.findMany).mockResolvedValue([]);

    await getUpcomingItems(userId, 7);

    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId, status: 'PENDING' }),
      })
    );
    expect(prisma.recurringTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId, isActive: true }),
      })
    );
  });
});
