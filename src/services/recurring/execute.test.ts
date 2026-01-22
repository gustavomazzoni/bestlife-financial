import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { Prisma } from '@/types';
import { executeRecurringTransaction } from './execute';
import { addDays, addMonths, addYears, startOfDay } from 'date-fns';

vi.mock('@/lib/db', () => ({
  prisma: {
    recurringTransaction: { findFirst: vi.fn(), update: vi.fn() },
    transaction: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

// Helper to create mock transaction context
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockTxContext = (overrides: any) => overrides;

describe('executeRecurringTransaction', () => {
  const userId = 'user_test_123';
  const recurringId = 'rec_123';
  const today = startOfDay(new Date());

  const mockCategory = {
    id: 'cat_bills_123',
    name: 'Contas',
    type: 'EXPENSE' as const,
    isSystemDefault: true,
    color: '#EF4444',
    icon: '📄',
    createdAt: new Date(),
  };

  const mockRecurringWeekly = {
    id: recurringId,
    userId,
    amount: new Prisma.Decimal(100),
    description: 'Weekly payment',
    type: 'EXPENSE' as const,
    categoryId: 'cat_bills_123',
    frequency: 'WEEKLY' as const,
    startDate: addDays(today, -14),
    endDate: null,
    nextDueDate: today, // Due today
    notificationDaysBefore: 3,
    isActive: true,
    lastCreatedDate: addDays(today, -7),
    necessityLevel: 'NEEDS' as const,
    valueAlignment: 'ALIGNED' as const,
    createdAt: addDays(today, -14),
    updatedAt: addDays(today, -7),
    category: mockCategory,
  };

  const mockRecurringMonthly = {
    ...mockRecurringWeekly,
    id: 'rec_monthly_123',
    frequency: 'MONTHLY' as const,
    description: 'Monthly payment',
  };

  const mockRecurringYearly = {
    ...mockRecurringWeekly,
    id: 'rec_yearly_123',
    frequency: 'YEARLY' as const,
    description: 'Yearly payment',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(today);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create transaction from recurring', async () => {
    const expectedTransaction = {
      id: 'txn_1',
      userId,
      date: today,
      amount: mockRecurringWeekly.amount,
      description: mockRecurringWeekly.description,
      type: mockRecurringWeekly.type,
      categoryId: mockRecurringWeekly.categoryId,
      necessityLevel: mockRecurringWeekly.necessityLevel,
      valueAlignment: mockRecurringWeekly.valueAlignment,
      isRecurring: true,
      recurringId: recurringId,
      notes: null,
      createdAt: today,
      updatedAt: today,
    };

    vi.mocked(prisma.$transaction).mockImplementation(async callback => {
      return callback(
        createMockTxContext({
          recurringTransaction: {
            findFirst: vi.fn().mockResolvedValue(mockRecurringWeekly),
            update: vi.fn().mockResolvedValue({
              ...mockRecurringWeekly,
              lastCreatedDate: today,
              nextDueDate: addDays(today, 7),
            }),
          },
          transaction: {
            create: vi.fn().mockResolvedValue(expectedTransaction),
          },
        })
      );
    });

    const result = await executeRecurringTransaction(userId, recurringId);

    expect(result).toBeDefined();
    expect(result.description).toBe(mockRecurringWeekly.description);
    expect(result.isRecurring).toBe(true);
  });

  it('should link created transaction to recurring (recurringId)', async () => {
    const expectedTransaction = {
      id: 'txn_1',
      userId,
      date: today,
      amount: mockRecurringWeekly.amount,
      description: mockRecurringWeekly.description,
      type: mockRecurringWeekly.type,
      categoryId: mockRecurringWeekly.categoryId,
      necessityLevel: mockRecurringWeekly.necessityLevel,
      valueAlignment: mockRecurringWeekly.valueAlignment,
      isRecurring: true,
      recurringId: recurringId,
      notes: null,
      createdAt: today,
      updatedAt: today,
    };

    const mockTransactionCreate = vi
      .fn()
      .mockResolvedValue(expectedTransaction);

    vi.mocked(prisma.$transaction).mockImplementation(async callback => {
      return callback(
        createMockTxContext({
          recurringTransaction: {
            findFirst: vi.fn().mockResolvedValue(mockRecurringWeekly),
            update: vi.fn().mockResolvedValue({
              ...mockRecurringWeekly,
              lastCreatedDate: today,
              nextDueDate: addDays(today, 7),
            }),
          },
          transaction: {
            create: mockTransactionCreate,
          },
        })
      );
    });

    const result = await executeRecurringTransaction(userId, recurringId);

    expect(result.recurringId).toBe(recurringId);
    expect(mockTransactionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recurringId: recurringId,
          isRecurring: true,
        }),
      })
    );
  });

  it('should update lastCreatedDate', async () => {
    const mockRecurringUpdate = vi.fn().mockResolvedValue({
      ...mockRecurringWeekly,
      lastCreatedDate: today,
      nextDueDate: addDays(today, 7),
    });

    vi.mocked(prisma.$transaction).mockImplementation(async callback => {
      return callback(
        createMockTxContext({
          recurringTransaction: {
            findFirst: vi.fn().mockResolvedValue(mockRecurringWeekly),
            update: mockRecurringUpdate,
          },
          transaction: {
            create: vi.fn().mockResolvedValue({
              id: 'txn_1',
              userId,
              recurringId,
              isRecurring: true,
            }),
          },
        })
      );
    });

    await executeRecurringTransaction(userId, recurringId);

    expect(mockRecurringUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastCreatedDate: today,
        }),
      })
    );
  });

  it('should calculate next nextDueDate for WEEKLY', async () => {
    const expectedNextDueDate = addDays(today, 7);
    const mockRecurringUpdate = vi.fn().mockResolvedValue({
      ...mockRecurringWeekly,
      lastCreatedDate: today,
      nextDueDate: expectedNextDueDate,
    });

    vi.mocked(prisma.$transaction).mockImplementation(async callback => {
      return callback(
        createMockTxContext({
          recurringTransaction: {
            findFirst: vi.fn().mockResolvedValue(mockRecurringWeekly),
            update: mockRecurringUpdate,
          },
          transaction: {
            create: vi.fn().mockResolvedValue({
              id: 'txn_1',
              userId,
              recurringId,
              isRecurring: true,
            }),
          },
        })
      );
    });

    await executeRecurringTransaction(userId, recurringId);

    expect(mockRecurringUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nextDueDate: expectedNextDueDate,
        }),
      })
    );
  });

  it('should calculate next nextDueDate for MONTHLY', async () => {
    const expectedNextDueDate = addMonths(today, 1);
    const mockRecurringUpdate = vi.fn().mockResolvedValue({
      ...mockRecurringMonthly,
      lastCreatedDate: today,
      nextDueDate: expectedNextDueDate,
    });

    vi.mocked(prisma.$transaction).mockImplementation(async callback => {
      return callback(
        createMockTxContext({
          recurringTransaction: {
            findFirst: vi.fn().mockResolvedValue(mockRecurringMonthly),
            update: mockRecurringUpdate,
          },
          transaction: {
            create: vi.fn().mockResolvedValue({
              id: 'txn_1',
              userId,
              recurringId: mockRecurringMonthly.id,
              isRecurring: true,
            }),
          },
        })
      );
    });

    await executeRecurringTransaction(userId, mockRecurringMonthly.id);

    expect(mockRecurringUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nextDueDate: expectedNextDueDate,
        }),
      })
    );
  });

  it('should calculate next nextDueDate for YEARLY', async () => {
    const expectedNextDueDate = addYears(today, 1);
    const mockRecurringUpdate = vi.fn().mockResolvedValue({
      ...mockRecurringYearly,
      lastCreatedDate: today,
      nextDueDate: expectedNextDueDate,
    });

    vi.mocked(prisma.$transaction).mockImplementation(async callback => {
      return callback(
        createMockTxContext({
          recurringTransaction: {
            findFirst: vi.fn().mockResolvedValue(mockRecurringYearly),
            update: mockRecurringUpdate,
          },
          transaction: {
            create: vi.fn().mockResolvedValue({
              id: 'txn_1',
              userId,
              recurringId: mockRecurringYearly.id,
              isRecurring: true,
            }),
          },
        })
      );
    });

    await executeRecurringTransaction(userId, mockRecurringYearly.id);

    expect(mockRecurringUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nextDueDate: expectedNextDueDate,
        }),
      })
    );
  });

  it('should set isActive=false if reached endDate', async () => {
    const recurringWithEndDate = {
      ...mockRecurringWeekly,
      endDate: addDays(today, 3), // End date is before next due date
    };
    const nextDueDate = addDays(today, 7); // Next due date would be after endDate

    const mockRecurringUpdate = vi.fn().mockResolvedValue({
      ...recurringWithEndDate,
      lastCreatedDate: today,
      nextDueDate: nextDueDate,
      isActive: false,
    });

    vi.mocked(prisma.$transaction).mockImplementation(async callback => {
      return callback(
        createMockTxContext({
          recurringTransaction: {
            findFirst: vi.fn().mockResolvedValue(recurringWithEndDate),
            update: mockRecurringUpdate,
          },
          transaction: {
            create: vi.fn().mockResolvedValue({
              id: 'txn_1',
              userId,
              recurringId,
              isRecurring: true,
            }),
          },
        })
      );
    });

    await executeRecurringTransaction(userId, recurringId);

    expect(mockRecurringUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isActive: false,
        }),
      })
    );
  });

  it('should throw error if not due yet', async () => {
    const notDueYetRecurring = {
      ...mockRecurringWeekly,
      nextDueDate: addDays(today, 5), // Due in 5 days
    };

    vi.mocked(prisma.$transaction).mockImplementation(async callback => {
      return callback(
        createMockTxContext({
          recurringTransaction: {
            findFirst: vi.fn().mockResolvedValue(notDueYetRecurring),
            update: vi.fn(),
          },
          transaction: {
            create: vi.fn(),
          },
        })
      );
    });

    await expect(
      executeRecurringTransaction(userId, recurringId)
    ).rejects.toThrow('Recurring transaction is not due yet');
  });

  it('should throw error when recurring not found', async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async callback => {
      return callback(
        createMockTxContext({
          recurringTransaction: {
            findFirst: vi.fn().mockResolvedValue(null),
            update: vi.fn(),
          },
          transaction: {
            create: vi.fn(),
          },
        })
      );
    });

    await expect(
      executeRecurringTransaction(userId, recurringId)
    ).rejects.toThrow('Recurring transaction not found');
  });

  it('should throw error when recurring is inactive', async () => {
    const inactiveRecurring = {
      ...mockRecurringWeekly,
      isActive: false,
    };

    vi.mocked(prisma.$transaction).mockImplementation(async callback => {
      return callback(
        createMockTxContext({
          recurringTransaction: {
            findFirst: vi.fn().mockResolvedValue(inactiveRecurring),
            update: vi.fn(),
          },
          transaction: {
            create: vi.fn(),
          },
        })
      );
    });

    await expect(
      executeRecurringTransaction(userId, recurringId)
    ).rejects.toThrow('Recurring transaction is not active');
  });

  it('should verify userId ownership', async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async callback => {
      return callback(
        createMockTxContext({
          recurringTransaction: {
            findFirst: vi.fn().mockResolvedValue(null),
            update: vi.fn(),
          },
          transaction: {
            create: vi.fn(),
          },
        })
      );
    });

    await expect(
      executeRecurringTransaction('other_user_id', recurringId)
    ).rejects.toThrow('Recurring transaction not found');
  });
});
