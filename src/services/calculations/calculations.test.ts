import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import {
  calculateMonthlyExpenses,
  calculateSavingsRate,
  getCategoryBreakdown,
} from './index';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    transaction: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
    },
  },
}));

describe('Calculations', () => {
  const userId = 'user_test_123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateMonthlyExpenses', () => {
    it('should calculate average monthly expenses', async () => {
      const mockTransactions = [
        { amount: 1000, date: new Date('2024-01-15'), categoryId: 'cat_1' },
        { amount: 1500, date: new Date('2024-02-15'), categoryId: 'cat_1' },
        { amount: 1200, date: new Date('2024-03-15'), categoryId: 'cat_2' },
      ];

      vi.mocked(prisma.transaction.findMany as Mock).mockResolvedValue(
        mockTransactions
      );
      vi.mocked(prisma.category.findMany as Mock).mockResolvedValue([
        { id: 'cat_1', name: 'Food', type: 'EXPENSE' },
        { id: 'cat_2', name: 'Transport', type: 'EXPENSE' },
      ]);

      const result = await calculateMonthlyExpenses(userId, 3);

      expect(result.total).toBe(3700);
      expect(result.average).toBe(1233.33);
      expect(result.period.months).toBe(3);
      expect(result.byCategory).toHaveLength(2);
    });

    it('should return zero for no expenses', async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([]);

      const result = await calculateMonthlyExpenses(userId, 3);

      expect(result.total).toBe(0);
      expect(result.average).toBe(0);
    });
  });

  describe('calculateSavingsRate', () => {
    it('should calculate savings rate correctly', async () => {
      const mockTransactions = [
        { type: 'INCOME', amount: 5000 },
        { type: 'INCOME', amount: 5000 },
        { type: 'EXPENSE', amount: 3000 },
        { type: 'EXPENSE', amount: 2000 },
        { type: 'SAVING', amount: 1000 },
      ];

      vi.mocked(prisma.transaction.findMany as Mock).mockResolvedValue(
        mockTransactions
      );

      const result = await calculateSavingsRate(
        userId,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.totalIncome).toBe(10000);
      expect(result.totalExpenses).toBe(5000);
      expect(result.totalSavings).toBe(1000);
      expect(result.netSavings).toBe(4000); // Income - Expenses - Savings
      expect(result.rate).toBe(50); // 5000 / 10000 * 100
    });

    it('should return 0% rate when no income', async () => {
      vi.mocked(prisma.transaction.findMany as Mock).mockResolvedValue([
        { type: 'EXPENSE', amount: 1000 },
      ]);

      const result = await calculateSavingsRate(
        userId,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.rate).toBe(0);
    });
  });

  describe('getCategoryBreakdown', () => {
    it('should breakdown transactions by category and type', async () => {
      const mockTransactions = [
        { type: 'INCOME', amount: 5000, categoryId: 'cat_income' },
        { type: 'EXPENSE', amount: 2000, categoryId: 'cat_food' },
        { type: 'EXPENSE', amount: 1000, categoryId: 'cat_transport' },
        { type: 'SAVING', amount: 1500, categoryId: 'cat_investment' },
      ];

      vi.mocked(prisma.transaction.findMany as Mock).mockResolvedValue(
        mockTransactions
      );
      vi.mocked(prisma.category.findMany as Mock).mockResolvedValue([
        { id: 'cat_income', name: 'Salary', type: 'INCOME' },
        { id: 'cat_food', name: 'Food', type: 'EXPENSE' },
        { id: 'cat_transport', name: 'Transport', type: 'EXPENSE' },
        { id: 'cat_investment', name: 'Investment', type: 'SAVING' },
      ]);

      const result = await getCategoryBreakdown(
        userId,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.totalIncome).toBe(5000);
      expect(result.totalExpenses).toBe(3000);
      expect(result.totalSavings).toBe(1500);
      expect(result.income).toHaveLength(1);
      expect(result.expenses).toHaveLength(2);
      expect(result.savings).toHaveLength(1);
    });
  });
});
