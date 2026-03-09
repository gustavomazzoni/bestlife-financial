import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, CheckCircle2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { UpcomingExecuteButton } from './upcoming-execute-button';
import type { UpcomingItem } from '@/services/dashboard/upcoming';
import { TransactionType } from '@/types';

interface UpcomingTransactionsProps {
  items: UpcomingItem[];
}

const typeAmountColor: Record<TransactionType, string> = {
  INCOME: 'text-green-600',
  EXPENSE: 'text-red-600',
  SAVING: 'text-blue-600',
  TRANSFER: 'text-gray-700',
};

function formatCurrency(value: string): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(parseFloat(value));
}

function formatRelativeDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Hoje';
  if (isTomorrow(date)) return 'Amanhã';
  return format(date, 'EEE, dd/MM', { locale: ptBR });
}

export function UpcomingTransactions({ items }: UpcomingTransactionsProps) {
  const displayed = items.slice(0, 5);

  return (
    <section
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      data-testid="upcoming-transactions"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-700">Esta Semana</h3>
          {items.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
              {items.length}
            </span>
          )}
        </div>
        {items.length > 5 && (
          <Link
            href="/calendar"
            className="text-xs text-indigo-600 hover:underline"
          >
            Ver todos no Calendário →
          </Link>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div
          className="flex flex-col items-center gap-2 py-8 text-center text-gray-400"
          data-testid="upcoming-transactions-empty"
        >
          <CheckCircle2 className="h-8 w-8 text-gray-300" />
          <p className="text-sm">Nenhum compromisso nos próximos 7 dias</p>
        </div>
      )}

      {/* Items */}
      {displayed.length > 0 && (
        <div className="space-y-2">
          {displayed.map(item => (
            <div
              key={item.id}
              data-testid={
                item.isToday ? 'upcoming-item-today' : 'upcoming-item'
              }
              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                item.isToday
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-gray-100 bg-gray-50'
              }`}
            >
              {/* Category icon */}
              <span className="text-lg leading-none" aria-hidden>
                {item.categoryIcon ?? '📋'}
              </span>

              {/* Main content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-gray-900">
                    {item.description}
                  </span>
                  {item.isToday && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
                      HOJE
                    </span>
                  )}
                  {item.kind === 'recurring' && (
                    <RefreshCw className="h-3 w-3 shrink-0 text-gray-400" />
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                  <span>{item.categoryName ?? 'Sem categoria'}</span>
                  <span>·</span>
                  <span>{formatRelativeDate(item.date)}</span>
                </div>
              </div>

              {/* Amount */}
              <span
                className={`shrink-0 text-sm font-semibold ${typeAmountColor[item.type]}`}
              >
                {formatCurrency(item.amount)}
              </span>

              {/* Execute button */}
              <UpcomingExecuteButton
                itemId={item.id}
                kind={item.kind}
                description={item.description}
                transactionId={item.transactionId}
                recurringId={item.recurringId}
              />
            </div>
          ))}
        </div>
      )}

      {items.length > 5 && (
        <div className="mt-3 text-center">
          <Link
            href="/calendar"
            className="text-xs text-indigo-600 hover:underline"
          >
            Ver todos no Calendário →
          </Link>
        </div>
      )}
    </section>
  );
}
