import { describe, it, expect } from 'vitest';
import {
  projectRecurringOccurrences,
  transactionsToCalendarEvents,
  getCalendarGridDates,
  groupEventsByDate,
} from './calendar';
import type { RecurringWithCategory } from '@/components/features/recurring';
import type { TransactionRow, CalendarEvent } from '@/types';

function makeRecurring(
  overrides: Partial<RecurringWithCategory> = {}
): RecurringWithCategory {
  return {
    id: 'rec_1',
    amount: '1000',
    description: 'Test recurring',
    type: 'EXPENSE',
    categoryId: 'cat_1',
    category: { id: 'cat_1', name: 'Test', icon: '📊', color: '#000' },
    frequency: 'MONTHLY',
    startDate: '2026-01-01',
    endDate: null,
    nextDueDate: '2026-03-15',
    lastCreatedDate: null,
    notificationDaysBefore: 3,
    isActive: true,
    necessityLevel: null,
    valueAlignment: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('projectRecurringOccurrences', () => {
  it('returns empty array for empty input', () => {
    const result = projectRecurringOccurrences(
      [],
      new Date('2026-03-01'),
      new Date('2026-03-31')
    );
    expect(result).toHaveLength(0);
  });

  it('projects a MONTHLY recurring within the window', () => {
    const recurring = makeRecurring({ nextDueDate: '2026-03-15' });
    const result = projectRecurringOccurrences(
      [recurring],
      new Date('2026-03-01'),
      new Date('2026-03-31')
    );
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-03-15');
    expect(result[0].kind).toBe('recurring_projection');
    expect(result[0].amount).toBe('1000');
    expect(result[0].type).toBe('EXPENSE');
  });

  it('projects WEEKLY recurring with multiple occurrences', () => {
    const recurring = makeRecurring({
      frequency: 'WEEKLY',
      nextDueDate: '2026-03-02',
    });
    const result = projectRecurringOccurrences(
      [recurring],
      new Date('2026-03-01'),
      new Date('2026-03-31')
    );
    // March 2, 9, 16, 23, 30 = 5 occurrences
    expect(result).toHaveLength(5);
    expect(result[0].date).toBe('2026-03-02');
    expect(result[4].date).toBe('2026-03-30');
  });

  it('skips YEARLY recurring outside the current month window', () => {
    const recurring = makeRecurring({
      frequency: 'YEARLY',
      nextDueDate: '2026-12-15',
    });
    const result = projectRecurringOccurrences(
      [recurring],
      new Date('2026-03-01'),
      new Date('2026-03-31')
    );
    expect(result).toHaveLength(0);
  });

  it('skips recurring whose endDate is before startDate', () => {
    const recurring = makeRecurring({
      endDate: '2026-02-28',
      nextDueDate: '2026-02-15',
    });
    const result = projectRecurringOccurrences(
      [recurring],
      new Date('2026-03-01'),
      new Date('2026-03-31')
    );
    expect(result).toHaveLength(0);
  });

  it('stops projections at recurring endDate', () => {
    const recurring = makeRecurring({
      frequency: 'WEEKLY',
      nextDueDate: '2026-03-02',
      endDate: '2026-03-16',
    });
    const result = projectRecurringOccurrences(
      [recurring],
      new Date('2026-03-01'),
      new Date('2026-03-31')
    );
    // March 2, 9, 16 (March 23 would be past endDate March 16)
    expect(result).toHaveLength(3);
    expect(result[2].date).toBe('2026-03-16');
  });

  it('handles MONTHLY Feb edge case (addMonths handles last day of month)', () => {
    const recurring = makeRecurring({
      frequency: 'MONTHLY',
      nextDueDate: '2026-01-31',
    });
    const result = projectRecurringOccurrences(
      [recurring],
      new Date('2026-02-01'),
      new Date('2026-02-28')
    );
    // Jan 31 is before startDate, not pushed; addMonths → Feb 28 (date-fns handles this)
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-02-28');
  });
});

describe('transactionsToCalendarEvents', () => {
  it('maps transactions to calendar events with correct fields', () => {
    const tx = {
      id: 'tx_1',
      date: new Date('2026-03-15T00:00:00.000Z'),
      amount: { toString: () => '500' } as unknown,
      description: 'Salário',
      type: 'INCOME' as const,
      category: {
        id: 'cat_1',
        name: 'Renda',
        icon: '💰',
        color: '#0f0',
        type: 'INCOME' as const,
        userId: 'u1',
        isSystemDefault: true,
        createdAt: new Date(),
      },
      userId: 'user_1',
      necessityLevel: null,
      valueAlignment: null,
      isRecurring: false,
      recurringId: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      categoryId: 'cat_1',
    } as unknown as TransactionRow;

    const result = transactionsToCalendarEvents([tx]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('actual');
    expect(result[0].sourceId).toBe('tx_1');
    expect(result[0].type).toBe('INCOME');
    expect(result[0].amount).toBe('500');
    expect(result[0].categoryName).toBe('Renda');
  });

  it('returns empty array for empty input', () => {
    expect(transactionsToCalendarEvents([])).toHaveLength(0);
  });
});

describe('getCalendarGridDates', () => {
  it('returns exactly 42 dates', () => {
    const dates = getCalendarGridDates(2026, 2); // March 2026 (0-indexed)
    expect(dates).toHaveLength(42);
  });

  it('first date is a Monday', () => {
    const dates = getCalendarGridDates(2026, 2); // March 2026
    expect(dates[0].getDay()).toBe(1); // 1 = Monday
  });

  it('includes the first and last day of the month', () => {
    const dates = getCalendarGridDates(2026, 2); // March 2026
    const dateStrings = dates.map(d => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    });
    expect(dateStrings).toContain('2026-03-01');
    expect(dateStrings).toContain('2026-03-31');
  });

  it('returns 42 dates for a month where week starts mid-week', () => {
    const dates = getCalendarGridDates(2026, 0); // January 2026 (starts on Thursday)
    expect(dates).toHaveLength(42);
    expect(dates[0].getDay()).toBe(1); // Monday
  });
});

describe('groupEventsByDate', () => {
  it('groups events by date key', () => {
    const events: CalendarEvent[] = [
      {
        date: '2026-03-15',
        kind: 'actual',
        description: 'A',
        amount: '100',
        type: 'EXPENSE',
        sourceId: '1',
      },
      {
        date: '2026-03-15',
        kind: 'recurring_projection',
        description: 'B',
        amount: '200',
        type: 'INCOME',
        sourceId: '2',
      },
      {
        date: '2026-03-16',
        kind: 'actual',
        description: 'C',
        amount: '300',
        type: 'EXPENSE',
        sourceId: '3',
      },
    ];
    const grouped = groupEventsByDate(events);
    expect(grouped.size).toBe(2);
    expect(grouped.get('2026-03-15')).toHaveLength(2);
    expect(grouped.get('2026-03-16')).toHaveLength(1);
  });

  it('returns empty Map for empty array', () => {
    const grouped = groupEventsByDate([]);
    expect(grouped.size).toBe(0);
  });
});
