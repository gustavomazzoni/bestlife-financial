import {
  addDays,
  addMonths,
  addYears,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ScheduledTransaction, Transaction } from '../types';

export type CalendarEventKind = 'scheduled_projection' | 'actual';

export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  description: string;
  amount: string;
  type: string;
  kind: CalendarEventKind;
  sourceId: string;
  categoryIcon?: string;
  categoryName?: string;
  categoryColor?: string;
}

export function projectScheduledOccurrences(
  scheduled: ScheduledTransaction[],
  windowStart: Date,
  windowEnd: Date
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const s of scheduled) {
    const endDate = s.endDate ? new Date(s.endDate) : null;
    if (endDate && endDate < windowStart) continue;

    let cursor = startOfDay(new Date(s.nextOccurrence));

    while (cursor <= windowEnd) {
      if (cursor >= windowStart) {
        events.push({
          date: format(cursor, 'yyyy-MM-dd'),
          description: s.description,
          amount: s.amount,
          type: s.type,
          kind: 'scheduled_projection',
          sourceId: s.id,
          categoryIcon: s.category?.icon,
          categoryName: s.category?.name,
          categoryColor: s.category?.color,
        });
      }

      if (s.frequency === 'ONCE') break;
      if (endDate && cursor > endDate) break;

      cursor =
        s.frequency === 'WEEKLY'
          ? addDays(cursor, 7)
          : s.frequency === 'MONTHLY'
            ? addMonths(cursor, 1)
            : addYears(cursor, 1);
    }
  }

  return events;
}

export function transactionsToCalendarEvents(
  transactions: Transaction[]
): CalendarEvent[] {
  return transactions.map(t => ({
    date: format(new Date(t.date), 'yyyy-MM-dd'),
    description: t.description,
    amount: t.amount,
    type: t.type,
    kind: 'actual',
    sourceId: t.id,
    categoryIcon: t.category?.icon,
    categoryName: t.category?.name,
    categoryColor: t.category?.color,
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

/** Returns 42 dates (6x7 grid) for the given month, Monday-start, padded with adjacent months. */
export function getMonthGridDates(year: number, month: number): Date[] {
  const firstOfMonth = startOfMonth(new Date(year, month, 1));
  const gridStart = startOfWeek(firstOfMonth, { weekStartsOn: 1 });

  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}
