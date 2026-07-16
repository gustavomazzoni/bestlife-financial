import { describe, it, expect } from 'vitest';
import { toUTCMidnight, fromUTCCalendarDate } from '@lifeos/shared';

describe('toUTCMidnight', () => {
  it('collapses a local noon date to UTC midnight of the same calendar day', () => {
    const noon = new Date(2026, 6, 28, 12, 0, 0); // July 28, 2026, local noon
    const result = toUTCMidnight(noon);
    expect(result.toISOString()).toBe('2026-07-28T00:00:00.000Z');
  });

  it('handles month-end / leap-year dates correctly', () => {
    const leapDay = new Date(2028, 1, 29, 23, 59, 59); // Feb 29, 2028, local
    const result = toUTCMidnight(leapDay);
    expect(result.toISOString()).toBe('2028-02-29T00:00:00.000Z');
  });
});

describe('fromUTCCalendarDate', () => {
  it('re-anchors a UTC-midnight ISO string to a local Date with matching Y/M/D', () => {
    const result = fromUTCCalendarDate('2026-08-28T00:00:00.000Z');
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(7); // August, 0-indexed
    expect(result.getDate()).toBe(28);
    expect(result.getHours()).toBe(0);
  });

  it('accepts a Date object as well as a string', () => {
    const input = new Date('2026-01-01T00:00:00.000Z');
    const result = fromUTCCalendarDate(input);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
  });

  it('recovers the correct calendar day even for a UTC instant with a non-Zero UTC hour', () => {
    // Simulates a value written by a server in a non-UTC timezone where the
    // stored instant isn't exactly midnight UTC — the calendar day must
    // still be read via UTC getters, not local ones.
    const result = fromUTCCalendarDate('2026-07-28T03:00:00.000Z');
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(6);
    expect(result.getDate()).toBe(28);
  });
});

describe('toUTCMidnight + fromUTCCalendarDate round-trip', () => {
  it('preserves the calendar day through a full write/read cycle regardless of machine timezone', () => {
    const original = new Date(2026, 6, 28, 12, 0, 0);
    const stored = toUTCMidnight(original);
    const read = fromUTCCalendarDate(stored);
    expect(read.getFullYear()).toBe(original.getFullYear());
    expect(read.getMonth()).toBe(original.getMonth());
    expect(read.getDate()).toBe(original.getDate());
  });
});
