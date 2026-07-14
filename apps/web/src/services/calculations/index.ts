import { prisma } from '@/lib/db';
import {
  MonthlyExpenses,
  SavingsRate,
  CategoryBreakdown,
  CategoryExpense,
} from '@/types/calculations';

export async function calculateMonthlyExpenses(
  userId: string,
  months: number = 12
): Promise<MonthlyExpenses> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'EXPENSE',
      date: { gte: startDate, lte: endDate },
    },
    include: { category: true },
  });

  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const average = Math.round((total / months) * 100) / 100;

  // Group by category
  const categoryMap = new Map<string, CategoryExpense>();

  transactions.forEach(t => {
    const existing = categoryMap.get(t.categoryId);
    if (existing) {
      existing.amount += Number(t.amount);
      existing.transactionCount += 1;
    } else {
      categoryMap.set(t.categoryId, {
        categoryId: t.categoryId,
        categoryName: t.category.name,
        amount: Number(t.amount),
        percentage: 0,
        transactionCount: 1,
      });
    }
  });

  const byCategory = Array.from(categoryMap.values())
    .map(cat => ({
      ...cat,
      percentage:
        total > 0 ? Math.round((cat.amount / total) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    total,
    average,
    byCategory,
    period: { startDate, endDate, months },
  };
}

export async function calculateSavingsRate(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<SavingsRate> {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
  });

  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalSavings = transactions
    .filter(t => t.type === 'SAVING')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netSavings = totalIncome - totalExpenses - totalSavings;
  const rate =
    totalIncome > 0 ? Math.round((netSavings / totalIncome) * 10000) / 100 : 0;

  return {
    rate,
    totalIncome,
    totalExpenses,
    totalSavings,
    netSavings,
    period: { startDate, endDate },
  };
}

export async function getCategoryBreakdown(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<CategoryBreakdown> {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    include: { category: true },
  });

  const groupByType = (
    type: 'INCOME' | 'EXPENSE' | 'SAVING'
  ): CategoryExpense[] => {
    const filtered = transactions.filter(t => t.type === type);
    const total = filtered.reduce((sum, t) => sum + Number(t.amount), 0);

    const categoryMap = new Map<string, CategoryExpense>();

    filtered.forEach(t => {
      const existing = categoryMap.get(t.categoryId);
      if (existing) {
        existing.amount += Number(t.amount);
        existing.transactionCount += 1;
      } else {
        categoryMap.set(t.categoryId, {
          categoryId: t.categoryId,
          categoryName: t.category.name,
          amount: Number(t.amount),
          percentage: 0,
          transactionCount: 1,
        });
      }
    });

    return Array.from(categoryMap.values())
      .map(cat => ({
        ...cat,
        percentage:
          total > 0 ? Math.round((cat.amount / total) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const income = groupByType('INCOME');
  const expenses = groupByType('EXPENSE');
  const savings = groupByType('SAVING');

  return {
    income,
    expenses,
    savings,
    totalIncome: income.reduce((sum, c) => sum + c.amount, 0),
    totalExpenses: expenses.reduce((sum, c) => sum + c.amount, 0),
    totalSavings: savings.reduce((sum, c) => sum + c.amount, 0),
  };
}
