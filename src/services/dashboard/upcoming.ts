import { addDays, format, isToday, startOfDay } from 'date-fns';
import { prisma } from '@/lib/db';
import { TransactionType, ScheduleFrequency } from '@/types';

export interface UpcomingItem {
  id: string;
  frequency: ScheduleFrequency;
  isRecurring: boolean;
  date: string; // YYYY-MM-DD
  isToday: boolean;
  description: string;
  amount: string; // Decimal serialized as string
  type: TransactionType;
  categoryIcon?: string;
  categoryName?: string;
  scheduledId: string;
}

export async function getUpcomingItems(
  userId: string,
  days = 7
): Promise<UpcomingItem[]> {
  const today = startOfDay(new Date());
  const cutoff = addDays(today, days);

  const scheduled = await prisma.scheduledTransaction.findMany({
    where: {
      userId,
      isActive: true,
      nextOccurrence: { gte: today, lt: cutoff },
    },
    include: { category: true },
    orderBy: { nextOccurrence: 'asc' },
  });

  return scheduled.map(s => ({
    id: `scheduled-${s.id}`,
    frequency: s.frequency,
    isRecurring: s.frequency !== 'ONCE',
    date: format(s.nextOccurrence, 'yyyy-MM-dd'),
    isToday: isToday(s.nextOccurrence),
    description: s.description,
    amount: s.amount.toString(),
    type: s.type,
    categoryIcon: s.category?.icon,
    categoryName: s.category?.name,
    scheduledId: s.id,
  }));
}
