import { isSameMonth, isToday, format } from 'date-fns';
import type { CalendarEvent } from '@/types';
import { CalendarDayCell } from './calendar-day-cell';

const DAY_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

interface CalendarGridProps {
  gridDates: Date[];
  currentMonth: Date;
  eventsByDate: Map<string, CalendarEvent[]>;
  selectedDay: string | null;
  onDaySelect: (date: string) => void;
}

export function CalendarGrid({
  gridDates,
  currentMonth,
  eventsByDate,
  selectedDay,
  onDaySelect,
}: CalendarGridProps) {
  return (
    <div data-testid="calendar-grid">
      {/* Day-of-week headers */}
      <div className="mb-1 grid grid-cols-7">
        {DAY_HEADERS.map(day => (
          <div
            key={day}
            className="py-1 text-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 42-cell grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {gridDates.map(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const events = eventsByDate.get(dateStr) ?? [];
          return (
            <CalendarDayCell
              key={dateStr}
              date={date}
              isCurrentMonth={isSameMonth(date, currentMonth)}
              isToday={isToday(date)}
              isSelected={selectedDay === dateStr}
              events={events}
              onSelect={onDaySelect}
            />
          );
        })}
      </div>
    </div>
  );
}
