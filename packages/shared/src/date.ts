/**
 * Date-only values (schedule due-dates, transaction dates) are stored as a
 * UTC-midnight instant of the intended calendar day, regardless of which
 * timezone the writing/reading process runs in. Every write and read of such
 * a field must go through one of these two helpers instead of local
 * `startOfDay`/`getDate`/`format` — local date-fns functions silently shift
 * the calendar day backward (or forward) whenever the process's timezone
 * offset isn't zero, which is exactly how a UTC backend and a
 * negative-offset client (or vice versa) end up disagreeing on the day.
 */

/**
 * Write side: collapses a Date — interpreted via its own local calendar-day
 * fields at the point of construction — to a UTC-midnight instant for
 * storage.
 */
export function toUTCMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

/**
 * Read side: re-anchors a UTC-midnight-stored Date (or ISO string) into a
 * plain local Date whose Y/M/D match the stored UTC calendar day. Safe to
 * pass into any local date-fns function (`format`, `addMonths`,
 * comparisons) afterward without a timezone-dependent shift.
 */
export function fromUTCCalendarDate(value: Date | string): Date {
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}
