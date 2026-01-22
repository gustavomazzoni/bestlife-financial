import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { Prisma } from '@/types';
import { createRecurringTransaction } from './create';
import { addDays, addMonths, addYears, startOfDay } from 'date-fns';

vi.mock('@/lib/db', () => ({
  prisma: {
    category: { findUnique: vi.fn() },
    recurringTransaction: { create: vi.fn() },
  },
}));

describe('createRecurringTransaction', () => {
  const userId = 'user_test_123';
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

  const validWeeklyData = {
    amount: 50.0,
    description: 'Internet subscription',
    type: 'EXPENSE' as const,
    categoryId: 'cat_bills_123',
    frequency: 'WEEKLY' as const,
    startDate: tomorrow,
  };

  const validMonthlyData = {
    ...validWeeklyData,
    frequency: 'MONTHLY' as const,
    description: 'Rent payment',
    amount: 1500.0,
  };

  const validYearlyData = {
    ...validWeeklyData,
    frequency: 'YEARLY' as const,
    description: 'Annual insurance',
    amount: 3000.0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(today);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create recurring transaction with valid data', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);

    const expectedNextDueDate = addDays(tomorrow, 7);

    vi.mocked(prisma.recurringTransaction.create).mockResolvedValue({
      id: 'rec_1',
      userId,
      amount: new Prisma.Decimal(validWeeklyData.amount),
      description: validWeeklyData.description,
      type: validWeeklyData.type,
      categoryId: validWeeklyData.categoryId,
      frequency: validWeeklyData.frequency,
      startDate: validWeeklyData.startDate,
      endDate: null,
      nextDueDate: expectedNextDueDate,
      notificationDaysBefore: 3,
      isActive: true,
      lastCreatedDate: null,
      necessityLevel: null,
      valueAlignment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createRecurringTransaction(userId, validWeeklyData);

    expect(result).toBeDefined();
    expect(result.userId).toBe(userId);
    expect(result.description).toBe(validWeeklyData.description);
    expect(result.frequency).toBe('WEEKLY');
    expect(result.isActive).toBe(true);
    expect(result.notificationDaysBefore).toBe(3);
    expect(prisma.category.findUnique).toHaveBeenCalledWith({
      where: { id: validWeeklyData.categoryId },
    });
  });

  it('should calculate initial nextDueDate correctly for WEEKLY', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);

    const expectedNextDueDate = addDays(tomorrow, 7);

    vi.mocked(prisma.recurringTransaction.create).mockResolvedValue({
      id: 'rec_1',
      userId,
      amount: new Prisma.Decimal(validWeeklyData.amount),
      description: validWeeklyData.description,
      type: validWeeklyData.type,
      categoryId: validWeeklyData.categoryId,
      frequency: validWeeklyData.frequency,
      startDate: validWeeklyData.startDate,
      endDate: null,
      nextDueDate: expectedNextDueDate,
      notificationDaysBefore: 3,
      isActive: true,
      lastCreatedDate: null,
      necessityLevel: null,
      valueAlignment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createRecurringTransaction(userId, validWeeklyData);

    expect(result.nextDueDate).toEqual(expectedNextDueDate);
    expect(prisma.recurringTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nextDueDate: expectedNextDueDate,
        }),
      })
    );
  });

  it('should calculate initial nextDueDate correctly for MONTHLY', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);

    const expectedNextDueDate = addMonths(tomorrow, 1);

    vi.mocked(prisma.recurringTransaction.create).mockResolvedValue({
      id: 'rec_1',
      userId,
      amount: new Prisma.Decimal(validMonthlyData.amount),
      description: validMonthlyData.description,
      type: validMonthlyData.type,
      categoryId: validMonthlyData.categoryId,
      frequency: validMonthlyData.frequency,
      startDate: validMonthlyData.startDate,
      endDate: null,
      nextDueDate: expectedNextDueDate,
      notificationDaysBefore: 3,
      isActive: true,
      lastCreatedDate: null,
      necessityLevel: null,
      valueAlignment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createRecurringTransaction(userId, validMonthlyData);

    expect(result.nextDueDate).toEqual(expectedNextDueDate);
  });

  it('should calculate initial nextDueDate correctly for YEARLY', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);

    const expectedNextDueDate = addYears(tomorrow, 1);

    vi.mocked(prisma.recurringTransaction.create).mockResolvedValue({
      id: 'rec_1',
      userId,
      amount: new Prisma.Decimal(validYearlyData.amount),
      description: validYearlyData.description,
      type: validYearlyData.type,
      categoryId: validYearlyData.categoryId,
      frequency: validYearlyData.frequency,
      startDate: validYearlyData.startDate,
      endDate: null,
      nextDueDate: expectedNextDueDate,
      notificationDaysBefore: 3,
      isActive: true,
      lastCreatedDate: null,
      necessityLevel: null,
      valueAlignment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createRecurringTransaction(userId, validYearlyData);

    expect(result.nextDueDate).toEqual(expectedNextDueDate);
  });

  it('should throw error for invalid categoryId', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

    await expect(
      createRecurringTransaction(userId, validWeeklyData)
    ).rejects.toThrow('Category not found');
  });

  it('should throw error for mismatched category type', async () => {
    // Category is INCOME but transaction is EXPENSE
    vi.mocked(prisma.category.findUnique).mockResolvedValue({
      ...mockCategory,
      type: 'INCOME',
    });

    await expect(
      createRecurringTransaction(userId, validWeeklyData)
    ).rejects.toThrow('Category type does not match transaction type');
  });

  it('should throw error for negative amount', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);

    const invalidData = {
      ...validWeeklyData,
      amount: -50.0,
    };

    await expect(
      createRecurringTransaction(userId, invalidData)
    ).rejects.toThrow('Amount must be positive');
  });

  it('should throw error for endDate before startDate', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);

    const invalidData = {
      ...validWeeklyData,
      startDate: addDays(today, 10),
      endDate: addDays(today, 5), // endDate is before startDate
    };

    await expect(
      createRecurringTransaction(userId, invalidData)
    ).rejects.toThrow('End date must be after start date');
  });

  it('should throw error for startDate in the past', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);

    const invalidData = {
      ...validWeeklyData,
      startDate: addDays(today, -5), // 5 days in the past
    };

    await expect(
      createRecurringTransaction(userId, invalidData)
    ).rejects.toThrow('Start date cannot be in the past');
  });

  it('should create recurring transaction with optional fields', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);

    const dataWithOptionalFields = {
      ...validWeeklyData,
      necessityLevel: 'NEEDS' as const,
      valueAlignment: 'ALIGNED' as const,
      endDate: addMonths(tomorrow, 6),
      notificationDaysBefore: 5,
    };

    vi.mocked(prisma.recurringTransaction.create).mockResolvedValue({
      id: 'rec_1',
      userId,
      amount: new Prisma.Decimal(dataWithOptionalFields.amount),
      description: dataWithOptionalFields.description,
      type: dataWithOptionalFields.type,
      categoryId: dataWithOptionalFields.categoryId,
      frequency: dataWithOptionalFields.frequency,
      startDate: dataWithOptionalFields.startDate,
      endDate: dataWithOptionalFields.endDate,
      nextDueDate: addDays(tomorrow, 7),
      notificationDaysBefore: dataWithOptionalFields.notificationDaysBefore,
      isActive: true,
      lastCreatedDate: null,
      necessityLevel: dataWithOptionalFields.necessityLevel,
      valueAlignment: dataWithOptionalFields.valueAlignment,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createRecurringTransaction(
      userId,
      dataWithOptionalFields
    );

    expect(result.necessityLevel).toBe('NEEDS');
    expect(result.valueAlignment).toBe('ALIGNED');
    expect(result.notificationDaysBefore).toBe(5);
    expect(result.endDate).toEqual(dataWithOptionalFields.endDate);
  });

  it('should use default notificationDaysBefore of 3 when not provided', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);

    vi.mocked(prisma.recurringTransaction.create).mockResolvedValue({
      id: 'rec_1',
      userId,
      amount: new Prisma.Decimal(validWeeklyData.amount),
      description: validWeeklyData.description,
      type: validWeeklyData.type,
      categoryId: validWeeklyData.categoryId,
      frequency: validWeeklyData.frequency,
      startDate: validWeeklyData.startDate,
      endDate: null,
      nextDueDate: addDays(tomorrow, 7),
      notificationDaysBefore: 3,
      isActive: true,
      lastCreatedDate: null,
      necessityLevel: null,
      valueAlignment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createRecurringTransaction(userId, validWeeklyData);

    expect(result.notificationDaysBefore).toBe(3);
    expect(prisma.recurringTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          notificationDaysBefore: 3,
        }),
      })
    );
  });
});
