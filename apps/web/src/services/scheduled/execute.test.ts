import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { Prisma } from '@/types';
import { executeScheduledTransaction } from './execute';

vi.mock('@/lib/db', () => ({
  prisma: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $transaction: vi.fn((callback: any) => callback(prisma)),
    scheduledTransaction: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
    financialAccount: {
      findFirst: vi.fn(),
    },
  },
}));

describe('executeScheduledTransaction', () => {
  const userId = 'user_test_123';
  const scheduledId = 'sched_1';

  const dueToday = new Date(2099, 6, 28); // local — see create.test.ts note
  const dueTodayUTC = new Date('2099-07-28T00:00:00.000Z');

  const mockMonthlyScheduled = {
    id: scheduledId,
    userId,
    amount: new Prisma.Decimal(180),
    description: 'Conta de luz',
    type: 'EXPENSE' as const,
    categoryId: 'cat_bills_123',
    frequency: 'MONTHLY' as const,
    startDate: dueTodayUTC,
    endDate: null,
    nextOccurrence: dueTodayUTC,
    notificationDaysBefore: 3,
    isActive: true,
    lastExecutedDate: null,
    necessityLevel: null,
    valueAlignment: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreatedTransaction = {
    id: 'txn_1',
    userId,
    date: dueTodayUTC,
    amount: new Prisma.Decimal(180),
    description: 'Conta de luz',
    type: 'EXPENSE' as const,
    categoryId: 'cat_bills_123',
    necessityLevel: null,
    valueAlignment: null,
    scheduledId,
    accountId: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.transaction.create).mockResolvedValue(
      mockCreatedTransaction
    );
    vi.mocked(prisma.scheduledTransaction.update).mockResolvedValue(
      mockMonthlyScheduled
    );
  });

  it('advances nextOccurrence by exactly one period after executing a MONTHLY schedule', async () => {
    vi.mocked(prisma.scheduledTransaction.findFirst).mockResolvedValue(
      mockMonthlyScheduled
    );

    await executeScheduledTransaction(userId, scheduledId, dueToday);

    expect(prisma.scheduledTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nextOccurrence: new Date('2099-08-28T00:00:00.000Z'),
        }),
      })
    );
  });

  it('deactivates a ONCE schedule after execution instead of advancing it', async () => {
    vi.mocked(prisma.scheduledTransaction.findFirst).mockResolvedValue({
      ...mockMonthlyScheduled,
      frequency: 'ONCE' as const,
    });

    await executeScheduledTransaction(userId, scheduledId, dueToday);

    expect(prisma.scheduledTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isActive: false }),
      })
    );
  });

  it('rejects executing a recurring schedule before its nextOccurrence is due', async () => {
    vi.mocked(prisma.scheduledTransaction.findFirst).mockResolvedValue({
      ...mockMonthlyScheduled,
      nextOccurrence: new Date('2099-08-28T00:00:00.000Z'), // due next month, not today
    });

    await expect(
      executeScheduledTransaction(userId, scheduledId)
    ).rejects.toThrow('Scheduled transaction is not due yet');
  });

  it('deactivates a recurring schedule once the advanced occurrence passes endDate', async () => {
    vi.mocked(prisma.scheduledTransaction.findFirst).mockResolvedValue({
      ...mockMonthlyScheduled,
      endDate: new Date('2099-08-01T00:00:00.000Z'), // before the Aug 28 advance
    });

    await executeScheduledTransaction(userId, scheduledId, dueToday);

    expect(prisma.scheduledTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isActive: false }),
      })
    );
  });

  it('throws when the scheduled transaction is not active', async () => {
    vi.mocked(prisma.scheduledTransaction.findFirst).mockResolvedValue({
      ...mockMonthlyScheduled,
      isActive: false,
    });

    await expect(
      executeScheduledTransaction(userId, scheduledId, dueToday)
    ).rejects.toThrow('Scheduled transaction is not active');
  });

  it('records the given accountId on the created transaction when it belongs to the user', async () => {
    vi.mocked(prisma.scheduledTransaction.findFirst).mockResolvedValue(
      mockMonthlyScheduled
    );
    vi.mocked(prisma.financialAccount.findFirst).mockResolvedValue({
      id: 'acc_1',
      userId,
      name: 'Nubank',
      type: 'CHECKING' as const,
      balance: new Prisma.Decimal(0),
      color: '#6B7280',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await executeScheduledTransaction(userId, scheduledId, dueToday, 'acc_1');

    expect(prisma.financialAccount.findFirst).toHaveBeenCalledWith({
      where: { id: 'acc_1', userId },
    });
    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ accountId: 'acc_1' }),
      })
    );
  });

  it('rejects an accountId that does not belong to the user', async () => {
    vi.mocked(prisma.scheduledTransaction.findFirst).mockResolvedValue(
      mockMonthlyScheduled
    );
    vi.mocked(prisma.financialAccount.findFirst).mockResolvedValue(null);

    await expect(
      executeScheduledTransaction(
        userId,
        scheduledId,
        dueToday,
        'someone-elses-account'
      )
    ).rejects.toThrow('Account not found');
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });
});
