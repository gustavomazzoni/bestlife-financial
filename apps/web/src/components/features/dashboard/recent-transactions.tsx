import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RefreshCw } from 'lucide-react';
import { TransactionType, TransactionRow } from '@/types';

interface RecentTransactionsProps {
  transactions: TransactionRow[];
}

const typeAmountColor: Record<TransactionType, string> = {
  INCOME: 'text-green-600',
  EXPENSE: 'text-red-600',
  SAVING: 'text-blue-600',
  TRANSFER: 'text-gray-600',
};

const typeSign: Record<TransactionType, string> = {
  INCOME: '+',
  EXPENSE: '-',
  SAVING: '',
  TRANSFER: '',
};

function formatCurrency(value: string): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(parseFloat(value));
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div
        data-testid="recent-transactions-empty"
        className="py-8 text-center text-sm text-gray-400"
      >
        Nenhuma transação ainda. Registre sua primeira transação acima.
      </div>
    );
  }

  return (
    <div data-testid="recent-transactions" className="space-y-2">
      {transactions.map(t => (
        <Link
          key={t.id}
          href={`/transactions/${t.id}`}
          data-testid="recent-transaction-item"
          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-gray-300 hover:bg-gray-50"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm">
            {t.category?.icon ?? '💸'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {t.description}
            </p>
            <p className="text-xs text-gray-400">
              {t.category?.name ?? 'Sem categoria'} ·{' '}
              {format(t.date, 'dd MMM', { locale: ptBR })}
              {t.scheduledId && (
                <RefreshCw className="ml-1 inline h-3 w-3 text-gray-300" />
              )}
            </p>
          </div>
          <span
            className={`shrink-0 text-sm font-semibold ${typeAmountColor[t.type]}`}
          >
            {typeSign[t.type]}
            {formatCurrency(t.amount.toString())}
          </span>
        </Link>
      ))}
    </div>
  );
}
