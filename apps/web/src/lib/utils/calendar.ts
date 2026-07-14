import { addDays, addMonths, addYears, startOfDay, format } from 'date-fns';
import type { ScheduledWithCategory } from '@/components/features/scheduled';
import type { TransactionRow, CalendarEvent } from '@/types';

export function projectScheduledOccurrences(
  scheduleds: ScheduledWithCategory[],
  startDate: Date,
  endDate: Date
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const scheduled of scheduleds) {
    // ONCE items are not recurring projections — skip frequency expansion
    if (scheduled.frequency === 'ONCE') continue;

    // Skip if scheduled.endDate is before startDate
    if (scheduled.endDate) {
      const scheduledEnd = startOfDay(new Date(scheduled.endDate));
      if (scheduledEnd < startDate) continue;
    }

    // Start cursor at startOfDay(nextOccurrence)
    let cursor = startOfDay(new Date(scheduled.nextOccurrence));
    const scheduledEnd = scheduled.endDate
      ? startOfDay(new Date(scheduled.endDate))
      : null;

    while (cursor <= endDate) {
      if (cursor >= startDate) {
        events.push({
          date: format(cursor, 'yyyy-MM-dd'),
          description: scheduled.description,
          amount: scheduled.amount,
          type: scheduled.type,
          kind: 'recurring_projection',
          sourceId: scheduled.id,
          categoryIcon: scheduled.category?.icon ?? undefined,
          categoryName: scheduled.category?.name ?? undefined,
        });
      }

      // Advance cursor
      switch (scheduled.frequency) {
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

      // Break if cursor > scheduled.endDate
      if (scheduledEnd && cursor > scheduledEnd) break;
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
