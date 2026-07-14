import { prisma } from '@/lib/db';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
} from 'date-fns';
import {
  SpendingBreakdown,
  CategoryExpense,
  NecessityBreakdown,
} from '@/types/calculations';

type Period = 'week' | 'month' | 'year';

function getPeriodBounds(
  period: Period,
  reference: Date
): { startDate: Date; endDate: Date } {
  switch (period) {
    case 'week':
      return {
        startDate: startOfWeek(reference),
        endDate: endOfWeek(reference),
      };
    case 'year':
      return {
        startDate: startOfYear(reference),
        endDate: endOfYear(reference),
      };
    case 'month':
    default:
      return {
        startDate: startOfMonth(reference),
        endDate: endOfMonth(reference),
      };
  }
}

export async function getSpendingBreakdown(
  userId: string,
  period: Period = 'month',
  reference: Date = new Date()
): Promise<SpendingBreakdown> {
  const { startDate, endDate } = getPeriodBounds(period, reference);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'EXPENSE',
      date: { gte: startDate, lte: endDate },
    },
    include: { category: true },
  });

  const totalExpenses = transactions.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

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
        totalExpenses > 0
          ? Math.round((cat.amount / totalExpenses) * 10000) / 100
          : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Group by necessity level
  const byNecessityLevel: NecessityBreakdown = {
    NEEDS: 0,
    IMPORTANT: 0,
    WANTS: 0,
    unclassified: 0,
  };

  transactions.forEach(t => {
    const amount = Number(t.amount);
    if (t.necessityLevel === 'NEEDS') {
      byNecessityLevel.NEEDS += amount;
    } else if (t.necessityLevel === 'IMPORTANT') {
      byNecessityLevel.IMPORTANT += amount;
    } else if (t.necessityLevel === 'WANTS') {
      byNecessityLevel.WANTS += amount;
    } else {
      byNecessityLevel.unclassified += amount;
    }
  });

  const valueAligned = byNecessityLevel.NEEDS + byNecessityLevel.IMPORTANT;
  const valueAlignedPercentage =
    totalExpenses > 0
      ? Math.round((valueAligned / totalExpenses) * 10000) / 100
      : 0;

  return {
    totalExpenses,
    byCategory,
    byNecessityLevel,
    valueAlignedPercentage,
    period: { startDate, endDate },
  };
}
