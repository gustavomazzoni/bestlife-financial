import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { getCategoryBudgets, upsertCategoryBudget } from './budgets';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    categoryBudget: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
    },
  },
}));

describe('getCategoryBudgets', () => {
  const userId = 'user_test_123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('joins budgets with actual spend and computes pct/isOverBudget', async () => {
    vi.mocked(prisma.categoryBudget.findMany as Mock).mockResolvedValue([
      {
        id: 'budget_1',
        userId,
        categoryId: 'cat_mercado',
        monthlyAmount: 500,
        category: {
          id: 'cat_mercado',
          name: 'Mercado',
          icon: '🛒',
          color: '#F97316',
        },
      },
    ]);
    vi.mocked(prisma.transaction.findMany as Mock).mockResolvedValue([
      {
        amount: 300,
        categoryId: 'cat_mercado',
        category: { id: 'cat_mercado', name: 'Mercado', type: 'EXPENSE' },
      },
      {
        amount: 250,
        categoryId: 'cat_mercado',
        category: { id: 'cat_mercado', name: 'Mercado', type: 'EXPENSE' },
      },
    ]);

    const result = await getCategoryBudgets(userId);

    expect(result).toEqual([
      {
        categoryId: 'cat_mercado',
        categoryName: 'Mercado',
        categoryIcon: '🛒',
        categoryColor: '#F97316',
        budget: 500,
        spent: 550,
        pct: 110,
        isOverBudget: true,
      },
    ]);
  });

  it('returns spent = 0 when there are no transactions for the budgeted category', async () => {
    vi.mocked(prisma.categoryBudget.findMany as Mock).mockResolvedValue([
      {
        id: 'budget_1',
        userId,
        categoryId: 'cat_lazer',
        monthlyAmount: 200,
        category: {
          id: 'cat_lazer',
          name: 'Lazer',
          icon: '🎬',
          color: '#8B5CF6',
        },
      },
    ]);
    vi.mocked(prisma.transaction.findMany as Mock).mockResolvedValue([]);

    const result = await getCategoryBudgets(userId);

    expect(result[0].spent).toBe(0);
    expect(result[0].pct).toBe(0);
    expect(result[0].isOverBudget).toBe(false);
  });

  it('returns an empty array when the user has no budgets', async () => {
    vi.mocked(prisma.categoryBudget.findMany as Mock).mockResolvedValue([]);
    vi.mocked(prisma.transaction.findMany as Mock).mockResolvedValue([]);

    const result = await getCategoryBudgets(userId);

    expect(result).toEqual([]);
  });
});

describe('upsertCategoryBudget', () => {
  const userId = 'user_test_123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates/updates a budget for a valid expense category', async () => {
    vi.mocked(prisma.category.findUnique as Mock).mockResolvedValue({
      id: 'cat_mercado',
      name: 'Mercado',
      type: 'EXPENSE',
    });
    vi.mocked(prisma.categoryBudget.upsert as Mock).mockResolvedValue({
      id: 'budget_1',
      userId,
      categoryId: 'cat_mercado',
      monthlyAmount: 500,
    });

    const result = await upsertCategoryBudget(userId, 'cat_mercado', 500);

    expect(result.monthlyAmount).toBe(500);
    expect(prisma.categoryBudget.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_categoryId: { userId, categoryId: 'cat_mercado' } },
        create: { userId, categoryId: 'cat_mercado', monthlyAmount: 500 },
      })
    );
  });

  it('throws for a non-existent category', async () => {
    vi.mocked(prisma.category.findUnique as Mock).mockResolvedValue(null);

    await expect(
      upsertCategoryBudget(userId, 'cat_missing', 500)
    ).rejects.toThrow('Category not found');
  });

  it('throws for a non-expense category', async () => {
    vi.mocked(prisma.category.findUnique as Mock).mockResolvedValue({
      id: 'cat_renda',
      name: 'Renda',
      type: 'INCOME',
    });

    await expect(
      upsertCategoryBudget(userId, 'cat_renda', 500)
    ).rejects.toThrow('Budgets are only supported for expense categories');
  });

  it('throws for a non-positive monthly amount', async () => {
    await expect(
      upsertCategoryBudget(userId, 'cat_mercado', 0)
    ).rejects.toThrow('Monthly amount must be positive');
    expect(prisma.category.findUnique).not.toHaveBeenCalled();
  });
});
