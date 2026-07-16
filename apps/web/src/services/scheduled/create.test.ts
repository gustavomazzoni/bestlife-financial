import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { Prisma } from '@/types';
import { createScheduledTransaction } from './create';

vi.mock('@/lib/db', () => ({
  prisma: {
    category: { findUnique: vi.fn() },
    scheduledTransaction: { create: vi.fn() },
  },
}));

describe('createScheduledTransaction', () => {
  const userId = 'user_test_123';

  const mockCategory = {
    id: 'cat_bills_123',
    name: 'Contas',
    type: 'EXPENSE' as const,
    isSystemDefault: true,
    color: '#F97316',
    icon: '💡',
    createdAt: new Date(),
    userId: null,
  };

  // A fixed "future" date far enough ahead that "cannot be in the past"
  // never trips regardless of when this test runs. Built via the LOCAL
  // constructor — matching how the real NL-inference layer builds dates
  // (local noon) — since toUTCMidnight's contract is "read this process's
  // own local Y/M/D and re-anchor to UTC midnight", not "assume UTC input".
  const dueDay = new Date(2099, 6, 28); // July 28, 2099, local midnight

  const baseInput = {
    amount: 180,
    description: 'Conta de luz',
    type: 'EXPENSE' as const,
    categoryId: 'cat_bills_123',
    startDate: dueDay,
  };

  const mockCreatedScheduled = {
    id: 'sched_1',
    userId,
    amount: new Prisma.Decimal(baseInput.amount),
    description: baseInput.description,
    type: baseInput.type,
    categoryId: baseInput.categoryId,
    frequency: 'MONTHLY' as const,
    startDate: dueDay,
    endDate: null,
    nextOccurrence: dueDay,
    notificationDaysBefore: 3,
    isActive: true,
    lastExecutedDate: null,
    necessityLevel: null,
    valueAlignment: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);
    vi.mocked(prisma.scheduledTransaction.create).mockResolvedValue(
      mockCreatedScheduled
    );
  });

  it.each(['ONCE', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const)(
    'sets nextOccurrence equal to startDate for a fresh %s schedule (not one period later)',
    async frequency => {
      await createScheduledTransaction(userId, { ...baseInput, frequency });

      expect(prisma.scheduledTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            startDate: new Date('2099-07-28T00:00:00.000Z'),
            nextOccurrence: new Date('2099-07-28T00:00:00.000Z'),
          }),
        })
      );
    }
  );

  it('normalizes startDate to UTC midnight regardless of the incoming time-of-day', async () => {
    const noonLocal = new Date(2099, 6, 28, 12, 0, 0); // local noon, not UTC midnight
    await createScheduledTransaction(userId, {
      ...baseInput,
      frequency: 'MONTHLY',
      startDate: noonLocal,
    });

    expect(prisma.scheduledTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          startDate: new Date('2099-07-28T00:00:00.000Z'),
          nextOccurrence: new Date('2099-07-28T00:00:00.000Z'),
        }),
      })
    );
  });

  it('throws when startDate is in the past', async () => {
    await expect(
      createScheduledTransaction(userId, {
        ...baseInput,
        frequency: 'MONTHLY',
        startDate: new Date(2000, 0, 1),
      })
    ).rejects.toThrow('Start date cannot be in the past');
  });

  it('throws when endDate is not after startDate', async () => {
    await expect(
      createScheduledTransaction(userId, {
        ...baseInput,
        frequency: 'MONTHLY',
        endDate: dueDay,
      })
    ).rejects.toThrow('End date must be after start date');
  });

  it('throws when ONCE frequency has an endDate', async () => {
    await expect(
      createScheduledTransaction(userId, {
        ...baseInput,
        frequency: 'ONCE',
        endDate: new Date(2099, 7, 1),
      })
    ).rejects.toThrow(
      'One-time scheduled transactions cannot have an end date'
    );
  });

  it('throws for invalid category', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null);
    await expect(
      createScheduledTransaction(userId, { ...baseInput, frequency: 'MONTHLY' })
    ).rejects.toThrow('Category not found');
  });

  it('throws when category type does not match transaction type', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue({
      ...mockCategory,
      type: 'INCOME' as const,
    });
    await expect(
      createScheduledTransaction(userId, { ...baseInput, frequency: 'MONTHLY' })
    ).rejects.toThrow('Category type does not match transaction type');
  });
});
