'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TransactionQuickEntry } from '@/components/features/transactions';
import { TransactionList } from '@/components/features/transactions/transaction-list';
export default function TransactionsPage() {
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const handleTransactionSaved = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white shadow-sm">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Transações</h1>
        </div>
      </nav>

      <div className="container mx-auto space-y-8 p-4 sm:p-8">
        {/* Transaction Quick Entry */}
        <div>
          <div className="mb-4 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Registrar transação
            </h2>
            <p className="text-sm text-gray-500">
              Digite em linguagem natural, ex: &ldquo;Comprei café e pão, R$
              25&rdquo;
            </p>
          </div>
          <TransactionQuickEntry
            className="mx-auto max-w-2xl"
            onTransactionSaved={handleTransactionSaved}
          />
        </div>

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
