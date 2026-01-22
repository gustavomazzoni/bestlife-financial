import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { prisma } from '@/lib/db';
import { Prisma } from '@/types';
import { updateRecurringTransaction } from './update';
import { addDays, addMonths, addYears, startOfDay } from 'date-fns';

vi.mock('@/lib/db', () => ({
  prisma: {
    recurringTransaction: { findFirst: vi.fn(), update: vi.fn() },
    category: { findUnique: vi.fn() },
  },
}));

describe('updateRecurringTransaction', () => {
  const userId = 'user_test_123';
  const recurringId = 'rec_123';
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  const mockCategory = {
    id: 'cat_bills_123',
    name: 'Contas',
    type: 'EXPENSE' as const,
    isSystemDefault: true,
    color: '#EF4444',
    icon: '📄',
    createdAt: new Date(),
  };

  const mockExistingRecurring = {
    id: recurringId,
    userId,
    amount: new Prisma.Decimal(100),
    description: 'Internet',
    type: 'EXPENSE' as const,
    categoryId: 'cat_bills_123',
    frequency: 'MONTHLY' as const,
    startDate: tomorrow,
    endDate: null,
    nextDueDate: addMonths(tomorrow, 1),
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
    vi.useFakeTimers();
    vi.setSystemTime(today);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should update recurring transaction with valid data', async () => {
    vi.mocked(prisma.recurringTransaction.findFirst).mockResolvedValue(
      mockExistingRecurring
    );
    vi.mocked(prisma.recurringTransaction.update).mockResolvedValue({
      ...mockExistingRecurring,
      description: 'Updated Internet',
      amount: new Prisma.Decimal(150),
    });

    const result = await updateRecurringTransaction(userId, recurringId, {
      description: 'Updated Internet',
      amount: 150,
    });

    expect(result.description).toBe('Updated Internet');
    expect(prisma.recurringTransaction.update).toHaveBeenCalled();
  });

  it('should throw error when not found', async () => {
    vi.mocked(prisma.recurringTransaction.findFirst).mockResolvedValue(null);

    await expect(
      updateRecurringTransaction(userId, recurringId, {
        description: 'Updated',
      })
    ).rejects.toThrow('Recurring transaction not found');
  });

  it('should verify userId ownership', async () => {
    vi.mocked(prisma.recurringTransaction.findFirst).mockResolvedValue(null);

    await expect(
      updateRecurringTransaction('other_user_id', recurringId, {
        description: 'Updated',
      })
    ).rejects.toThrow('Recurring transaction not found');

    expect(
      vi.mocked(prisma.recurringTransaction.findFirst)
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: recurringId, userId: 'other_user_id' },
      })
    );
  });

  it('should recalculate nextDueDate when frequency changes to WEEKLY', async () => {
    vi.mocked(prisma.recurringTransaction.findFirst).mockResolvedValue(
      mockExistingRecurring
    );

    const expectedNextDueDate = addDays(mockExistingRecurring.startDate, 7);

    vi.mocked(prisma.recurringTransaction.update).mockResolvedValue({
      ...mockExistingRecurring,
      frequency: 'WEEKLY' as const,
      nextDueDate: expectedNextDueDate,
    });

    const result = await updateRecurringTransaction(userId, recurringId, {
      frequency: 'WEEKLY',
    });

    expect(result.nextDueDate).toEqual(expectedNextDueDate);
    expect(prisma.recurringTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          frequency: 'WEEKLY',
          nextDueDate: expectedNextDueDate,
        }),
      })
    );
  });

  it('should recalculate nextDueDate when frequency changes to YEARLY', async () => {
    vi.mocked(prisma.recurringTransaction.findFirst).mockResolvedValue(
      mockExistingRecurring
    );

    const expectedNextDueDate = addYears(mockExistingRecurring.startDate, 1);

    vi.mocked(prisma.recurringTransaction.update).mockResolvedValue({
      ...mockExistingRecurring,
      frequency: 'YEARLY' as const,
      nextDueDate: expectedNextDueDate,
    });

    const result = await updateRecurringTransaction(userId, recurringId, {
      frequency: 'YEARLY',
    });

    expect(result.nextDueDate).toEqual(expectedNextDueDate);
  });

  it('should recalculate nextDueDate when startDate changes', async () => {
    vi.mocked(prisma.recurringTransaction.findFirst).mockResolvedValue(
      mockExistingRecurring
    );

    const newStartDate = addDays(today, 10);
    const expectedNextDueDate = addMonths(newStartDate, 1);

    vi.mocked(prisma.recurringTransaction.update).mockResolvedValue({
      ...mockExistingRecurring,
      startDate: newStartDate,
      nextDueDate: expectedNextDueDate,
    });

    const result = await updateRecurringTransaction(userId, recurringId, {
      startDate: newStartDate,
    });

    expect(result.nextDueDate).toEqual(expectedNextDueDate);
    expect(prisma.recurringTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          startDate: newStartDate,
          nextDueDate: expectedNextDueDate,
        }),
      })
    );
  });

  it('should recalculate nextDueDate when both frequency and startDate change', async () => {
    vi.mocked(prisma.recurringTransaction.findFirst).mockResolvedValue(
      mockExistingRecurring
    );

    const newStartDate = addDays(today, 5);
    const expectedNextDueDate = addDays(newStartDate, 7); // WEEKLY

    vi.mocked(prisma.recurringTransaction.update).mockResolvedValue({
      ...mockExistingRecurring,
      startDate: newStartDate,
      frequency: 'WEEKLY' as const,
      nextDueDate: expectedNextDueDate,
    });

    const result = await updateRecurringTransaction(userId, recurringId, {
      startDate: newStartDate,
      frequency: 'WEEKLY',
    });

    expect(result.nextDueDate).toEqual(expectedNextDueDate);
  });

  it('should throw error for negative amount', async () => {
    vi.mocked(prisma.recurringTransaction.findFirst).mockResolvedValue(
      mockExistingRecurring
    );

    await expect(
      updateRecurringTransaction(userId, recurringId, {
        amount: -50,
      })
    ).rejects.toThrow('Amount must be positive');
  });

  it('should throw error for endDate before startDate', async () => {
    vi.mocked(prisma.recurringTransaction.findFirst).mockResolvedValue(
      mockExistingRecurring
    );

    await expect(
      updateRecurringTransaction(userId, recurringId, {
        endDate: addDays(today, -5),
      })
    ).rejects.toThrow('End date must be after start date');
  });

  it('should throw error for startDate in the past', async () => {
    vi.mocked(prisma.recurringTransaction.findFirst).mockResolvedValue(
      mockExistingRecurring
    );

    await expect(
      updateRecurringTransaction(userId, recurringId, {
        startDate: addDays(today, -5),
      })
    ).rejects.toThrow('Start date cannot be in the past');
  });

  it('should validate category if categoryId is updated', async () => {
    vi.mocked(prisma.recurringTransaction.findFirst).mockResolvedValue(
      mockExistingRecurring
    );
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

    await expect(
      updateRecurringTransaction(userId, recurringId, {
        categoryId: 'nonexistent_category',
      })
    ).rejects.toThrow('Category not found');
  });

  it('should validate category type matches transaction type', async () => {
    vi.mocked(prisma.recurringTransaction.findFirst).mockResolvedValue(
      mockExistingRecurring
    );
    vi.mocked(prisma.category.findUnique).mockResolvedValue({
      ...mockCategory,
      type: 'INCOME',
    });

    await expect(
      updateRecurringTransaction(userId, recurringId, {
        categoryId: 'income_category',
      })
    ).rejects.toThrow('Category type does not match transaction type');
  });
});
