'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { TransactionInferInput } from './transaction-infer-input';
import { InferredTransactionCard } from './inferred-transaction-card';
import { InferTransactionResult, InferredTransaction } from '@/types/infer';
import { CheckCircle2, XCircle } from 'lucide-react';

export interface TransactionQuickEntryProps {
  onTransactionSaved?: (transaction: InferredTransaction) => void;
  className?: string;
}

type EntryState =
  | { status: 'idle' }
  | { status: 'inferred' }
  | { status: 'saving' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

export function TransactionQuickEntry({
  onTransactionSaved,
  className,
}: TransactionQuickEntryProps) {
  const [state, setState] = React.useState<EntryState>({ status: 'idle' });
  const [inferResult, setInferResult] =
    React.useState<InferTransactionResult>();

  const handleInferComplete = (result: InferTransactionResult) => {
    setState({ status: 'inferred' });
    setInferResult(result);
  };

  const handleInferError = (error: string) => {
    setState({ status: 'error', message: error });
    setTimeout(() => setState({ status: 'idle' }), 3000);
  };

  const handleConfirm = async (transaction: InferredTransaction) => {
    setState({ status: 'saving' });

    try {
      const response = await fetch('/api/v1/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: transaction.amount,
          description: transaction.description,
          date: transaction.date,
          type: transaction.type,
          category: transaction.category?.name ?? 'Outros',
          necessityLevel: transaction.necessityLevel,
          valueAlignment: transaction.valueAlignment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.error?.message || 'Erro ao salvar transação'
        );
      }

      setState({
        status: 'success',
        message: 'Transação salva com sucesso!',
      });
      onTransactionSaved?.(transaction);

      setTimeout(() => setState({ status: 'idle' }), 2000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao salvar transação';
      setState({ status: 'error', message });
      setTimeout(() => setState({ status: 'idle' }), 3000);
    }
  };

  const handleCancel = () => {
    setState({ status: 'idle' });
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Success/Error Messages */}
      {state.status === 'success' && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-700">
          <CheckCircle2 className="h-5 w-5" />
          <span>{state.message}</span>
        </div>
      )}

      {state.status === 'error' && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700">
          <XCircle className="h-5 w-5" />
          <span>{state.message}</span>
        </div>
      )}

      {/* Inferred Transaction Card */}
      {(state.status === 'inferred' || state.status === 'saving') &&
        !!inferResult && (
          <InferredTransactionCard
            result={inferResult}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            isSubmitting={state.status === 'saving'}
          />
        )}

      {/* Input - always visible when idle or showing messages */}
      {(state.status === 'idle' ||
        state.status === 'success' ||
        state.status === 'error') && (
        <TransactionInferInput
          onInferComplete={handleInferComplete}
          onError={handleInferError}
          disabled={state.status !== 'idle'}
        />
      )}
    </div>
  );
}
