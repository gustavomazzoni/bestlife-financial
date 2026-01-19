'use client';

import { useState } from 'react';
import { useTransactions } from '@/hooks/use-transactions';
import { TransactionCard } from './transaction-card';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TransactionType, NecessityLevel, ValueAlignment } from '@/types';
import { Loader2 } from 'lucide-react';

export function TransactionList() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'ALL'>('ALL');
  const [alignmentFilter, setAlignmentFilter] = useState<'ALL' | 'NON_ALIGNED'>(
    'ALL'
  );

  const { data, isLoading, error } = useTransactions({
    page: 1,
    limit: 50,
    type: typeFilter !== 'ALL' ? typeFilter : undefined,
    sortBy: 'date',
    sortOrder: 'desc',
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-red-500">
          Error loading transactions. Please try again.
        </CardContent>
      </Card>
    );
  }

  const transactions = data?.data || [];

  // Filter transactions
  let filteredTransactions = transactions;

  // Search filter
  if (search) {
    filteredTransactions = filteredTransactions.filter(t =>
      t.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Alignment filter
  if (alignmentFilter === 'NON_ALIGNED') {
    filteredTransactions = filteredTransactions.filter(t => {
      const isNonEssential = t.necessityLevel === NecessityLevel.WANTS;
      const isFreedomLimiting =
        t.valueAlignment === ValueAlignment.FREEDOM_LIMITING;
      const isNotAligned =
        !t.valueAlignment || t.valueAlignment === ValueAlignment.DEFAULT;
      return isNonEssential || isFreedomLimiting || isNotAligned;
    });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search */}
            <div>
              <Input
                placeholder="Search transactions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Type Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  typeFilter === 'ALL'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                All
              </button>
              {Object.values(TransactionType).map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    typeFilter === type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Alignment Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAlignmentFilter('ALL')}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  alignmentFilter === 'ALL'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                All Transactions
              </button>
              <button
                onClick={() => setAlignmentFilter('NON_ALIGNED')}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  alignmentFilter === 'NON_ALIGNED'
                    ? 'bg-amber-500 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Non-Aligned Spending
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Cards */}
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {search || typeFilter !== 'ALL' || alignmentFilter !== 'ALL'
              ? 'No transactions match your filters'
              : 'No transactions yet. Add your first transaction above!'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map(transaction => (
            <TransactionCard key={transaction.id} transaction={transaction} />
          ))}
        </div>
      )}
    </div>
  );
}
