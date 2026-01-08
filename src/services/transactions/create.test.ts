import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { Prisma } from '@/types';
import { createTransaction } from './create';

vi.mock('@/lib/db', () => ({
  prisma: {
    category: { findFirst: vi.fn() },
    transaction: { create: vi.fn() },
  },
}));

describe('createTransaction', () => {
  const userId = 'user_test_123';
  const validData = {
    date: new Date('2024-01-15'),
    amount: 100.5,
    description: 'Grocery shopping',
    type: 'EXPENSE' as const,
    category: 'Alimentação',
  };

  const decimalAmount = new Prisma.Decimal(validData.amount);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create transaction with valid data', async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue({
      id: 'cat_1',
      name: 'Alimentação',
      type: 'EXPENSE',
      isSystemDefault: true,
      color: '#F97316',
      icon: '🍔',
      createdAt: new Date(),
    });

    vi.mocked(prisma.transaction.create).mockResolvedValue({
      id: 'txn_1',
      userId,
      ...validData,
      amount: new Prisma.Decimal(validData.amount),
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
    expect(prisma.transaction.create).toHaveBeenCalledWith({
      data: {
        ...validData,
        userId,
      },
    });
  });

  it('should throw error for negative amount', async () => {
    const invalidData = { ...validData, amount: -100 };
    await expect(createTransaction(userId, invalidData)).rejects.toThrow();
  });

  it('should throw error for invalid category', async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue(null);

    await expect(createTransaction(userId, validData)).rejects.toThrow(
      'Category not found'
    );
  });

  it('should throw error for future date', async () => {
    const futureData = { ...validData, date: new Date('2030-01-01') };

    await expect(createTransaction(userId, futureData)).rejects.toThrow(
      'Date cannot be in the future'
    );
  });
});
