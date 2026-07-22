import { CalendarEvent, sortDateGroups } from './calendar';

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
