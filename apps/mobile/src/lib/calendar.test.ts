import { CalendarEvent, sortDateGroups, splitUpcomingFromPast } from './calendar';

function events(): CalendarEvent[] {
  return [];
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

  it('puts strictly-past dates in past, today-or-future in upcoming', () => {
    const monthGroups: [string, CalendarEvent[]][] = [
      ['2026-07-20', events()],
      ['2026-07-15', events()],
      ['2026-07-10', events()],
      ['2026-07-05', events()],
    ];

    const { upcoming, past } = splitUpcomingFromPast(monthGroups, todayKey);

    expect(upcoming.map(([date]) => date)).toEqual(['2026-07-15', '2026-07-20']);
    expect(past.map(([date]) => date)).toEqual(['2026-07-10', '2026-07-05']);
  });

  it('returns an empty upcoming list when everything is in the past', () => {
    const monthGroups: [string, CalendarEvent[]][] = [
      ['2026-07-10', events()],
      ['2026-07-05', events()],
    ];

    const { upcoming, past } = splitUpcomingFromPast(monthGroups, todayKey);

    expect(upcoming).toEqual([]);
    expect(past).toHaveLength(2);
  });

  it('returns an empty past list when everything is upcoming', () => {
    const monthGroups: [string, CalendarEvent[]][] = [
      ['2026-07-25', events()],
      ['2026-07-20', events()],
    ];

    const { upcoming, past } = splitUpcomingFromPast(monthGroups, todayKey);

    expect(past).toEqual([]);
    expect(upcoming.map(([date]) => date)).toEqual(['2026-07-20', '2026-07-25']);
  });
});
