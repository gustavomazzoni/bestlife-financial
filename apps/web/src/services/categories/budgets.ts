import { prisma } from '@/lib/db';
import { CategoryBudget } from '@/types';
import { CategoryBudgetSummary } from '@/types/calculations';
import { getSpendingBreakdown } from '@/services/calculations/spending-analysis';
import { startOfMonth } from 'date-fns';

export async function getCategoryBudgets(
  userId: string,
  month: Date = new Date()
): Promise<CategoryBudgetSummary[]> {
  const reference = startOfMonth(month);

  const [budgets, breakdown] = await Promise.all([
    prisma.categoryBudget.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { category: { name: 'asc' } },
    }),
    getSpendingBreakdown(userId, 'month', reference),
  ]);

  const spentByCategory = new Map(
    breakdown.byCategory.map(c => [c.categoryId, c.amount])
  );

  return budgets.map(b => {
    const budgetAmount = Number(b.monthlyAmount);
    const spent = spentByCategory.get(b.categoryId) ?? 0;
    const pct =
      budgetAmount > 0 ? Math.round((spent / budgetAmount) * 10000) / 100 : 0;

    return {
      categoryId: b.categoryId,
      categoryName: b.category.name,
      categoryIcon: b.category.icon,
      categoryColor: b.category.color,
      budget: budgetAmount,
      spent,
      pct,
      isOverBudget: budgetAmount > 0 && spent > budgetAmount,
    };
  });
}

export async function upsertCategoryBudget(
  userId: string,
  categoryId: string,
  monthlyAmount: number
): Promise<CategoryBudget> {
  if (monthlyAmount <= 0) {
    throw new Error('Monthly amount must be positive');
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  if (category.type !== 'EXPENSE') {
    throw new Error('Budgets are only supported for expense categories');
  }

  return prisma.categoryBudget.upsert({
    where: { userId_categoryId: { userId, categoryId } },
    update: { monthlyAmount },
    create: { userId, categoryId, monthlyAmount },
  });
}
