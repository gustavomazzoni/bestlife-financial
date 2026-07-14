'use client';

import * as React from 'react';
import { TransactionList } from '@/components/features/transactions/transaction-list';

export default function TransactionsPage() {
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  React.useEffect(() => {
    const handler = () => setRefreshTrigger(prev => prev + 1);
    window.addEventListener('transaction-saved', handler);
    return () => window.removeEventListener('transaction-saved', handler);
  }, []);

  return (
    <div>
      <div className="container mx-auto space-y-8 p-4 sm:p-8">
        {/* Transaction List */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Histórico
          </h2>
          <TransactionList key={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}
