import {
  addDays,
  addMonths,
  addYears,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { fromUTCCalendarDate } from '@lifeos/shared';
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
    const endDate = s.endDate ? fromUTCCalendarDate(s.endDate) : null;
    if (endDate && endDate < windowStart) continue;

    let cursor = fromUTCCalendarDate(s.nextOccurrence);

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
    date: format(fromUTCCalendarDate(t.date), 'yyyy-MM-dd'),
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

export type DateGroup = [string, CalendarEvent[]];

/** 'asc' = soonest date first (future months); 'desc' = most recent date
 * first (current/past months). */
export function sortDateGroups(
  entries: DateGroup[],
  direction: 'asc' | 'desc'
): DateGroup[] {
  return [...entries].sort(([a], [b]) =>
    direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
  );
}

/** Splits the current month's date groups into today-or-future ("upcoming")
 * and strictly-past groups. Upcoming reads soonest-first regardless of the
 * input order, since it's a forward-looking list; past keeps the input
 * order (the month's own desc/asc sort already applied by the caller). */
export function splitUpcomingFromPast(
  monthGroups: DateGroup[],
  todayKey: string
): { upcoming: DateGroup[]; past: DateGroup[] } {
  const upcoming = monthGroups.filter(([date]) => date >= todayKey);
  const past = monthGroups.filter(([date]) => date < todayKey);
  return { upcoming: sortDateGroups(upcoming, 'asc'), past };
}

/** Returns 42 dates (6x7 grid) for the given month, Monday-start, padded with adjacent months. */
export function getMonthGridDates(year: number, month: number): Date[] {
  const firstOfMonth = startOfMonth(new Date(year, month, 1));
  const gridStart = startOfWeek(firstOfMonth, { weekStartsOn: 1 });

  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}
