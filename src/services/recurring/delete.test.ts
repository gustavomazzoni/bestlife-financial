import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { Prisma } from '@/types';
import { deleteRecurringTransaction } from './delete';
import { addDays, addMonths } from 'date-fns';

vi.mock('@/lib/db', () => ({
  prisma: {
    recurringTransaction: { findFirst: vi.fn(), update: vi.fn() },
  },
}));

describe('deleteRecurringTransaction', () => {
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
    nextDueDate: addMonths(today, 1),
    notificationDaysBefore: 3,
    isActive: true,
    lastCreatedDate: addDays(today, -30),
    necessityLevel: null,
    valueAlignment: null,
    createdAt: today,
    updatedAt: today,
    category: mockCategory,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should soft delete recurring transaction by setting isActive to false', async () => {
    vi.mocked(prisma.recurringTransaction.findFirst).mockResolvedValue(
      mockRecurring
    );
    vi.mocked(prisma.recurringTransaction.update).mockResolvedValue({
      ...mockRecurring,
      isActive: false,
    });

    await deleteRecurringTransaction(userId, recurringId);

    expect(vi.mocked(prisma.recurringTransaction.update)).toHaveBeenCalledWith({
      where: { id: recurringId },
      data: { isActive: false },
    });
  });

  it('should throw error when not found', async () => {
    vi.mocked(prisma.recurringTransaction.findFirst).mockResolvedValue(null);

    await expect(
      deleteRecurringTransaction(userId, recurringId)
    ).rejects.toThrow('Recurring transaction not found');
  });

  it('should verify userId ownership', async () => {
    vi.mocked(prisma.recurringTransaction.findFirst).mockResolvedValue(null);

    await expect(
      deleteRecurringTransaction('other_user_id', recurringId)
    ).rejects.toThrow('Recurring transaction not found');

    expect(
      vi.mocked(prisma.recurringTransaction.findFirst)
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: recurringId, userId: 'other_user_id' },
      })
    );
  });

  it('should not hard delete the recurring transaction', async () => {
    vi.mocked(prisma.recurringTransaction.findFirst).mockResolvedValue(
      mockRecurring
    );
    vi.mocked(prisma.recurringTransaction.update).mockResolvedValue({
      ...mockRecurring,
      isActive: false,
    });

    await deleteRecurringTransaction(userId, recurringId);

    // Verify update was called (soft delete), not delete
    expect(vi.mocked(prisma.recurringTransaction.update)).toHaveBeenCalled();
    // Prisma delete should not exist in our mock
    expect(prisma.recurringTransaction).not.toHaveProperty('delete');
  });

  it('should preserve created transaction instances (not delete related transactions)', async () => {
    vi.mocked(prisma.recurringTransaction.findFirst).mockResolvedValue(
      mockRecurring
    );
    vi.mocked(prisma.recurringTransaction.update).mockResolvedValue({
      ...mockRecurring,
      isActive: false,
    });

    await deleteRecurringTransaction(userId, recurringId);

    // Only isActive should be updated, transactions should remain untouched
    expect(vi.mocked(prisma.recurringTransaction.update)).toHaveBeenCalledWith({
      where: { id: recurringId },
      data: { isActive: false },
    });
  });

  it('should throw error if already inactive', async () => {
    vi.mocked(prisma.recurringTransaction.findFirst).mockResolvedValue({
      ...mockRecurring,
      isActive: false,
    });

    await expect(
      deleteRecurringTransaction(userId, recurringId)
    ).rejects.toThrow('Recurring transaction is already inactive');
  });
});
