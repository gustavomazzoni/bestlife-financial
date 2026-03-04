import { addDays, addMonths, addYears, startOfDay, format } from 'date-fns';
import type { RecurringWithCategory } from '@/components/features/recurring';
import type { TransactionRow, CalendarEvent } from '@/types';

export function projectRecurringOccurrences(
  recurrings: RecurringWithCategory[],
  startDate: Date,
  endDate: Date
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const recurring of recurrings) {
    // Skip if recurring.endDate is before startDate
    if (recurring.endDate) {
      const recurringEnd = startOfDay(new Date(recurring.endDate));
      if (recurringEnd < startDate) continue;
    }

    // Start cursor at startOfDay(nextDueDate)
    let cursor = startOfDay(new Date(recurring.nextDueDate));
    const recurringEnd = recurring.endDate
      ? startOfDay(new Date(recurring.endDate))
      : null;

    while (cursor <= endDate) {
      if (cursor >= startDate) {
        events.push({
          date: format(cursor, 'yyyy-MM-dd'),
          description: recurring.description,
          amount: recurring.amount,
          type: recurring.type,
          kind: 'recurring_projection',
          sourceId: recurring.id,
          categoryIcon: recurring.category?.icon ?? undefined,
          categoryName: recurring.category?.name ?? undefined,
        });
      }

      // Advance cursor
      switch (recurring.frequency) {
        case 'WEEKLY':
          cursor = addDays(cursor, 7);
          break;
        case 'MONTHLY':
          cursor = addMonths(cursor, 1);
          break;
        case 'YEARLY':
          cursor = addYears(cursor, 1);
          break;
      }

      // Break if cursor > recurring.endDate
      if (recurringEnd && cursor > recurringEnd) break;
    }
  }

  return events;
}

export function transactionsToCalendarEvents(
  transactions: TransactionRow[]
): CalendarEvent[] {
  return transactions.map(t => ({
    date: format(new Date(t.date), 'yyyy-MM-dd'),
    description: t.description,
    amount: String(t.amount),
    type: t.type,
    kind: 'actual' as const,
    sourceId: t.id,
    categoryIcon: t.category?.icon ?? undefined,
    categoryName: t.category?.name ?? undefined,
  }));
}

export function groupEventsByDate(
  events: CalendarEvent[]
): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const existing = map.get(event.date);
    if (existing) {
      existing.push(event);
    } else {
      map.set(event.date, [event]);
    }
  }
  return map;
}

export function getCalendarGridDates(year: number, month: number): Date[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const dayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, ...
  // Start on Monday: Sunday → go back 6 days; else go back (dayOfWeek - 1) days
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const gridStart = addDays(firstDayOfMonth, -offset);

  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}
