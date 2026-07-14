import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { getSpendingBreakdown } from './spending-analysis';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    transaction: {
      findMany: vi.fn(),
    },
  },
}));

describe('getSpendingBreakdown', () => {
  const userId = 'user_test_123';

  const catFood = { id: 'cat_food', name: 'Food', type: 'EXPENSE' };
  const catTransport = {
    id: 'cat_transport',
    name: 'Transport',
    type: 'EXPENSE',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sums correctly by category with percentages', async () => {
    const mockTransactions = [
      {
        amount: 2000,
        categoryId: 'cat_food',
        category: catFood,
        necessityLevel: 'NEEDS',
      },
      {
        amount: 1000,
        categoryId: 'cat_food',
        category: catFood,
        necessityLevel: 'NEEDS',
      },
      {
        amount: 1000,
        categoryId: 'cat_transport',
        category: catTransport,
        necessityLevel: 'WANTS',
      },
    ];
    vi.mocked(prisma.transaction.findMany as Mock).mockResolvedValue(
      mockTransactions
    );

    const result = await getSpendingBreakdown(userId, 'month');

    expect(result.totalExpenses).toBe(4000);
    expect(result.byCategory).toHaveLength(2);

    const food = result.byCategory.find(c => c.categoryId === 'cat_food');
    expect(food?.amount).toBe(3000);
    expect(food?.percentage).toBe(75);
    expect(food?.transactionCount).toBe(2);

    const transport = result.byCategory.find(
      c => c.categoryId === 'cat_transport'
    );
    expect(transport?.amount).toBe(1000);
    expect(transport?.percentage).toBe(25);
  });

  it('NecessityLevel breakdown sums to totalExpenses', async () => {
    const mockTransactions = [
      {
        amount: 1500,
        categoryId: 'cat_food',
        category: catFood,
        necessityLevel: 'NEEDS',
      },
      {
        amount: 1000,
        categoryId: 'cat_food',
        category: catFood,
        necessityLevel: 'IMPORTANT',
      },
      {
        amount: 500,
        categoryId: 'cat_transport',
        category: catTransport,
        necessityLevel: 'WANTS',
      },
      {
        amount: 200,
        categoryId: 'cat_transport',
        category: catTransport,
        necessityLevel: null,
      },
    ];
    vi.mocked(prisma.transaction.findMany as Mock).mockResolvedValue(
      mockTransactions
    );

    const result = await getSpendingBreakdown(userId, 'month');

    const { NEEDS, IMPORTANT, WANTS, unclassified } = result.byNecessityLevel;
    expect(NEEDS + IMPORTANT + WANTS + unclassified).toBe(result.totalExpenses);
    expect(NEEDS).toBe(1500);
    expect(IMPORTANT).toBe(1000);
    expect(WANTS).toBe(500);
    expect(unclassified).toBe(200);
  });

  it('calculates valueAlignedPercentage as (NEEDS + IMPORTANT) / totalExpenses × 100', async () => {
    const mockTransactions = [
      {
        amount: 3000,
        categoryId: 'cat_food',
        category: catFood,
        necessityLevel: 'NEEDS',
      },
      {
        amount: 1000,
        categoryId: 'cat_food',
        category: catFood,
        necessityLevel: 'IMPORTANT',
      },
      {
        amount: 1000,
        categoryId: 'cat_transport',
        category: catTransport,
        necessityLevel: 'WANTS',
      },
    ];
    vi.mocked(prisma.transaction.findMany as Mock).mockResolvedValue(
      mockTransactions
    );

    const result = await getSpendingBreakdown(userId, 'month');

    // (3000 + 1000) / 5000 × 100 = 80
    expect(result.valueAlignedPercentage).toBe(80);
  });

  it('returns all zeros for empty transaction list without errors', async () => {
    vi.mocked(prisma.transaction.findMany as Mock).mockResolvedValue([]);

    const result = await getSpendingBreakdown(userId, 'month');

    expect(result.totalExpenses).toBe(0);
    expect(result.byCategory).toHaveLength(0);
    expect(result.byNecessityLevel.NEEDS).toBe(0);
    expect(result.byNecessityLevel.IMPORTANT).toBe(0);
    expect(result.byNecessityLevel.WANTS).toBe(0);
    expect(result.byNecessityLevel.unclassified).toBe(0);
    expect(result.valueAlignedPercentage).toBe(0);
  });

  it('returns valueAlignedPercentage = 0 when all expenses have no necessityLevel', async () => {
    const mockTransactions = [
      {
        amount: 2000,
        categoryId: 'cat_food',
        category: catFood,
        necessityLevel: null,
      },
      {
        amount: 1000,
        categoryId: 'cat_transport',
        category: catTransport,
        necessityLevel: null,
      },
    ];
    vi.mocked(prisma.transaction.findMany as Mock).mockResolvedValue(
      mockTransactions
    );

    const result = await getSpendingBreakdown(userId, 'month');

    expect(result.totalExpenses).toBe(3000);
    expect(result.valueAlignedPercentage).toBe(0);
    expect(result.byNecessityLevel.unclassified).toBe(3000);
  });
});
