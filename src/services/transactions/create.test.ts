import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { Prisma } from '@/types';
import { createTransaction } from './create';
import { startOfDay } from 'date-fns';

vi.mock('@/lib/db', () => ({
  prisma: {
    category: { findUnique: vi.fn() },
    transaction: { create: vi.fn() },
  },
}));

describe('createTransaction', () => {
  const userId = 'user_test_123';
  const today = startOfDay(new Date());

  const validData = {
    date: new Date('2024-01-15'),
    amount: 100.5,
    description: 'Grocery shopping',
    type: 'EXPENSE' as const,
    categoryId: 'cat_food_123',
  };

  const decimalAmount = new Prisma.Decimal(validData.amount);

  const mockCategory = {
    id: 'cat_food_123',
    name: 'Alimentação',
    type: 'EXPENSE' as const,
    isSystemDefault: true,
    color: '#F97316',
    icon: '🍔',
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(today);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create transaction with valid data', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);
    vi.mocked(prisma.transaction.create).mockResolvedValue({
      id: 'txn_1',
      userId,
      ...validData,
      amount: new Prisma.Decimal(validData.amount),
      status: 'EXECUTED',
      necessityLevel: null,
      valueAlignment: null,
      isRecurring: false,
      recurringId: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createTransaction(userId, validData);

    expect(result).toBeDefined();
    expect(result.amount).toStrictEqual(decimalAmount);
    expect(result.userId).toBe(userId);
    expect(result.categoryId).toBe('cat_food_123');
  });

  it('should auto-set status to EXECUTED for past/today dates', async () => {
    const pastData = { ...validData, date: new Date('2024-01-15') };
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);
    vi.mocked(prisma.transaction.create).mockResolvedValue({
      id: 'txn_1',
      userId,
      ...pastData,
      amount: new Prisma.Decimal(pastData.amount),
      status: 'EXECUTED',
      necessityLevel: null,
      valueAlignment: null,
      isRecurring: false,
      recurringId: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await createTransaction(userId, pastData);

    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'EXECUTED' }),
      })
    );
  });

  it('should auto-set status to PENDING for future dates', async () => {
    const futureDate = new Date(today.getTime() + 2 * 86400000); // 2 days ahead
    const futureData = { ...validData, date: futureDate };

    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);
    vi.mocked(prisma.transaction.create).mockResolvedValue({
      id: 'txn_future',
      userId,
      ...futureData,
      amount: new Prisma.Decimal(futureData.amount),
      status: 'PENDING',
      necessityLevel: null,
      valueAlignment: null,
      isRecurring: false,
      recurringId: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await createTransaction(userId, futureData);

    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PENDING' }),
      })
    );
  });

  it('should respect explicitly provided status', async () => {
    const pastData = {
      ...validData,
      date: new Date('2024-01-15'),
      status: 'PENDING' as const,
    };
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);
    vi.mocked(prisma.transaction.create).mockResolvedValue({
      id: 'txn_1',
      userId,
      ...pastData,
      amount: new Prisma.Decimal(pastData.amount),
      status: 'PENDING',
      necessityLevel: null,
      valueAlignment: null,
      isRecurring: false,
      recurringId: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await createTransaction(userId, pastData);

    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PENDING' }),
      })
    );
  });

  it('should throw error for mismatched category type', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

    await expect(createTransaction(userId, validData)).rejects.toThrow(
      'Invalid category'
    );
  });
});
