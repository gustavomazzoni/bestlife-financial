import type { CalendarEvent } from '@/types';
import { Badge } from '@/components/ui/badge';
import { TransactionType } from '@/types';

function formatCurrency(value: string): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(parseFloat(value));
}

const typeAmountColor: Record<TransactionType, string> = {
  INCOME: 'text-green-600',
  EXPENSE: 'text-red-600',
  SAVING: 'text-blue-600',
  TRANSFER: 'text-gray-600',
};

interface CalendarEventRowProps {
  event: CalendarEvent;
}

export function CalendarEventRow({ event }: CalendarEventRowProps) {
  const isProjection = event.kind === 'recurring_projection';
  const amountColor = isProjection
    ? 'text-gray-400'
    : typeAmountColor[event.type];

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
        isProjection ? 'border-dashed border-gray-300' : 'border-gray-200'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {event.categoryIcon && (
            <span className="text-sm">{event.categoryIcon}</span>
          )}
          <span className="truncate text-sm font-medium text-gray-900">
            {event.description}
          </span>
          {isProjection && (
            <Badge
              className="bg-gray-100 text-gray-500 text-xs px-1.5 py-0"
              data-testid="event-projected-badge"
            >
              Projetado
            </Badge>
          )}
        </div>
        {event.categoryName && (
          <p className="mt-0.5 text-xs text-gray-500">{event.categoryName}</p>
        )}
      </div>
      <span className={`shrink-0 text-sm font-semibold ${amountColor}`}>
        {formatCurrency(event.amount)}
      </span>
    </div>
  );
}
