import { prisma } from '@/lib/db';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { MonthlySummary } from '@/types/calculations';

export async function getMonthlySummary(
  userId: string,
  months: number = 3
): Promise<MonthlySummary[]> {
  const today = new Date();
  const startDate = startOfMonth(subMonths(today, months - 1));
  const endDate = endOfMonth(today);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: { in: ['INCOME', 'EXPENSE'] },
      date: { gte: startDate, lte: endDate },
    },
    select: { date: true, amount: true, type: true },
  });

  // Initialize all months (oldest → newest), ensuring zero-filled slots
  const result = new Map<string, MonthlySummary>();
  for (let i = months - 1; i >= 0; i--) {
    const key = format(subMonths(today, i), 'yyyy-MM');
    result.set(key, { month: key, income: 0, expenses: 0 });
  }

  transactions.forEach(t => {
    const key = format(new Date(t.date), 'yyyy-MM');
    const entry = result.get(key);
    if (!entry) return;
    if (t.type === 'INCOME') entry.income += Number(t.amount);
    if (t.type === 'EXPENSE') entry.expenses += Number(t.amount);
  });

  return Array.from(result.values());
}
