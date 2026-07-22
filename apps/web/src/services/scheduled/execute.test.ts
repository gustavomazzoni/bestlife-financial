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
      findMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
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
    accountId: null,
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
    toAccountId: null,
    installmentGroupId: null,
    installmentCurrent: null,
    installmentTotal: null,
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
    vi.mocked(prisma.financialAccount.findMany).mockResolvedValue([]);
    vi.mocked(prisma.financialAccount.findUniqueOrThrow).mockResolvedValue({
      type: 'CHECKING',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
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
    vi.mocked(prisma.financialAccount.findMany).mockResolvedValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 'acc_1', type: 'CHECKING' } as any,
    ]);
    vi.mocked(prisma.transaction.create).mockResolvedValue({
      ...mockCreatedTransaction,
      accountId: 'acc_1',
    });

    await executeScheduledTransaction(userId, scheduledId, dueToday, 'acc_1');

    expect(prisma.financialAccount.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['acc_1'] }, userId },
      select: { id: true, type: true },
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
    vi.mocked(prisma.financialAccount.findMany).mockResolvedValue([]);

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

  it('debits the linked account by the scheduled amount on execution', async () => {
    vi.mocked(prisma.scheduledTransaction.findFirst).mockResolvedValue(
      mockMonthlyScheduled
    );
    vi.mocked(prisma.financialAccount.findMany).mockResolvedValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 'acc_1', type: 'CHECKING' } as any,
    ]);
    vi.mocked(prisma.transaction.create).mockResolvedValue({
      ...mockCreatedTransaction,
      accountId: 'acc_1',
    });

    await executeScheduledTransaction(userId, scheduledId, dueToday, 'acc_1');

    expect(prisma.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_1' },
      data: { balance: { increment: -180 } },
    });
  });

  it('increments the owed balance when executing a schedule against a credit-card account', async () => {
    vi.mocked(prisma.scheduledTransaction.findFirst).mockResolvedValue(
      mockMonthlyScheduled
    );
    vi.mocked(prisma.financialAccount.findMany).mockResolvedValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 'card_1', type: 'CREDIT_CARD' } as any,
    ]);
    vi.mocked(prisma.financialAccount.findUniqueOrThrow).mockResolvedValue({
      type: 'CREDIT_CARD',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    vi.mocked(prisma.transaction.create).mockResolvedValue({
      ...mockCreatedTransaction,
      accountId: 'card_1',
    });

    await executeScheduledTransaction(userId, scheduledId, dueToday, 'card_1');

    expect(prisma.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'card_1' },
      data: { balance: { increment: 180 } },
    });
  });

  it('rejects executing a non-EXPENSE schedule against a credit-card account', async () => {
    vi.mocked(prisma.scheduledTransaction.findFirst).mockResolvedValue({
      ...mockMonthlyScheduled,
      type: 'INCOME' as const,
    });
    vi.mocked(prisma.financialAccount.findMany).mockResolvedValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 'card_1', type: 'CREDIT_CARD' } as any,
    ]);

    await expect(
      executeScheduledTransaction(userId, scheduledId, dueToday, 'card_1')
    ).rejects.toThrow('A credit card can only fund an EXPENSE');
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });

  it('moves funds between both accounts when executing a TRANSFER schedule', async () => {
    vi.mocked(prisma.scheduledTransaction.findFirst).mockResolvedValue({
      ...mockMonthlyScheduled,
      type: 'TRANSFER' as const,
    });
    vi.mocked(prisma.financialAccount.findMany).mockResolvedValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 'acc_1', type: 'CHECKING' } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 'acc_2', type: 'SAVINGS' } as any,
    ]);
    vi.mocked(prisma.transaction.create).mockResolvedValue({
      ...mockCreatedTransaction,
      type: 'TRANSFER' as const,
      accountId: 'acc_1',
      toAccountId: 'acc_2',
    });

    await executeScheduledTransaction(
      userId,
      scheduledId,
      dueToday,
      'acc_1',
      'acc_2'
    );

    expect(prisma.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_1' },
      data: { balance: { decrement: 180 } },
    });
    expect(prisma.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_2' },
      data: { balance: { increment: 180 } },
    });
  });

  it('uses the given amount override instead of the template amount, for this occurrence only', async () => {
    vi.mocked(prisma.scheduledTransaction.findFirst).mockResolvedValue(
      mockMonthlyScheduled
    );
    vi.mocked(prisma.financialAccount.findMany).mockResolvedValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 'acc_1', type: 'CHECKING' } as any,
    ]);
    vi.mocked(prisma.transaction.create).mockResolvedValue({
      ...mockCreatedTransaction,
      amount: new Prisma.Decimal(215.5),
      accountId: 'acc_1',
    });

    await executeScheduledTransaction(
      userId,
      scheduledId,
      dueToday,
      'acc_1',
      undefined,
      215.5
    );

    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: 215.5 }),
      })
    );
    // the template's own amount is untouched
    expect(prisma.scheduledTransaction.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: expect.anything() }),
      })
    );
    expect(prisma.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_1' },
      data: { balance: { increment: -215.5 } },
    });
  });

  it('falls back to the template amount when no override is given', async () => {
    vi.mocked(prisma.scheduledTransaction.findFirst).mockResolvedValue(
      mockMonthlyScheduled
    );

    await executeScheduledTransaction(userId, scheduledId, dueToday);

    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: mockMonthlyScheduled.amount }),
      })
    );
  });

  it('rejects a non-positive amount override', async () => {
    vi.mocked(prisma.scheduledTransaction.findFirst).mockResolvedValue(
      mockMonthlyScheduled
    );

    await expect(
      executeScheduledTransaction(
        userId,
        scheduledId,
        dueToday,
        undefined,
        undefined,
        0
      )
    ).rejects.toThrow('Amount must be positive');
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });
});
