import type { CalendarEvent } from '@/types';
import { CalendarEventRow } from './calendar-event-row';

interface DayAgendaProps {
  date: string | null;
  events: CalendarEvent[];
}

export function DayAgenda({ date, events }: DayAgendaProps) {
  return (
    <div className="mt-4" data-testid="day-agenda">
      {date === null ? (
        <p
          className="text-center text-sm text-gray-400"
          data-testid="day-agenda-empty"
        >
          Selecione um dia para ver os eventos
        </p>
      ) : events.length === 0 ? (
        <p className="text-center text-sm text-gray-400">
          Nenhum evento neste dia
        </p>
      ) : (
        <div className="space-y-2">
          {events.map((event, i) => (
            <CalendarEventRow key={`${event.sourceId}-${i}`} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
