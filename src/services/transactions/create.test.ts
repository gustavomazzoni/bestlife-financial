import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { Prisma } from '@/types';
import { createTransaction } from './create';

vi.mock('@/lib/db', () => ({
  prisma: {
    category: { findUnique: vi.fn() },
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
    userId: null,
  };

  const mockCreatedTransaction = {
    id: 'txn_1',
    userId,
    ...validData,
    amount: new Prisma.Decimal(validData.amount),
    necessityLevel: null,
    valueAlignment: null,
    scheduledId: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create transaction with valid data', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);
    vi.mocked(prisma.transaction.create).mockResolvedValue(
      mockCreatedTransaction
    );

    const result = await createTransaction(userId, validData);

    expect(result).toBeDefined();
    expect(result.amount).toStrictEqual(decimalAmount);
    expect(result.userId).toBe(userId);
    expect(result.categoryId).toBe('cat_food_123');
  });

  it('should create transaction with optional fields', async () => {
    const dataWithExtras = {
      ...validData,
      necessityLevel: 'NEEDS' as const,
      notes: 'Some notes',
    };
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);
    vi.mocked(prisma.transaction.create).mockResolvedValue({
      ...mockCreatedTransaction,
      necessityLevel: 'NEEDS' as const,
      notes: 'Some notes',
    });

    await createTransaction(userId, dataWithExtras);

    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          necessityLevel: 'NEEDS',
          notes: 'Some notes',
        }),
      })
    );
  });

  it('should throw error for invalid category (not found)', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

    await expect(createTransaction(userId, validData)).rejects.toThrow(
      'Invalid category'
    );
  });

  it('should not call transaction.create when category validation fails', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

    await expect(createTransaction(userId, validData)).rejects.toThrow();
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });
});
