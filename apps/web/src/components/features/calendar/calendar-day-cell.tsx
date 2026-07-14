import { format } from 'date-fns';
import type { CalendarEvent } from '@/types';
import { TransactionType } from '@/types';

const dotColor: Record<TransactionType, string> = {
  INCOME: 'bg-green-500',
  EXPENSE: 'bg-red-500',
  SAVING: 'bg-blue-500',
  TRANSFER: 'bg-gray-400',
};

interface CalendarDayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
  onSelect: (date: string) => void;
}

export function CalendarDayCell({
  date,
  isCurrentMonth,
  isToday,
  isSelected,
  events,
  onSelect,
}: CalendarDayCellProps) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayNum = date.getDate();
  const visibleEvents = events.slice(0, 2);
  const overflowCount = events.length - visibleEvents.length;

  return (
    <button
      type="button"
      onClick={() => onSelect(dateStr)}
      data-testid={`calendar-day-${dateStr}`}
      className={`relative flex min-h-[52px] w-full flex-col items-center gap-0.5 rounded-lg p-1 text-xs transition-colors hover:bg-gray-50 ${
        !isCurrentMonth ? 'opacity-40' : ''
      } ${isSelected ? 'bg-indigo-50' : ''}`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
          isSelected
            ? 'bg-indigo-600 text-white'
            : isToday
              ? 'ring-2 ring-indigo-200 text-indigo-700 font-semibold'
              : 'text-gray-700'
        }`}
      >
        {dayNum}
      </span>

      {events.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-0.5">
          {visibleEvents.map((event, i) => (
            <span
              key={i}
              data-testid="event-dot"
              className={`h-1.5 w-1.5 rounded-full ${dotColor[event.type]} ${
                event.kind === 'recurring_projection' ? 'opacity-50' : ''
              }`}
            />
          ))}
          {overflowCount > 0 && (
            <span className="text-[10px] text-gray-400">+{overflowCount}</span>
          )}
        </div>
      )}
    </button>
  );
}
