import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { Prisma } from '@/types';
import { getRecurringTransaction } from './get';
import { addDays } from 'date-fns';

vi.mock('@/lib/db', () => ({
  prisma: {
    recurringTransaction: { findFirst: vi.fn() },
  },
}));

describe('getRecurringTransaction', () => {
  const userId = 'user_test_123';
  const recurringId = 'rec_123';
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

  const mockRecurring = {
    id: recurringId,
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return recurring transaction when found', async () => {
    vi.mocked(prisma.recurringTransaction.findFirst).mockResolvedValue(
      mockRecurring
    );

    const result = await getRecurringTransaction(userId, recurringId);

    expect(result).toEqual(mockRecurring);
    expect(
      vi.mocked(prisma.recurringTransaction.findFirst)
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: recurringId, userId },
      })
    );
  });

  it('should throw error when not found', async () => {
    vi.mocked(prisma.recurringTransaction.findFirst).mockResolvedValue(null);

    await expect(getRecurringTransaction(userId, recurringId)).rejects.toThrow(
      'Recurring transaction not found'
    );
  });

  it('should verify userId ownership', async () => {
    vi.mocked(prisma.recurringTransaction.findFirst).mockResolvedValue(null);

    await expect(
      getRecurringTransaction('other_user_id', recurringId)
    ).rejects.toThrow('Recurring transaction not found');

    expect(
      vi.mocked(prisma.recurringTransaction.findFirst)
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: recurringId, userId: 'other_user_id' },
      })
    );
  });

  it('should include category in result', async () => {
    vi.mocked(prisma.recurringTransaction.findFirst).mockResolvedValue(
      mockRecurring
    );

    await getRecurringTransaction(userId, recurringId);

    expect(
      vi.mocked(prisma.recurringTransaction.findFirst)
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { category: true },
      })
    );
  });
});
