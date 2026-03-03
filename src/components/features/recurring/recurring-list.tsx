'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { TransactionType } from '@/types';
import { RecurringCard, RecurringWithCategory } from './recurring-card';

type TypeFilter = 'ALL' | TransactionType;

const typeFilterOptions: { value: TypeFilter; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'INCOME', label: 'Receitas' },
  { value: 'EXPENSE', label: 'Despesas' },
];

export function RecurringList() {
  const [items, setItems] = React.useState<RecurringWithCategory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>('ALL');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [fetchKey, setFetchKey] = React.useState(0);

  const handleRefresh = React.useCallback(() => {
    setFetchKey(k => k + 1);
  }, []);

  React.useEffect(() => {
    async function loadList() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          isActive: 'true',
          page: String(page),
          limit: '20',
        });
        if (typeFilter !== 'ALL') params.set('type', typeFilter);

        const res = await fetch(`/api/v1/recurring?${params}`);
        if (!res.ok) throw new Error('Erro ao carregar recorrências');

        const json = await res.json();
        setItems(json.data ?? []);
        setTotalPages(json.meta?.totalPages ?? 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    loadList();
  }, [typeFilter, page, fetchKey]);

  const handleTypeFilter = (filter: TypeFilter) => {
    setTypeFilter(filter);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Type filter tabs */}
      <div className="flex gap-2">
        {typeFilterOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => handleTypeFilter(opt.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              typeFilter === opt.value
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-gray-200"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* List */}
      {!loading && !error && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-12 text-center">
          <p className="text-gray-500">Nenhuma recorrência ativa</p>
          <p className="mt-1 text-sm text-gray-400">
            Crie uma para acompanhar receitas e despesas fixas
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-3">
          {items.map(item => (
            <RecurringCard
              key={item.id}
              recurring={item}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p - 1)}
            disabled={page <= 1 || loading}
          >
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
          </Button>
        </div>
      )}
    </div>
  );
}
