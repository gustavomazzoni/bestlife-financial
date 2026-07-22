import { CalendarEvent, sortDateGroups, splitUpcomingFromPast } from './calendar';

function events(): CalendarEvent[] {
  return [];
}

function actualEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    date: '2026-07-15',
    description: 'Test',
    amount: '10',
    type: 'EXPENSE',
    kind: 'actual',
    sourceId: 'txn_1',
    ...overrides,
  };
}

function scheduledEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    date: '2026-07-15',
    description: 'Test',
    amount: '10',
    type: 'EXPENSE',
    kind: 'scheduled_projection',
    sourceId: 'sched_1',
    ...overrides,
  };
}

describe('sortDateGroups', () => {
  const entries: [string, CalendarEvent[]][] = [
    ['2026-07-10', events()],
    ['2026-07-01', events()],
    ['2026-07-20', events()],
  ];

  it('sorts ascending (soonest first) for future months', () => {
    const result = sortDateGroups(entries, 'asc');
    expect(result.map(([date]) => date)).toEqual([
      '2026-07-01',
      '2026-07-10',
      '2026-07-20',
    ]);
  });

  it('sorts descending (most recent first) for current/past months', () => {
    const result = sortDateGroups(entries, 'desc');
    expect(result.map(([date]) => date)).toEqual([
      '2026-07-20',
      '2026-07-10',
      '2026-07-01',
    ]);
  });

  it('does not mutate the input array', () => {
    const original = [...entries];
    sortDateGroups(entries, 'asc');
    expect(entries).toEqual(original);
  });
});

describe('splitUpcomingFromPast', () => {
  const todayKey = '2026-07-15';

  it('puts a strictly-future scheduled item in upcoming', () => {
    const monthGroups: [string, CalendarEvent[]][] = [
      ['2026-07-20', [scheduledEvent({ date: '2026-07-20' })]],
    ];

    const { upcoming, past } = splitUpcomingFromPast(monthGroups, todayKey);

    expect(upcoming.map(([date]) => date)).toEqual(['2026-07-20']);
    expect(past).toEqual([]);
  });

  it('does not treat an executed transaction dated today as upcoming', () => {
    const monthGroups: [string, CalendarEvent[]][] = [
      ['2026-07-15', [actualEvent({ date: '2026-07-15' })]],
    ];

    const { upcoming, past } = splitUpcomingFromPast(monthGroups, todayKey);

    expect(upcoming).toEqual([]);
    expect(past.map(([date]) => date)).toEqual(['2026-07-15']);
  });

  it('does not treat a scheduled item due exactly today as upcoming', () => {
    const monthGroups: [string, CalendarEvent[]][] = [
      ['2026-07-15', [scheduledEvent({ date: '2026-07-15' })]],
    ];

    const { upcoming, past } = splitUpcomingFromPast(monthGroups, todayKey);

    expect(upcoming).toEqual([]);
    expect(past.map(([date]) => date)).toEqual(['2026-07-15']);
  });

  it('does not treat an executed transaction as upcoming even if somehow future-dated', () => {
    const monthGroups: [string, CalendarEvent[]][] = [
      ['2026-07-20', [actualEvent({ date: '2026-07-20' })]],
    ];

    const { upcoming, past } = splitUpcomingFromPast(monthGroups, todayKey);

    expect(upcoming).toEqual([]);
    expect(past.map(([date]) => date)).toEqual(['2026-07-20']);
  });

  it('puts a past-due (overdue) scheduled item in past, not upcoming', () => {
    const monthGroups: [string, CalendarEvent[]][] = [
      ['2026-07-05', [scheduledEvent({ date: '2026-07-05' })]],
    ];

    const { upcoming, past } = splitUpcomingFromPast(monthGroups, todayKey);

    expect(upcoming).toEqual([]);
    expect(past.map(([date]) => date)).toEqual(['2026-07-05']);
  });

  it('splits a mixed date group by event, not by date, when the same day has both a future scheduled item and something already resolved', () => {
    const monthGroups: [string, CalendarEvent[]][] = [
      [
        '2026-07-20',
        [
          scheduledEvent({ date: '2026-07-20', sourceId: 'sched_future' }),
          actualEvent({ date: '2026-07-20', sourceId: 'txn_future' }),
        ],
      ],
    ];

    const { upcoming, past } = splitUpcomingFromPast(monthGroups, todayKey);

    expect(upcoming).toEqual([['2026-07-20', [monthGroups[0][1][0]]]]);
    expect(past).toEqual([['2026-07-20', [monthGroups[0][1][1]]]]);
  });

  it('sorts upcoming soonest-first regardless of input order', () => {
    const monthGroups: [string, CalendarEvent[]][] = [
      ['2026-07-25', [scheduledEvent({ date: '2026-07-25' })]],
      ['2026-07-20', [scheduledEvent({ date: '2026-07-20' })]],
    ];

    const { upcoming } = splitUpcomingFromPast(monthGroups, todayKey);

    expect(upcoming.map(([date]) => date)).toEqual(['2026-07-20', '2026-07-25']);
  });

  it('returns empty groups for empty input', () => {
    const { upcoming, past } = splitUpcomingFromPast([], todayKey);
    expect(upcoming).toEqual([]);
    expect(past).toEqual([]);
  });
});
