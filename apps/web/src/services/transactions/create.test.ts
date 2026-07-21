import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { Prisma } from '@/types';
import { createTransaction } from './create';

vi.mock('@/lib/db', () => ({
  prisma: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $transaction: vi.fn((callback: any) => callback(prisma)),
    category: { findUnique: vi.fn() },
    transaction: { create: vi.fn() },
    financialAccount: { count: vi.fn(), update: vi.fn() },
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
    accountId: null,
    toAccountId: null,
    creditCardId: null,
    installmentGroupId: null,
    installmentCurrent: null,
    installmentTotal: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.financialAccount.count).mockResolvedValue(0);
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

  it('should decrement the account balance when creating an EXPENSE linked to an account', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);
    vi.mocked(prisma.financialAccount.count).mockResolvedValue(1);
    vi.mocked(prisma.transaction.create).mockResolvedValue({
      ...mockCreatedTransaction,
      accountId: 'acc_1',
    });

    await createTransaction(userId, { ...validData, accountId: 'acc_1' });

    expect(prisma.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_1' },
      data: { balance: { increment: -100.5 } },
    });
  });

  it('should increment the account balance when creating an INCOME linked to an account', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue({
      ...mockCategory,
      type: 'INCOME' as const,
    });
    vi.mocked(prisma.financialAccount.count).mockResolvedValue(1);
    vi.mocked(prisma.transaction.create).mockResolvedValue({
      ...mockCreatedTransaction,
      type: 'INCOME' as const,
      accountId: 'acc_1',
    });

    await createTransaction(userId, {
      ...validData,
      type: 'INCOME',
      accountId: 'acc_1',
    });

    expect(prisma.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_1' },
      data: { balance: { increment: 100.5 } },
    });
  });

  it('should move funds between both accounts for a TRANSFER', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue({
      ...mockCategory,
      type: 'TRANSFER' as const,
    });
    vi.mocked(prisma.financialAccount.count).mockResolvedValue(2);
    vi.mocked(prisma.transaction.create).mockResolvedValue({
      ...mockCreatedTransaction,
      type: 'TRANSFER' as const,
      accountId: 'acc_1',
      toAccountId: 'acc_2',
    });

    await createTransaction(userId, {
      ...validData,
      type: 'TRANSFER',
      accountId: 'acc_1',
      toAccountId: 'acc_2',
    });

    expect(prisma.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_1' },
      data: { balance: { decrement: 100.5 } },
    });
    expect(prisma.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc_2' },
      data: { balance: { increment: 100.5 } },
    });
  });

  it('should reject a TRANSFER missing a destination account', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue({
      ...mockCategory,
      type: 'TRANSFER' as const,
    });

    await expect(
      createTransaction(userId, {
        ...validData,
        type: 'TRANSFER',
        accountId: 'acc_1',
      })
    ).rejects.toThrow(
      'Transfer requires exactly one destination: toAccountId or creditCardId'
    );
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });

  it('should reject an accountId that does not belong to the user', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);
    vi.mocked(prisma.financialAccount.count).mockResolvedValue(0);

    await expect(
      createTransaction(userId, { ...validData, accountId: 'not_mine' })
    ).rejects.toThrow('Account not found');
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });
});
