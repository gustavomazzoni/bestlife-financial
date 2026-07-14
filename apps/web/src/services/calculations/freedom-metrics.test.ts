import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { calculateFreedomMetrics } from './freedom-metrics';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUniqueOrThrow: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
    },
  },
}));

describe('calculateFreedomMetrics', () => {
  const userId = 'user_test_123';

  const mockUser = {
    id: userId,
    dreamLifestyleCost: 10000,
    currentInvestments: 500000,
    activeIncomeMonthly: 15000,
  };

  // 3 months of expenses: 3000 + 4000 + 5000 = 12000 total, average = 4000/month
  const mockTransactions = [
    {
      amount: 3000,
      date: new Date('2024-01-15'),
      categoryId: 'cat_1',
      category: { id: 'cat_1', name: 'Food', type: 'EXPENSE' },
    },
    {
      amount: 4000,
      date: new Date('2024-02-15'),
      categoryId: 'cat_1',
      category: { id: 'cat_1', name: 'Food', type: 'EXPENSE' },
    },
    {
      amount: 5000,
      date: new Date('2024-03-15'),
      categoryId: 'cat_2',
      category: { id: 'cat_2', name: 'Transport', type: 'EXPENSE' },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates fiNumber as dreamLifestyleCost × 12 × 25', async () => {
    vi.mocked(prisma.user.findUniqueOrThrow as Mock).mockResolvedValue(
      mockUser
    );
    vi.mocked(prisma.transaction.findMany as Mock).mockResolvedValue(
      mockTransactions
    );

    const result = await calculateFreedomMetrics(userId);

    expect(result.fiNumber).toBe(10000 * 12 * 25); // 3_000_000
    expect(result.dreamLifestyleCost).toBe(10000);
  });

  it('calculates currentRunway as currentInvestments / dreamLifestyleCost', async () => {
    vi.mocked(prisma.user.findUniqueOrThrow as Mock).mockResolvedValue(
      mockUser
    );
    vi.mocked(prisma.transaction.findMany as Mock).mockResolvedValue(
      mockTransactions
    );

    const result = await calculateFreedomMetrics(userId);

    // 500_000 / 10_000 = 50 months
    expect(result.currentRunway).toBe(50);
  });

  it('calculates savingsRate as (activeIncomeMonthly - avgExpenses) / activeIncomeMonthly × 100', async () => {
    vi.mocked(prisma.user.findUniqueOrThrow as Mock).mockResolvedValue(
      mockUser
    );
    vi.mocked(prisma.transaction.findMany as Mock).mockResolvedValue(
      mockTransactions
    );

    const result = await calculateFreedomMetrics(userId);

    // avgMonthlyExpenses = 12000 / 3 = 4000
    // savingsRate = (15000 - 4000) / 15000 × 100 = 73.33
    expect(result.savingsRate).toBe(73.33);
    expect(result.avgMonthlyExpenses).toBe(4000);
  });

  it('returns zero values (not errors) when user has no transactions', async () => {
    vi.mocked(prisma.user.findUniqueOrThrow as Mock).mockResolvedValue(
      mockUser
    );
    vi.mocked(prisma.transaction.findMany as Mock).mockResolvedValue([]);

    const result = await calculateFreedomMetrics(userId);

    expect(result.avgMonthlyExpenses).toBe(0);
    expect(result.fiNumber).toBe(3_000_000);
    expect(result.savingsRate).toBe(100); // (15000 - 0) / 15000 × 100
  });

  it('caps fiProgress at 100 when currentInvestments >= fiNumber', async () => {
    const richUser = {
      ...mockUser,
      currentInvestments: 999_999_999,
    };
    vi.mocked(prisma.user.findUniqueOrThrow as Mock).mockResolvedValue(
      richUser
    );
    vi.mocked(prisma.transaction.findMany as Mock).mockResolvedValue([]);

    const result = await calculateFreedomMetrics(userId);

    expect(result.fiProgress).toBe(100);
    expect(result.monthsToFI).toBe(0);
  });

  it('returns monthsToFI = null when savingsRate <= 0 (spending >= income)', async () => {
    const userOverspending = {
      ...mockUser,
      activeIncomeMonthly: 2000, // less than avg expenses (4000)
    };
    vi.mocked(prisma.user.findUniqueOrThrow as Mock).mockResolvedValue(
      userOverspending
    );
    vi.mocked(prisma.transaction.findMany as Mock).mockResolvedValue(
      mockTransactions
    );

    const result = await calculateFreedomMetrics(userId);

    expect(result.monthsToFI).toBeNull();
  });

  it('returns fiNumber = 0 when dreamLifestyleCost is null', async () => {
    const userNoDream = {
      ...mockUser,
      dreamLifestyleCost: null,
    };
    vi.mocked(prisma.user.findUniqueOrThrow as Mock).mockResolvedValue(
      userNoDream
    );
    vi.mocked(prisma.transaction.findMany as Mock).mockResolvedValue([]);

    const result = await calculateFreedomMetrics(userId);

    expect(result.fiNumber).toBe(0);
    expect(result.fiProgress).toBe(0);
    expect(result.currentRunway).toBe(0);
    expect(result.dreamLifestyleCost).toBe(0);
  });
});
