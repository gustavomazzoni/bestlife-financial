import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { Prisma } from '@/types';
import { updateScheduledTransaction } from './update';

vi.mock('@/lib/db', () => ({
  prisma: {
    category: { findUnique: vi.fn() },
    scheduledTransaction: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('updateScheduledTransaction', () => {
  const userId = 'user_test_123';
  const scheduledId = 'sched_1';

  // Built via the local constructor (matching real callers) — see the note
  // in create.test.ts: toUTCMidnight re-anchors this process's own local
  // Y/M/D, so a local-constructed fixture behaves deterministically on any
  // machine's timezone.
  const dueDay = new Date(2099, 6, 28); // July 28, 2099, local

  const mockExisting = {
    id: scheduledId,
    userId,
    amount: new Prisma.Decimal(180),
    description: 'Conta de luz',
    type: 'EXPENSE' as const,
    categoryId: 'cat_bills_123',
    frequency: 'MONTHLY' as const,
    startDate: new Date('2099-06-28T00:00:00.000Z'),
    endDate: null,
    nextOccurrence: new Date('2099-06-28T00:00:00.000Z'),
    notificationDaysBefore: 3,
    isActive: true,
    lastExecutedDate: null,
    necessityLevel: null,
    valueAlignment: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.scheduledTransaction.findFirst).mockResolvedValue(
      mockExisting
    );
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);
    vi.mocked(prisma.scheduledTransaction.update).mockResolvedValue({
      ...mockExisting,
      nextOccurrence: dueDay,
    });
  });

  it('recalculates nextOccurrence as the new startDate itself when startDate changes (not one period later)', async () => {
    await updateScheduledTransaction(userId, scheduledId, {
      startDate: dueDay,
    });

    expect(prisma.scheduledTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          startDate: new Date('2099-07-28T00:00:00.000Z'),
          nextOccurrence: new Date('2099-07-28T00:00:00.000Z'),
        }),
      })
    );
  });

  it('recalculates nextOccurrence from the EXISTING startDate when only frequency changes', async () => {
    await updateScheduledTransaction(userId, scheduledId, {
      frequency: 'WEEKLY',
    });

    expect(prisma.scheduledTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nextOccurrence: mockExisting.startDate,
        }),
      })
    );
  });

  it('does not touch nextOccurrence when neither frequency nor startDate changes', async () => {
    await updateScheduledTransaction(userId, scheduledId, { amount: 200 });

    const call = vi.mocked(prisma.scheduledTransaction.update).mock.calls[0][0];
    expect(call.data).not.toHaveProperty('nextOccurrence');
  });

  it('normalizes an incoming startDate to UTC midnight before persisting (not the raw value)', async () => {
    const noonLocal = new Date(2099, 6, 28, 12, 0, 0);
    await updateScheduledTransaction(userId, scheduledId, {
      startDate: noonLocal,
    });

    expect(prisma.scheduledTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          startDate: new Date('2099-07-28T00:00:00.000Z'),
        }),
      })
    );
  });

  it('throws when the new startDate is in the past', async () => {
    await expect(
      updateScheduledTransaction(userId, scheduledId, {
        startDate: new Date(2000, 0, 1),
      })
    ).rejects.toThrow('Start date cannot be in the past');
  });

  it('throws when scheduled transaction is not found', async () => {
    vi.mocked(prisma.scheduledTransaction.findFirst).mockResolvedValue(null);
    await expect(
      updateScheduledTransaction(userId, scheduledId, { amount: 200 })
    ).rejects.toThrow('Scheduled transaction not found');
  });

  it('allows clearing endDate by passing null', async () => {
    await updateScheduledTransaction(userId, scheduledId, { endDate: null });

    expect(prisma.scheduledTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ endDate: null }),
      })
    );
  });
});
