'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TransactionCard, TransactionWithCategory } from './transaction-card';
import { TransactionType } from '@/types';

type TypeFilter = 'ALL' | TransactionType;

interface Filters {
  type: TypeFilter;
  startDate: string;
  endDate: string;
}

const typeOptions: { value: TypeFilter; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'INCOME', label: 'Receitas' },
  { value: 'EXPENSE', label: 'Despesas' },
  { value: 'SAVING', label: 'Poupança' },
  { value: 'TRANSFER', label: 'Transferências' },
];

export function TransactionList() {
  const [transactions, setTransactions] = React.useState<
    TransactionWithCategory[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [filters, setFilters] = React.useState<Filters>({
    type: 'ALL',
    startDate: '',
    endDate: '',
  });

  const fetchTransactions = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (filters.type !== 'ALL') params.set('type', filters.type);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const response = await fetch(`/api/v1/transactions?${params.toString()}`);
      if (!response.ok) throw new Error('Erro ao carregar transações');

      const json = await response.json();
      setTransactions(json.data ?? []);
      setTotalPages(json.meta?.totalPages ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  React.useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleFilterChange = (patch: Partial<Filters>) => {
    setPage(1);
    setFilters(prev => ({ ...prev, ...patch }));
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden">
          {typeOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleFilterChange({ type: opt.value })}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                filters.type === opt.value
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.startDate}
            onChange={e => handleFilterChange({ startDate: e.target.value })}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:border-gray-400 focus:outline-none"
            placeholder="De"
          />
          <span className="text-gray-400">–</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={e => handleFilterChange({ endDate: e.target.value })}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:border-gray-400 focus:outline-none"
            placeholder="Até"
          />
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-500">
          Carregando...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && transactions.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">
          Nenhuma transação encontrada. Registre sua primeira transação acima.
        </div>
      )}

      {!loading && !error && transactions.length > 0 && (
        <div className="space-y-2">
          {transactions.map(transaction => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p - 1)}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages || loading}
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
