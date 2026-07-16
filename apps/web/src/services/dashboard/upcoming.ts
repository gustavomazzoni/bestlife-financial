import { addDays, format, isToday } from 'date-fns';
import { prisma } from '@/lib/db';
import { TransactionType, ScheduleFrequency } from '@/types';
import { toUTCMidnight, fromUTCCalendarDate } from '@lifeos/shared';

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
  const today = toUTCMidnight(new Date());
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

  return scheduled.map(s => {
    const calendarDate = fromUTCCalendarDate(s.nextOccurrence);
    return {
      id: `scheduled-${s.id}`,
      frequency: s.frequency,
      isRecurring: s.frequency !== 'ONCE',
      date: format(calendarDate, 'yyyy-MM-dd'),
      isToday: isToday(calendarDate),
      description: s.description,
      amount: s.amount.toString(),
      type: s.type,
      categoryIcon: s.category?.icon,
      categoryName: s.category?.name,
      scheduledId: s.id,
    };
  });
}
