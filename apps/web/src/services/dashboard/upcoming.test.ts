import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { Prisma } from '@/types';
import { getUpcomingItems } from './upcoming';
import { addDays, startOfDay } from 'date-fns';

vi.mock('@/lib/db', () => ({
  prisma: {
    scheduledTransaction: { findMany: vi.fn() },
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
    userId: null,
  };

  const mockOnceScheduled = {
    id: 'sched_once_1',
    userId,
    nextOccurrence: addDays(today, 2),
    amount: new Prisma.Decimal(500),
    description: 'Aluguel',
    type: 'EXPENSE' as const,
    frequency: 'ONCE' as const,
    categoryId: 'cat_1',
    category: mockCategory,
    necessityLevel: 'NEEDS' as const,
    valueAlignment: null,
    startDate: addDays(today, 2),
    endDate: null,
    notificationDaysBefore: 3,
    isActive: true,
    lastExecutedDate: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMonthlyScheduled = {
    id: 'sched_monthly_1',
    userId,
    nextOccurrence: today,
    amount: new Prisma.Decimal(200),
    description: 'Streaming',
    type: 'EXPENSE' as const,
    frequency: 'MONTHLY' as const,
    categoryId: 'cat_1',
    category: mockCategory,
    necessityLevel: null,
    valueAlignment: null,
    startDate: addDays(today, -30),
    endDate: null,
    notificationDaysBefore: 3,
    isActive: true,
    lastExecutedDate: addDays(today, -30),
    notes: null,
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

  it('should return both ONCE and recurring scheduled items', async () => {
    vi.mocked(prisma.scheduledTransaction.findMany).mockResolvedValue([
      mockOnceScheduled,
      mockMonthlyScheduled,
    ]);

    const result = await getUpcomingItems(userId);

    expect(result).toHaveLength(2);
    const isRecurringValues = result.map(i => i.isRecurring);
    expect(isRecurringValues).toContain(false); // ONCE → not recurring
    expect(isRecurringValues).toContain(true); // MONTHLY → recurring
  });

  it('should mark today items with isToday=true', async () => {
    vi.mocked(prisma.scheduledTransaction.findMany).mockResolvedValue([
      mockMonthlyScheduled, // nextOccurrence = today
    ]);

    const result = await getUpcomingItems(userId);

    expect(result[0].isToday).toBe(true);
  });

  it('should mark future items with isToday=false', async () => {
    vi.mocked(prisma.scheduledTransaction.findMany).mockResolvedValue([
      mockOnceScheduled, // nextOccurrence = today + 2
    ]);

    const result = await getUpcomingItems(userId);

    expect(result[0].isToday).toBe(false);
  });

  it('should return empty array when no upcoming items', async () => {
    vi.mocked(prisma.scheduledTransaction.findMany).mockResolvedValue([]);

    const result = await getUpcomingItems(userId);

    expect(result).toHaveLength(0);
  });

  it('should use correct scheduledId for item identification', async () => {
    vi.mocked(prisma.scheduledTransaction.findMany).mockResolvedValue([
      mockOnceScheduled,
      mockMonthlyScheduled,
    ]);

    const result = await getUpcomingItems(userId);

    const once = result.find(i => i.frequency === 'ONCE');
    const monthly = result.find(i => i.frequency === 'MONTHLY');

    expect(once?.scheduledId).toBe('sched_once_1');
    expect(once?.id).toBe('scheduled-sched_once_1');
    expect(monthly?.scheduledId).toBe('sched_monthly_1');
    expect(monthly?.id).toBe('scheduled-sched_monthly_1');
  });

  it('should pass userId and date range to query', async () => {
    vi.mocked(prisma.scheduledTransaction.findMany).mockResolvedValue([]);

    await getUpcomingItems(userId, 7);

    expect(prisma.scheduledTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId, isActive: true }),
      })
    );
  });
});
