import { addDays, format, isToday, startOfDay } from 'date-fns';
import { prisma } from '@/lib/db';
import { TransactionType } from '@/types';

export interface UpcomingItem {
  id: string;
  kind: 'scheduled' | 'recurring';
  date: string; // YYYY-MM-DD
  isToday: boolean;
  description: string;
  amount: string; // Decimal serialized as string
  type: TransactionType;
  categoryIcon?: string;
  categoryName?: string;
  recurringId?: string;
  transactionId?: string;
}

export async function getUpcomingItems(
  userId: string,
  days = 7
): Promise<UpcomingItem[]> {
  const today = startOfDay(new Date());
  const cutoff = addDays(today, days);

  const [pendingTransactions, recurringTransactions] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        status: 'PENDING',
        date: { gte: today, lt: cutoff },
      },
      include: { category: true },
      orderBy: { date: 'asc' },
    }),
    prisma.recurringTransaction.findMany({
      where: {
        userId,
        isActive: true,
        nextDueDate: { gte: today, lt: cutoff },
      },
      include: { category: true },
      orderBy: { nextDueDate: 'asc' },
    }),
  ]);

  const scheduledItems: UpcomingItem[] = pendingTransactions.map(t => ({
    id: `scheduled-${t.id}`,
    kind: 'scheduled' as const,
    date: format(t.date, 'yyyy-MM-dd'),
    isToday: isToday(t.date),
    description: t.description,
    amount: t.amount.toString(),
    type: t.type,
    categoryIcon: t.category?.icon,
    categoryName: t.category?.name,
    transactionId: t.id,
  }));

  const recurringItems: UpcomingItem[] = recurringTransactions.map(r => ({
    id: `recurring-${r.id}`,
    kind: 'recurring' as const,
    date: format(r.nextDueDate, 'yyyy-MM-dd'),
    isToday: isToday(r.nextDueDate),
    description: r.description,
    amount: r.amount.toString(),
    type: r.type,
    categoryIcon: r.category?.icon,
    categoryName: r.category?.name,
    recurringId: r.id,
  }));

  return [...scheduledItems, ...recurringItems].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}
